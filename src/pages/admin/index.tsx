/**
 * /admin — company-internal workspace landing, task P1-11 FE.
 *
 * SSR role gate (requireAdminPageProps): non-admins — guests included — get a
 * plain Next 404 so the internal surface never leaks (two-sides rule,
 * E2E-14). Content stays minimal until the full admin suite (P4-02).
 */
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminHomePage() {
  const { t } = useTranslation("admin");

  return (
    <AdminLayout title={t("home.title")}>
      <h1 className="text-2xl font-extrabold text-ink">{t("home.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("home.subtitle")}</p>

      <Card className="mt-6 max-w-md">
        <CardHeader>
          <CardTitle>{t("layout.nav.moderation")}</CardTitle>
          <CardDescription>{t("home.moderationCard")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin/moderation">{t("home.open")}</Link>
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminPageProps;
