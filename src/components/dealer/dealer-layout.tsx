/**
 * Dealer portal shell (task P3-02, FR-DP1), built on WorkspaceShell.
 *
 * The navigation is role-filtered from the permissions the API returns rather
 * than from anything the client decides: a SALES member never sees Subscription
 * or Team, because the backend would refuse those calls anyway and showing a
 * door that does not open is worse than not showing it.
 *
 * The quota meter lives in the topbar on every page — a dealer's first question
 * on any screen is "can I still publish?", and burying that in one page means
 * they find out by being refused.
 */
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import {
  BarChart3,
  Building2,
  CarFront,
  CreditCard,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  Store,
} from "lucide-react";
import { WorkspaceShell, type WorkspaceNavGroup } from "@/components/workspace/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DealerContextResponse, QuotaState } from "@/lib/marketplace-api";

export interface DealerLayoutProps {
  context: DealerContextResponse;
  quota?: QuotaState | null;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Compact quota meter — colour AND text, never colour alone. */
export function QuotaMeter({ quota }: { quota: QuotaState }) {
  const { t } = useTranslation("dealer");
  const ratio = quota.quota > 0 ? Math.min(quota.occupied / quota.quota, 1) : 1;
  const tone =
    !quota.canPublish ? "danger" : ratio >= 0.9 ? "warning" : "success";

  return (
    <span className="flex items-center gap-2" title={t("quota.tooltip")}>
      <span className="hidden text-xs text-muted sm:inline">{t("quota.label")}</span>
      <span
        className="h-1.5 w-16 overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={t("quota.aria", { occupied: quota.occupied, quota: quota.quota })}
      >
        <span
          className={cn(
            "block h-full rounded-full",
            tone === "danger" && "bg-danger",
            tone === "warning" && "bg-warning",
            tone === "success" && "bg-success",
          )}
          style={{ inlineSize: `${Math.round(ratio * 100)}%` }}
        />
      </span>
      <span className="text-xs font-bold text-ink">
        {quota.occupied}/{quota.quota}
      </span>
    </span>
  );
}

export function DealerLayout({
  context,
  quota,
  title,
  actions,
  children,
}: DealerLayoutProps) {
  const { t } = useTranslation("dealer");
  const dealer = context.dealer;
  const permissions = context.permissions;

  const canBill = permissions?.canManageBilling ?? false;
  const canTeam = permissions?.canManageTeam ?? false;
  const elevated = permissions?.canSeeAllLeads ?? false;

  const groups: WorkspaceNavGroup[] = [
    {
      items: [
        { href: "/dealer", label: t("nav.dashboard"), icon: LayoutDashboard },
        { href: "/dealer/inventory", label: t("nav.inventory"), icon: CarFront },
        { href: "/dealer/leads", label: t("nav.leads"), icon: Inbox },
        { href: "/account/messages", label: t("nav.messages"), icon: MessageCircle },
        {
          href: "/dealer/analytics",
          label: t("nav.analytics"),
          icon: BarChart3,
          visible: elevated,
        },
        {
          href: "/dealer/team",
          label: t("nav.team"),
          icon: Building2,
          visible: canTeam,
        },
        {
          // Editing the dealership had no entry point at all: PATCH /dealers
          // and the updateDealer client both existed with nothing calling them.
          href: "/dealer/profile",
          label: t("nav.profile"),
          icon: Store,
          visible: canTeam,
        },
        {
          href: "/dealer/subscription",
          label: t("nav.subscription"),
          icon: CreditCard,
          visible: canBill,
        },
        {
          href: dealer ? `/dealers/${dealer.slug}` : "/dealer",
          label: t("nav.publicProfile"),
          icon: Store,
        },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>{`${title} — Carsens`}</title>
        {/* Internal surface: never indexed. */}
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <WorkspaceShell
        kind={t("kind")}
        identity={dealer?.name}
        groups={groups}
        title={title}
        actions={
          <>
            {quota && <QuotaMeter quota={quota} />}
            {actions}
          </>
        }
      >
        {dealer && dealer.verificationStatus !== "VERIFIED" && (
          <VerificationBanner status={dealer.verificationStatus} />
        )}
        {children}
      </WorkspaceShell>
    </>
  );
}

/**
 * Verification state is the single most consequential thing about a dealer
 * account — it decides whether their listings auto-publish (FR-M2) or queue for
 * moderation (FR-M3). It is a banner on every page until resolved.
 */
function VerificationBanner({ status }: { status: string }) {
  const { t } = useTranslation("dealer");
  const tone =
    status === "REJECTED" ? "danger" : status === "PENDING" ? "warning" : "info";

  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center justify-between gap-2 rounded-card border p-3 text-sm",
        tone === "danger" && "border-danger/40 bg-danger-soft text-danger-strong",
        tone === "warning" && "border-warning/40 bg-warning-soft text-ink",
        tone === "info" && "border-brand-border bg-brand-surface text-ink",
      )}
    >
      <span className="flex items-center gap-2">
        <Badge variant={status === "REJECTED" ? "red" : "amber"}>
          {t(`verification.status.${status}`)}
        </Badge>
        {t(`verification.message.${status}`)}
      </span>
      {status !== "PENDING" && (
        <Button size="sm" variant="outline" asChild>
          <Link href="/dealer/verification">{t("verification.cta")}</Link>
        </Button>
      )}
    </div>
  );
}
