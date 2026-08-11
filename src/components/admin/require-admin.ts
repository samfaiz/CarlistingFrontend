/**
 * SSR role gate for every /admin/* page — task P1-11 FE (two-sides rule,
 * PRD §1.4 + E2E-14).
 *
 * Anyone who is not ADMIN/SUPER_ADMIN — including guests — gets Next's plain
 * 404 (HTTP 404): the internal surface is never revealed to the customer side,
 * matching the promoted RBAC E2E rows. Authorized admins get their session
 * plus the common+admin translation bundles.
 */
import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export interface AdminPageProps {
  session: Session;
  [key: string]: unknown;
}

export async function requireAdminPageProps(
  ctx: GetServerSidePropsContext,
): Promise<GetServerSidePropsResult<AdminPageProps>> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    return { notFound: true };
  }

  return {
    props: {
      // Strip undefined values (error) — SSR props must serialize.
      session: JSON.parse(JSON.stringify(session)) as Session,
      ...(await serverSideTranslations(
        ctx.locale ?? nextI18NextConfig.i18n.defaultLocale,
        ["common", "admin"],
        nextI18NextConfig,
      )),
    },
  };
}
