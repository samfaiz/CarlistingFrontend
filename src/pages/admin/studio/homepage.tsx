/**
 * /admin/studio/homepage — the Homepage Studio (owner item 6, 2026-08-21).
 *
 * Sections plus a free canvas band: reorder, restyle, schedule and extend the
 * public home page, preview it live in any of the four locales, then publish a
 * version that can be rolled back.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import { HomepageEditor } from "@/components/admin/homepage-editor";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/api";
import nextI18NextConfig from "../../../../next-i18next.config.js";

export default function HomepageStudioPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  /**
   * The shared helpers throw on non-2xx; the editor needs the status to tell a
   * 403 (no publish grant) from a 409 (published layout is frozen) from a real
   * failure, so unwrap ApiError back into a status/body pair.
   */
  const api = React.useCallback(
    async (path: string, init?: RequestInit): Promise<{ status: number; body: unknown }> => {
      const method = (init?.method ?? "GET").toUpperCase();
      const body = init?.body ? (JSON.parse(String(init.body)) as unknown) : undefined;
      try {
        if (method === "GET") return { status: 200, body: await apiGet(path, { token }) };
        if (method === "POST") return { status: 201, body: await apiPost(path, body ?? {}, { token }) };
        if (method === "PATCH") return { status: 200, body: await apiPatch(path, body ?? {}, { token }) };
        if (method === "DELETE") return { status: 200, body: await apiDelete(path, { token }) };
        return { status: 405, body: null };
      } catch (e) {
        if (e instanceof ApiError) return { status: e.statusCode, body: { message: e.message, error: e.error } };
        return { status: 0, body: { message: String(e) } };
      }
    },
    [token],
  );

  return (
    <>
      <Head>
        <title>{t("homepage.pageTitle")}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <AdminLayout title={t("homepage.pageTitle")}>
        <div className="mb-4">
          <h1 className="text-xl font-semibold">{t("homepage.pageTitle")}</h1>
          <p className="text-sm text-muted">{t("homepage.pageIntro")}</p>
        </div>
        {token ? <HomepageEditor api={api} /> : <p className="text-muted">{t("homepage.loading")}</p>}
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const guard = await requireAdminPageProps(ctx);
  if ("notFound" in guard || "redirect" in guard) return guard;
  return {
    props: {
      ...(await guard.props),
      ...(await serverSideTranslations(
        ctx.locale ?? nextI18NextConfig.i18n.defaultLocale,
        ["common", "admin", "mk-home"],
        nextI18NextConfig,
      )),
    },
  };
};
