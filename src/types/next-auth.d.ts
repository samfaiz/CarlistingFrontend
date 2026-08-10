/**
 * NextAuth v4 module augmentation — task P0-05.
 * Session/JWT carry the backend token pair plus the profile fields the UI needs.
 */
import type { DefaultSession } from "next-auth";

export type SessionError = "RefreshFailed";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      emailVerifiedAt: string | null;
    };
    /** Backend access token (JWT, 15 min) for calling the API from the client. */
    accessToken?: string;
    /** Set when silent refresh-rotation failed — the UI must sign the user out. */
    error?: SessionError;
  }

  /** Shape returned by `authorize()` (login + /users/me merged). */
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    locale: string;
    emailVerifiedAt: string | null;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerifiedAt: string | null;
    accessToken: string;
    refreshToken: string;
    /** Epoch ms when the access token expires. */
    accessTokenExpires: number;
    error?: SessionError;
  }
}
