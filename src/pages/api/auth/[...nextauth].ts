/**
 * NextAuth v4 (JWT strategy) wired to the backend auth contract — task P0-05 (FR-A1–A2).
 *
 * - CredentialsProvider: POST /auth/login, then GET /users/me for the profile.
 * - jwt() stores the backend token pair + expiry, and performs REFRESH ROTATION
 *   when the access token is within 60s of expiry: POST /auth/refresh returns a
 *   NEW pair (the old refresh token dies) — both are stored. On failure the
 *   token is marked error:"RefreshFailed" and the client signs the user out.
 * - session() exposes {user:{id,email,name,role,emailVerifiedAt}, accessToken, error}.
 *
 * Known P0 limitation (revisit with the account area, P2): concurrent requests
 * can race the rotation — the loser's refresh token is already dead and the
 * session degrades to RefreshFailed → re-login. Acceptable for the stub.
 */
import NextAuth, { type AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

/** Refresh when the access token is within this window of its expiry. */
const REFRESH_WINDOW_MS = 60_000;
/** Fallback lifetime if the JWT exp claim cannot be decoded (contract: 15 min). */
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  locale: string;
  role: string;
  emailVerifiedAt: string | null;
}

/** Read the `exp` claim (epoch ms) off the backend access-token JWT. */
function decodeAccessTokenExpiry(accessToken: string): number {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"),
    ) as { exp?: number };
    if (typeof payload.exp === "number") return payload.exp * 1000;
  } catch {
    // fall through to the contract default below
  }
  return Date.now() + ACCESS_TOKEN_TTL_MS;
}

/** POST /auth/refresh with rotation: store the NEW pair; the old refresh token is dead. */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });
    if (!res.ok) throw new Error(`refresh failed with ${res.status}`);
    const rotated = (await res.json()) as LoginResponse;
    return {
      ...token,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken, // ROTATION — never reuse the old one
      accessTokenExpires: decodeAccessTokenExpiry(rotated.accessToken),
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshFailed" };
  }
}

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    // Customer-facing auth pages (two-sides rule) — never NextAuth's built-ins.
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("InvalidCredentials");
        }

        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        if (!loginRes.ok) {
          // Thrown message becomes signIn()'s `error` — mapped to copy client-side.
          if (loginRes.status === 401) throw new Error("InvalidCredentials");
          if (loginRes.status === 429) throw new Error("Lockout");
          throw new Error("AuthError");
        }
        const tokens = (await loginRes.json()) as LoginResponse;

        const meRes = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (!meRes.ok) throw new Error("AuthError");
        const me = (await meRes.json()) as MeResponse;

        return {
          id: me.id,
          email: me.email,
          name: me.name,
          role: me.role,
          locale: me.locale,
          emailVerifiedAt: me.emailVerifiedAt,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpires: decodeAccessTokenExpiry(tokens.accessToken),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in: seed the NextAuth JWT from authorize()'s result.
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerifiedAt: user.emailVerifiedAt,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: user.accessTokenExpires,
        };
      }
      // WebAuthn step-up (P4-01): the backend minted a fresh pair carrying
      // amr=webauthn; the client hands it over via useSession().update(). A
      // forged pair is harmless — the API verifies signatures on every call.
      if (
        trigger === "update" &&
        typeof (session as { accessToken?: unknown })?.accessToken === "string" &&
        typeof (session as { refreshToken?: unknown })?.refreshToken === "string"
      ) {
        const pair = session as { accessToken: string; refreshToken: string };
        return {
          ...token,
          accessToken: pair.accessToken,
          refreshToken: pair.refreshToken,
          accessTokenExpires: decodeAccessTokenExpiry(pair.accessToken),
          error: undefined,
        };
      }
      // Still comfortably valid — reuse.
      if (Date.now() < token.accessTokenExpires - REFRESH_WINDOW_MS) {
        return token;
      }
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        emailVerifiedAt: token.emailVerifiedAt,
      };
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
};

export default NextAuth(authOptions);
