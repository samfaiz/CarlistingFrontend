/**
 * Team invitations (dealer side of the seat-filling flow).
 *
 * Until this existed a dealership could change and remove members but had no
 * way to ADD one — the only route in was a staff-side database edit.
 *
 * Two rules mirror the backend rather than second-guessing it:
 *  - only OWNER/MANAGER may write invitations (`canInviteMembers`), so the
 *    controls are hidden for SALES instead of rendered into a 403;
 *  - only an OWNER may mint an OWNER invite, so MANAGER does not see that role
 *    in the picker.
 * Everything else — "that person is already on this team", "only a pending
 * invitation can be re-sent" — is the server's refusal, shown verbatim.
 */
import * as React from "react";
import { Loader2, MailPlus, RotateCcw, Send, Trash2 } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { ConfirmDialog } from "@/components/dealer/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { ApiError } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import {
  inviteDealerMember,
  listDealerInvites,
  resendDealerInvite,
  revokeDealerInvite,
  type DealerInviteRow,
  type DealerMemberRole,
} from "@/lib/marketplace-api";

const STATUS_VARIANT: Record<DealerInviteRow["status"], "green" | "amber" | "red" | "neutral"> = {
  PENDING: "amber",
  ACCEPTED: "green",
  REVOKED: "neutral",
  EXPIRED: "red",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface TeamInvitesProps {
  dealerId: string;
  accessToken: string;
  /** OWNER/MANAGER (or staff) — the backend's canInviteMembers. */
  canInvite: boolean;
  /** Only an owner may mint another owner. */
  canInviteOwner: boolean;
  /** Refetch the member list after an invitation is accepted elsewhere. */
  onChanged?: () => void;
}

export function TeamInvites({
  dealerId,
  accessToken,
  canInvite,
  canInviteOwner,
  onChanged,
}: TeamInvitesProps) {
  const { t } = useTranslation("dealer");

  const [rows, setRows] = React.useState<DealerInviteRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<DealerMemberRole>("SALES");
  const [sending, setSending] = React.useState(false);

  const [resendTarget, setResendTarget] = React.useState<DealerInviteRow | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<DealerInviteRow | null>(null);
  const [busy, setBusy] = React.useState(false);

  const roles: DealerMemberRole[] = canInviteOwner
    ? ["OWNER", "MANAGER", "SALES"]
    : ["MANAGER", "SALES"];

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await listDealerInvites(dealerId, accessToken);
      setRows(page.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.load"));
    } finally {
      setLoading(false);
    }
  }, [accessToken, dealerId, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  /** Refusals from this API are specific and actionable — never swallow them. */
  const showFailure = (err: unknown, fallbackKey: string) => {
    toast({
      title: err instanceof ApiError ? err.message : t(fallbackKey),
      variant: "warning",
    });
  };

  const submitInvite = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || sending) return;
    setSending(true);
    try {
      await inviteDealerMember(dealerId, { email: value, role }, accessToken);
      toast({ title: t("invites.sent", { email: value }), variant: "success" });
      setInviteOpen(false);
      setEmail("");
      setRole("SALES");
      await load();
    } catch (err) {
      showFailure(err, "invites.failed");
    } finally {
      setSending(false);
    }
  };

  const doResend = async () => {
    if (!resendTarget || busy) return;
    setBusy(true);
    try {
      await resendDealerInvite(dealerId, resendTarget.id, accessToken);
      toast({
        title: t("invites.resent", { email: resendTarget.email }),
        variant: "success",
      });
      setResendTarget(null);
      await load();
    } catch (err) {
      showFailure(err, "invites.failed");
    } finally {
      setBusy(false);
    }
  };

  const doRevoke = async () => {
    if (!revokeTarget || busy) return;
    setBusy(true);
    try {
      await revokeDealerInvite(dealerId, revokeTarget.id, accessToken);
      toast({ title: t("invites.revoked"), variant: "success" });
      setRevokeTarget(null);
      await load();
      onChanged?.();
    } catch (err) {
      showFailure(err, "invites.failed");
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<DealerInviteRow>[] = [
    {
      key: "email",
      header: t("invites.columns.email"),
      isRowHeader: true,
      render: (row) => row.email,
    },
    {
      key: "role",
      header: t("invites.columns.role"),
      render: (row) => (
        <Badge variant="neutral">
          {t(`team.roles.${row.role}`, { defaultValue: row.role })}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("invites.columns.status"),
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? "neutral"}>
          {t(`invites.status.${row.status}`, { defaultValue: row.status })}
        </Badge>
      ),
    },
    {
      key: "expires",
      header: t("invites.columns.expires"),
      render: (row) =>
        row.status !== "PENDING"
          ? "—"
          : new Date(row.expiresAt).getTime() <= Date.now()
            ? t("invites.expired")
            : formatRelativeTime(row.expiresAt, "en"),
    },
    {
      key: "actions",
      header: t("invites.columns.actions"),
      align: "end",
      render: (row) => {
        if (!canInvite || row.status !== "PENDING") return null;
        return (
          <span className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setResendTarget(row)}
              aria-label={t("invites.resendAria", { email: row.email })}
            >
              <RotateCcw aria-hidden />
              {t("invites.resend")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRevokeTarget(row)}
              aria-label={t("invites.revokeAria", { email: row.email })}
            >
              <Trash2 aria-hidden />
              {t("invites.revoke")}
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <section className="mt-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-ink">{t("invites.title")}</h2>
        {canInvite && (
          <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
            <MailPlus aria-hidden />
            {t("invites.invite")}
          </Button>
        )}
      </div>

      {!canInvite && (
        <p className="mb-2 text-sm text-muted">{t("invites.notAllowed")}</p>
      )}

      <DataTable
        caption={t("invites.title")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        empty={{ title: t("invites.empty") }}
      />

      <Dialog open={inviteOpen} onOpenChange={(open) => (sending ? undefined : setInviteOpen(open))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("invites.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("invites.dialogHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">{t("invites.emailLabel")}</Label>
              <Input
                id="invite-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void submitInvite();
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-role">{t("invites.roleLabel")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as DealerMemberRole)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`team.roles.${option}`, { defaultValue: option })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={sending}
              onClick={() => setInviteOpen(false)}
            >
              {t("invites.cancel")}
            </Button>
            <Button
              disabled={sending || !EMAIL_RE.test(email.trim())}
              onClick={() => void submitInvite()}
            >
              {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              {t("invites.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={resendTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResendTarget(null);
        }}
        title={t("invites.resendConfirm.title")}
        body={t("invites.resendConfirm.body", { email: resendTarget?.email ?? "" })}
        confirmLabel={t("invites.resendConfirm.confirm")}
        cancelLabel={t("invites.resendConfirm.cancel")}
        tone="primary"
        busy={busy}
        onConfirm={() => void doResend()}
      />

      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title={t("invites.revokeConfirm.title")}
        body={t("invites.revokeConfirm.body", { email: revokeTarget?.email ?? "" })}
        confirmLabel={t("invites.revokeConfirm.confirm")}
        cancelLabel={t("invites.revokeConfirm.cancel")}
        busy={busy}
        onConfirm={() => void doRevoke()}
      />
    </section>
  );
}
