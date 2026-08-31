/**
 * Asking for a package (self-serve checkout is a documented v1 exclusion).
 *
 * A dealership states what it wants; staff decide and issue the invoice. So the
 * copy never says "buy" — it says "ask", and the open request is shown with its
 * real state so nobody wonders whether the ask landed.
 *
 * Two live-API shapes differ from the shared client's declared types, and this
 * file adapts rather than editing the shared client:
 *  - GET .../subscription/packages returns a BARE ARRAY, not `{ items }`;
 *  - a plan request carries a nested `package` object, not `packageId`.
 * Both are read defensively so either shape works.
 */
import * as React from "react";
import { Loader2, Send } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { ConfirmDialog } from "@/components/dealer/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import {
  getPlanRequest,
  getSellablePackages,
  requestPlan,
  withdrawPlanRequest,
  type PlanRequest,
  type SellablePackage,
} from "@/lib/marketplace-api";

/** The request as the API actually returns it (nested package, no packageId). */
type PlanRequestRow = Omit<PlanRequest, "packageId"> & {
  packageId?: string;
  package?: { id: string; name: string; tier: string } | null;
};

const REQUEST_VARIANT: Record<string, "green" | "amber" | "red" | "neutral"> = {
  PENDING: "amber",
  APPROVED: "green",
  DECLINED: "red",
  WITHDRAWN: "neutral",
};

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso)) : "—";

export interface PlanChooserProps {
  dealerId: string;
  accessToken: string;
  /** Tier of the live subscription, so the current plan is marked. */
  currentTier?: string | null;
  /** Quota and invoices change once a plan is granted. */
  onChanged?: () => void;
}

export function PlanChooser({
  dealerId,
  accessToken,
  currentTier,
  onChanged,
}: PlanChooserProps) {
  const { t } = useTranslation("dealer");

  const [packages, setPackages] = React.useState<SellablePackage[]>([]);
  const [request, setRequest] = React.useState<PlanRequestRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [target, setTarget] = React.useState<SellablePackage | null>(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [rawPackages, open] = await Promise.all([
        getSellablePackages(dealerId, accessToken) as unknown as Promise<
          SellablePackage[] | { items?: SellablePackage[] }
        >,
        getPlanRequest(dealerId, accessToken) as Promise<PlanRequestRow | null>,
      ]);
      setPackages(
        Array.isArray(rawPackages) ? rawPackages : (rawPackages?.items ?? []),
      );
      setRequest(open);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, dealerId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const showFailure = (err: unknown, fallbackKey: string) => {
    toast({
      title: err instanceof ApiError ? err.message : t(fallbackKey),
      variant: "warning",
    });
  };

  const submit = async () => {
    if (!target || busy) return;
    setBusy(true);
    try {
      const created = (await requestPlan(
        dealerId,
        { packageId: target.id, ...(note.trim() ? { note: note.trim() } : {}) },
        accessToken,
      )) as PlanRequestRow;
      setRequest(created);
      setTarget(null);
      setNote("");
      toast({ title: t("plans.requested"), variant: "success" });
      onChanged?.();
    } catch (err) {
      showFailure(err, "plans.failed");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // The response is the WITHDRAWN row; keeping it on screen is the only
      // honest way to show a decided request, since the GET only ever returns
      // the PENDING one.
      const withdrawn = (await withdrawPlanRequest(
        dealerId,
        accessToken,
      )) as PlanRequestRow;
      setRequest(withdrawn);
      setWithdrawOpen(false);
      toast({ title: t("plans.withdrawn"), variant: "success" });
      onChanged?.();
    } catch (err) {
      showFailure(err, "plans.failed");
    } finally {
      setBusy(false);
    }
  };

  const requestedName =
    request?.package?.name ?? t("plans.unknownPackage");
  const openRequest = request?.status === "PENDING";

  return (
    <section className="mt-6">
      <h2 className="mb-1 text-sm font-bold text-ink">{t("plans.title")}</h2>
      <p className="mb-3 text-sm text-muted">{t("plans.hint")}</p>

      {request && (
        <Panel className="mb-3 p-4">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
            {t("plans.openTitle")}
            <Badge variant={REQUEST_VARIANT[request.status] ?? "neutral"}>
              {t(`plans.requestStatus.${request.status}`, {
                defaultValue: request.status,
              })}
            </Badge>
            <span className="font-normal text-muted">{requestedName}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {openRequest
              ? t("plans.pendingSince", { date: formatDate(request.createdAt) })
              : t("plans.decidedOn", { date: formatDate(request.decidedAt) })}
          </p>
          {request.note && (
            <p className="mt-1 text-sm text-muted">
              {t("plans.yourNote", { note: request.note })}
            </p>
          )}
          {request.declineReason && (
            <p className="mt-1 text-sm text-danger-strong">
              {t("plans.declineReason", { reason: request.declineReason })}
            </p>
          )}
          {openRequest && (
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => setWithdrawOpen(true)}
            >
              {t("plans.withdraw")}
            </Button>
          )}
        </Panel>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("plans.title")}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const isCurrent = currentTier != null && pkg.tier === currentTier;
            return (
              <li key={pkg.id}>
                <Card className="flex h-full flex-col p-4">
                  <p className="flex items-center justify-between gap-2">
                    <span className="text-base font-extrabold text-ink">{pkg.name}</span>
                    {isCurrent && (
                      <Badge variant="green">{t("plans.currentBadge")}</Badge>
                    )}
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-brand">
                    {formatPrice(pkg.priceAed, "en")}{" "}
                    <span className="text-xs font-normal text-muted">
                      {t("plans.term", { count: pkg.termMonths })}
                    </span>
                  </p>
                  <ul className="mt-2 flex-1 space-y-1 text-sm text-muted">
                    <li>{t("plans.quota", { count: pkg.listingQuota })}</li>
                    <li>{t("plans.boosts", { count: pkg.boostCredits })}</li>
                  </ul>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant={isCurrent ? "outline" : "primary"}
                    disabled={openRequest || isCurrent}
                    aria-label={t("plans.chooseAria", { plan: pkg.name })}
                    onClick={() => {
                      setTarget(pkg);
                      setNote("");
                    }}
                  >
                    {t("plans.choose")}
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("plans.dialogTitle", { plan: target?.name ?? "" })}
            </DialogTitle>
            <DialogDescription>{t("plans.dialogBody")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-note">{t("plans.noteLabel")}</Label>
            <Textarea
              id="plan-note"
              value={note}
              maxLength={500}
              placeholder={t("plans.notePlaceholder")}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setTarget(null)}>
              {t("plans.cancel")}
            </Button>
            <Button disabled={busy} onClick={() => void submit()}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              {t("plans.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title={t("plans.withdrawConfirm.title")}
        body={t("plans.withdrawConfirm.body")}
        confirmLabel={t("plans.withdrawConfirm.confirm")}
        cancelLabel={t("plans.withdrawConfirm.cancel")}
        busy={busy}
        onConfirm={() => void withdraw()}
      />
    </section>
  );
}
