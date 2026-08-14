/**
 * /admin/crm — Sales CRM Kanban (G1-03, FR-SC2/SC3, AC-SC-02).
 *
 * dnd-kit drag-drop between stage columns; the SERVER enforces stage rules —
 * a 422 STAGE_RULE_* answer opens the note/reason dialog and the move retries
 * with both. Pipeline switcher covers New Business + Renewals.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  crmBoard,
  crmCreateDeal,
  crmListAccounts,
  crmMoveDeal,
  crmOutcomeReasons,
  type CrmBoard,
  type CrmDealCard,
  type CrmOutcomeReason,
  type CrmStageCol,
} from "@/components/admin/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

const fmt = (n: number) => `AED ${n.toLocaleString("en-US")}`;

function DealCard({ deal }: { deal: CrmDealCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-deal={deal.id}
      className="cursor-grab rounded-md border border-line bg-white p-3 shadow-soft active:cursor-grabbing"
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.6 : 1,
        touchAction: "none",
      }}
    >
      <div className="text-sm font-semibold text-ink">{deal.title}</div>
      <div className="mt-0.5 text-xs text-muted">{deal.account.name}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-bold text-brand">{fmt(deal.valueAed)}</span>
        {deal.package && <Badge variant="navy">{deal.package.tier}</Badge>}
      </div>
      {deal.outcomeReason && (
        <div className="mt-1 text-[11px] text-muted">{deal.outcomeReason.label}</div>
      )}
    </div>
  );
}

function StageColumn({ stage }: { stage: CrmStageCol }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      data-stage={stage.slug}
      className={`flex w-64 shrink-0 flex-col rounded-panel border p-2 ${isOver ? "border-brand bg-brand/5" : "border-line bg-page/60"}`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-bold text-ink">{stage.name}</span>
        <span className="text-xs text-muted">
          {stage.kind === "OPEN" ? `${stage.probability}%` : stage.kind} · {stage.deals.length}
        </span>
      </div>
      <div className="flex min-h-[80px] flex-col gap-2">
        {stage.deals.map((d) => <DealCard key={d.id} deal={d} />)}
      </div>
    </div>
  );
}

export default function AdminCrmPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [pipeline, setPipeline] = React.useState("new-business");
  const [board, setBoard] = React.useState<CrmBoard | null>(null);
  const [reasons, setReasons] = React.useState<CrmOutcomeReason[]>([]);
  const [busy, setBusy] = React.useState(false);
  // Pending move blocked by a stage rule (AC-SC-02): dialog collects note+reason.
  const [ruleMove, setRuleMove] = React.useState<{ dealId: string; stage: CrmStageCol } | null>(null);
  const [ruleNote, setRuleNote] = React.useState("");
  const [ruleReason, setRuleReason] = React.useState("");
  const [newOpen, setNewOpen] = React.useState(false);
  const [accounts, setAccounts] = React.useState<{ id: string; name: string }[]>([]);
  const [newDeal, setNewDeal] = React.useState({ accountId: "", title: "", valueAed: "" });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const load = React.useCallback(async () => {
    if (!token) return;
    try {
      const [b, r] = await Promise.all([crmBoard(pipeline, token), crmOutcomeReasons(token)]);
      setBoard(b);
      setReasons(r);
    } catch {
      toast({ title: t("crm.toast.loadFailed", { defaultValue: "Could not load the board" }), variant: "warning" });
    }
  }, [token, pipeline, t]);
  React.useEffect(() => { void load(); }, [load]);

  const doMove = async (dealId: string, stage: CrmStageCol, note?: string, reasonId?: string) => {
    if (!token) return;
    setBusy(true);
    try {
      await crmMoveDeal(dealId, { stageId: stage.id, note, reasonId }, token);
      setRuleMove(null); setRuleNote(""); setRuleReason("");
      void load();
    } catch (err) {
      const code = (err as { error?: string }).error ?? "";
      if (code.startsWith("STAGE_RULE")) {
        // Server blocked the move (AC-SC-02) — collect what the rule demands.
        setRuleMove({ dealId, stage });
      } else {
        toast({ title: t("crm.toast.moveFailed", { defaultValue: "Move not allowed" }), variant: "warning" });
      }
    } finally { setBusy(false); }
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!board || !event.over) return;
    const stage = board.stages.find((s) => s.id === event.over?.id);
    const dealId = String(event.active.id);
    if (!stage) return;
    const from = board.stages.find((s) => s.deals.some((d) => d.id === dealId));
    if (from?.id === stage.id) return;
    // Rules known client-side short-circuit a doomed round-trip; the server
    // remains the authority (it re-checks everything).
    if (stage.rules?.requireNote || stage.kind === "LOST") {
      setRuleMove({ dealId, stage });
      return;
    }
    void doMove(dealId, stage);
  };

  const openNewDeal = async () => {
    if (!token) return;
    try {
      const res = await crmListAccounts(token, { limit: 50 });
      setAccounts(res.items.filter((a) => a.dedupeStatus !== "MERGED").map((a) => ({ id: a.id, name: a.name })));
      setNewOpen(true);
    } catch {
      toast({ title: t("crm.toast.loadFailed", { defaultValue: "Could not load the board" }), variant: "warning" });
    }
  };

  const createDeal = async () => {
    if (!token || !newDeal.accountId || !newDeal.title.trim()) return;
    setBusy(true);
    try {
      await crmCreateDeal({ accountId: newDeal.accountId, title: newDeal.title.trim(), valueAed: Number(newDeal.valueAed) || 0 }, token);
      toast({ title: t("crm.toast.dealCreated", { defaultValue: "Deal created" }) });
      setNewOpen(false); setNewDeal({ accountId: "", title: "", valueAed: "" });
      void load();
    } catch {
      toast({ title: t("crm.toast.moveFailed", { defaultValue: "Move not allowed" }), variant: "warning" });
    } finally { setBusy(false); }
  };

  const ruleReasons = reasons.filter((r) => r.kind === (ruleMove?.stage.kind === "WON" ? "WON" : "LOST"));

  return (
    <AdminLayout title={t("crm.title", { defaultValue: "Sales CRM" })}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-md border border-line bg-white px-2 text-sm"
          value={pipeline}
          onChange={(e) => setPipeline(e.target.value)}
        >
          <option value="new-business">{t("crm.pipelineNew", { defaultValue: "New Business" })}</option>
          <option value="renewals">{t("crm.pipelineRenewals", { defaultValue: "Renewals" })}</option>
        </select>
        {board && (
          <span className="text-sm text-muted">
            {t("crm.totalOpen", { defaultValue: "Open" })}: <b className="text-ink">{fmt(board.totals.open)}</b> · {t("crm.totalWon", { defaultValue: "Won" })}: <b className="text-success">{fmt(board.totals.won)}</b>
          </span>
        )}
        <div className="ms-auto">
          <Button size="sm" onClick={() => void openNewDeal()}>{t("crm.newDeal", { defaultValue: "New deal" })}</Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {board?.stages.map((s) => <StageColumn key={s.id} stage={s} />)}
        </div>
      </DndContext>

      {/* Stage-rule dialog (AC-SC-02): the move stays blocked until satisfied */}
      <Dialog open={ruleMove != null} onOpenChange={(o) => !o && setRuleMove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("crm.ruleTitle", { stage: ruleMove?.stage.name ?? "", defaultValue: 'Moving to "{{stage}}" needs details' })}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>{t("crm.ruleNote", { defaultValue: "Note (required)" })}</Label>
              <Textarea rows={3} value={ruleNote} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRuleNote(e.target.value)} placeholder={t("crm.ruleNotePlaceholder", { defaultValue: "Why is this deal closing?" })} />
            </div>
            {ruleMove?.stage.kind === "LOST" && (
              <div className="grid gap-1">
                <Label>{t("crm.ruleReason", { defaultValue: "Loss reason (required)" })}</Label>
                <select className="h-9 rounded-md border border-line bg-white px-2 text-sm" value={ruleReason} onChange={(e) => setRuleReason(e.target.value)}>
                  <option value="">—</option>
                  {ruleReasons.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleMove(null)}>{t("crm.cancel", { defaultValue: "Cancel" })}</Button>
            <Button
              disabled={busy || !ruleNote.trim() || (ruleMove?.stage.kind === "LOST" && !ruleReason)}
              onClick={() => ruleMove && void doMove(ruleMove.dealId, ruleMove.stage, ruleNote.trim(), ruleReason || undefined)}
            >
              {t("crm.ruleConfirm", { defaultValue: "Move deal" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New deal */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("crm.newDeal", { defaultValue: "New deal" })}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>{t("crm.account", { defaultValue: "Account" })}</Label>
              <select className="h-9 rounded-md border border-line bg-white px-2 text-sm" value={newDeal.accountId} onChange={(e) => setNewDeal((p) => ({ ...p, accountId: e.target.value }))}>
                <option value="">—</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="grid gap-1">
              <Label>{t("crm.dealTitle", { defaultValue: "Title" })}</Label>
              <Input value={newDeal.title} onChange={(e) => setNewDeal((p) => ({ ...p, title: e.target.value }))} placeholder="Gold package upgrade" />
            </div>
            <div className="grid gap-1">
              <Label>{t("crm.dealValue", { defaultValue: "Value (AED)" })}</Label>
              <Input type="number" min={0} value={newDeal.valueAed} onChange={(e) => setNewDeal((p) => ({ ...p, valueAed: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>{t("crm.cancel", { defaultValue: "Cancel" })}</Button>
            <Button onClick={() => void createDeal()} disabled={busy || !newDeal.accountId || !newDeal.title.trim()}>{t("crm.create", { defaultValue: "Create" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return { props: { ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
