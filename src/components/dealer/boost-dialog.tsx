/**
 * Apply-boost dialog (task P3-08 FE, FR-DP6).
 *
 * Product picker with cost vs wallet balance. The server owns every rule —
 * LIVE-only, one live boost per slot, sufficient credits — so this dialog
 * surfaces its refusals verbatim (a 409 message names the actual problem)
 * rather than pre-computing eligibility client-side and drifting.
 */
import { useTranslation } from "next-i18next/pages";
import * as React from "react";
import { Loader2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  applyBoost,
  getBoostProducts,
  getDealerBoosts,
  type BoostProductRow,
} from "@/lib/marketplace-api";

export function BoostDialog({
  dealerId,
  accessToken,
  listing,
  onOpenChange,
  onApplied,
}: {
  dealerId: string;
  accessToken: string;
  /** null = closed */
  listing: { id: string; label: string } | null;
  onOpenChange: (open: boolean) => void;
  onApplied?: () => void;
}) {
  const { t } = useTranslation("dealer");
  const [products, setProducts] = React.useState<BoostProductRow[]>([]);
  const [balance, setBalance] = React.useState<number | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!listing) return;
    setLoading(true);
    setSelected(null);
    Promise.all([
      getBoostProducts(),
      getDealerBoosts(dealerId, accessToken),
    ])
      .then(([rows, wallet]) => {
        setProducts(rows);
        setBalance(wallet.balance);
        setSelected(rows[0]?.key ?? null);
      })
      .catch(() => toast({ title: t("errors.load"), variant: "warning" }))
      .finally(() => setLoading(false));
  }, [listing, dealerId, accessToken, t]);

  const product = products.find((p) => p.key === selected);
  const affordable = product && balance != null && balance >= product.creditCost;

  const apply = async () => {
    if (!listing || !product) return;
    setBusy(true);
    try {
      await applyBoost(
        dealerId,
        { listingId: listing.id, productKey: product.key },
        accessToken,
      );
      toast({ title: t("boosts.toast.applied"), variant: "success" });
      onOpenChange(false);
      onApplied?.();
    } catch (err) {
      toast({
        title:
          err instanceof ApiError && err.statusCode === 409
            ? err.message
            : t("boosts.toast.failed"),
        variant: "warning",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(listing)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-4 text-brand-mid" aria-hidden />
            {t("boosts.dialogTitle")}
          </DialogTitle>
        </DialogHeader>

        {listing && (
          <p className="text-sm text-muted">{listing.label}</p>
        )}

        {loading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
          </div>
        ) : (
          <>
            <div role="radiogroup" aria-label={t("boosts.dialogTitle")} className="space-y-2">
              {products.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  role="radio"
                  aria-checked={selected === row.key}
                  onClick={() => setSelected(row.key)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-card border p-3 text-start text-sm transition-colors",
                    selected === row.key
                      ? "border-brand-mid bg-brand-surface"
                      : "border-line bg-card hover:border-brand-border",
                  )}
                >
                  <span>
                    <span className="block font-semibold text-ink">{row.name}</span>
                    <span className="text-xs text-muted">
                      {t("boosts.duration", { days: row.durationDays })} ·{" "}
                      {t(`boosts.slot.${row.slot}`)}
                    </span>
                  </span>
                  <Badge variant="navy">
                    {t("boosts.credits", { count: row.creditCost })}
                  </Badge>
                </button>
              ))}
            </div>

            <p className="mt-3 text-sm text-muted">
              {t("boosts.balance", { count: balance ?? 0 })}
              {product && !affordable && (
                <span className="ms-2 text-warning-strong">
                  {t("boosts.insufficient")}
                </span>
              )}
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("boosts.cancel")}
              </Button>
              <Button disabled={busy || !product || !affordable} onClick={() => void apply()}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Zap aria-hidden />}
                {t("boosts.apply")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
