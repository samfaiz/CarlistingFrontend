/**
 * /dealer/verification — trade licence upload + status (task P3-01, FR-DP9).
 *
 * Presign → PUT → submit; the backend scans the object before it touches the
 * profile. VERIFIED is the prize: submissions skip moderation from then on.
 */
import type { GetServerSideProps } from "next";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import * as React from "react";
import { BadgeCheck, FileUp, Loader2 } from "lucide-react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { DealerOnboarding } from "@/components/dealer/dealer-onboarding";
import { useDealer } from "@/components/dealer/use-dealer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import {
  presignUpload,
  submitDealerVerification,
  type UploadContentType,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

const ACCEPTED: UploadContentType[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const STATUS_VARIANT: Record<string, "green" | "amber" | "red" | "neutral"> = {
  VERIFIED: "green",
  PENDING: "amber",
  REJECTED: "red",
  UNVERIFIED: "neutral",
};

export default function DealerVerificationPage() {
  const { t } = useTranslation("dealer");
  const { context, quota, loading, error, needsOnboarding, accessToken, refresh } =
    useDealer();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const dealer = context?.dealer;
  const isOwner = context?.permissions?.role === "OWNER" || context?.permissions?.isStaff;

  const upload = async (file: File) => {
    if (!accessToken || !dealer) return;
    if (!ACCEPTED.includes(file.type as UploadContentType)) {
      toast({ title: t("verification.page.badType"), variant: "warning" });
      return;
    }
    setBusy(true);
    try {
      const presigned = await presignUpload(file.type as UploadContentType, accessToken);
      const put = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error(`PUT ${put.status}`);
      await submitDealerVerification(dealer.id, presigned.key, accessToken);
      toast({ title: t("verification.page.submitted"), variant: "success" });
      await refresh();
    } catch (err) {
      toast({
        title:
          err instanceof ApiError && err.statusCode === 422
            ? t("verification.page.infected")
            : t("verification.page.failed"),
        variant: "warning",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
      </main>
    );
  }
  if (needsOnboarding) return <DealerOnboarding onCreated={refresh} />;
  if (error || !context || !dealer) {
    return <main className="p-8 text-sm text-muted">{t("errors.load")}</main>;
  }

  const status = dealer.verificationStatus;

  return (
    <DealerLayout context={context} quota={quota} title={t("verification.page.title")}>
      <div className="mx-auto max-w-xl">
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <BadgeCheck
              className={status === "VERIFIED" ? "size-5 text-success" : "size-5 text-muted"}
              aria-hidden
            />
            <h2 className="text-base font-bold text-ink">
              {t("verification.page.statusHeading")}
            </h2>
            <Badge variant={STATUS_VARIANT[status]}>
              {status === "VERIFIED"
                ? t("verification.page.verified")
                : t(`verification.status.${status}`, { defaultValue: status })}
            </Badge>
          </div>

          <p className="mt-2 text-sm text-muted">
            {status === "VERIFIED"
              ? t("verification.page.verifiedHint")
              : t(`verification.message.${status}`, { defaultValue: "" })}
          </p>

          {status === "REJECTED" && dealer.verificationNote && (
            <blockquote className="mt-3 rounded-card border-s-2 border-danger bg-page p-3 text-sm text-ink">
              {dealer.verificationNote}
            </blockquote>
          )}

          {status !== "VERIFIED" && status !== "PENDING" && (
            <div className="mt-4">
              {isOwner ? (
                <>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    id="licence-file"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void upload(file);
                    }}
                  />
                  <Button
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                  >
                    {busy ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : (
                      <FileUp aria-hidden />
                    )}
                    {t("verification.page.upload")}
                  </Button>
                  <p className="mt-2 text-xs text-muted">
                    {t("verification.page.formats")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">{t("verification.page.ownerOnly")}</p>
              )}
            </div>
          )}
        </Panel>
      </div>
    </DealerLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return {
      redirect: {
        destination: `${prefix}/login?next=/dealer/verification`,
        permanent: false,
      },
    };
  }
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dealer", "listings", "home"],
        nextI18NextConfig,
      )),
    },
  };
};
