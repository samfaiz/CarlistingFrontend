/**
 * Outbound email settings.
 *
 * The most important thing on this panel is not a field — it is the banner at
 * the top telling you whether mail is actually being delivered. Every
 * notification the platform sends had been going nowhere in this deployment,
 * and the only evidence was one warning line at boot. So the state is stated
 * first, in words, before anything editable.
 *
 * The password is write-only by design: the API returns whether a credential is
 * set and never what it is, so this component holds a password in local state
 * only long enough to submit it.
 */
import * as React from "react";
import { KeyRound, Mail, Send, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  clearMailCredentials,
  getMailConfig,
  saveMailConfig,
  saveMailCredentials,
  sendMailTest,
  type MailStatus,
} from "@/components/admin/api";

type TF = (key: string, opts?: Record<string, unknown>) => string;

const EMPTY = {
  host: "",
  port: 587,
  secure: false,
  fromName: "",
  fromEmail: "",
  enabled: true,
};

export function MailTab({ token, t }: { token?: string; t: TF }) {
  const [status, setStatus] = React.useState<MailStatus | null>(null);
  const [form, setForm] = React.useState(EMPTY);
  const [user, setUser] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [testTo, setTestTo] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; detail: string } | null>(
    null,
  );

  const load = React.useCallback(async () => {
    if (!token) return;
    const next = await getMailConfig(token).catch(() => null);
    if (!next) return;
    setStatus(next);
    if (next.settings) setForm({ ...next.settings });
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!token) return;
    setBusy(true);
    try {
      // 465 is implicit TLS; anything else negotiates STARTTLS. The server
      // refuses the mismatch too, but saying so here saves a round trip.
      setStatus(await saveMailConfig({ ...form, port: Number(form.port) }, token));
      toast({ title: t("system.mail.saved"), variant: "success" });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t("system.error"),
        variant: "warning",
      });
    } finally {
      setBusy(false);
    }
  };

  const onSaveCredentials = async () => {
    if (!token || !user || !password) return;
    setBusy(true);
    try {
      setStatus(await saveMailCredentials({ user, password }, token));
      // Held only long enough to submit; the API never gives it back.
      setPassword("");
      toast({ title: t("system.mail.credentialsSaved"), variant: "success" });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t("system.error"),
        variant: "warning",
      });
    } finally {
      setBusy(false);
    }
  };

  const onClearCredentials = async () => {
    if (!token) return;
    setBusy(true);
    try {
      setStatus(await clearMailCredentials(token));
      setUser("");
      setPassword("");
      toast({ title: t("system.mail.credentialsCleared"), variant: "success" });
    } finally {
      setBusy(false);
    }
  };

  const onTest = async () => {
    if (!token || !testTo) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await sendMailTest({ to: testTo }, token);
      setResult({ ok: r.ok, detail: r.detail });
    } catch (e) {
      setResult({
        ok: false,
        detail: e instanceof Error ? e.message : t("system.error"),
      });
    } finally {
      setBusy(false);
    }
  };

  const envManaged = status?.source === "environment";

  return (
    <div className="space-y-4">
      {/* The state, before anything editable. */}
      <Panel
        className={
          status?.loggingOnly
            ? "flex items-start gap-3 border-warning/40 bg-warning-soft p-4"
            : "flex items-start gap-3 border-success/40 bg-success-soft p-4"
        }
      >
        {status?.loggingOnly ? (
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning-strong" aria-hidden />
        ) : (
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success-strong" aria-hidden />
        )}
        <div>
          <p className="text-sm font-bold text-ink">
            {status?.loggingOnly
              ? t("system.mail.state.loggingOnly")
              : t("system.mail.state.sending")}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {status?.loggingOnly
              ? t("system.mail.state.loggingOnlyHint")
              : t("system.mail.state.sendingHint", {
                  host: status?.settings?.host ?? "",
                })}
          </p>
          {status ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={status.source === "database" ? "navy" : "neutral"}>
                {t(`system.mail.source.${status.source}`)}
              </Badge>
              <Badge variant={status.credentials.password ? "green" : "neutral"}>
                {status.credentials.password
                  ? t("system.mail.credentialsSet")
                  : t("system.mail.credentialsUnset")}
              </Badge>
            </p>
          ) : null}
        </div>
      </Panel>

      {envManaged ? (
        <p className="rounded-card bg-page px-3 py-2 text-xs text-muted">
          {t("system.mail.envManaged")}
        </p>
      ) : null}

      {/* Server */}
      <Panel className="space-y-3 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
          <Mail className="size-4 text-brand-mid" aria-hidden />
          {t("system.mail.serverTitle")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="mail-host">{t("system.mail.host")}</Label>
            <Input
              id="mail-host"
              value={form.host}
              placeholder="smtp.provider.com"
              onChange={(e) => set("host", e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">{t("system.mail.hostHint")}</p>
          </div>
          <div>
            <Label htmlFor="mail-port">{t("system.mail.port")}</Label>
            <Input
              id="mail-port"
              type="number"
              value={form.port}
              onChange={(e) => set("port", Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-muted">{t("system.mail.portHint")}</p>
          </div>
          <div>
            <Label htmlFor="mail-from-name">{t("system.mail.fromName")}</Label>
            <Input
              id="mail-from-name"
              value={form.fromName}
              onChange={(e) => set("fromName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="mail-from-email">{t("system.mail.fromEmail")}</Label>
            <Input
              id="mail-from-email"
              type="email"
              value={form.fromEmail}
              placeholder="no-reply@yourdomain.com"
              onChange={(e) => set("fromEmail", e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.secure}
              onChange={(e) => set("secure", e.target.checked)}
            />
            {t("system.mail.secure")}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
            />
            {t("system.mail.enabled")}
          </label>
        </div>
        <p className="text-xs text-muted">{t("system.mail.tlsNote")}</p>
        <div className="flex justify-end">
          <Button size="sm" disabled={busy || !form.host} onClick={() => void onSave()}>
            {t("system.mail.save")}
          </Button>
        </div>
      </Panel>

      {/* Credentials */}
      <Panel className="space-y-3 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
          <KeyRound className="size-4 text-brand-mid" aria-hidden />
          {t("system.mail.credentialsTitle")}
        </h3>
        <p className="text-xs text-muted">{t("system.mail.credentialsHint")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="mail-user">{t("system.mail.user")}</Label>
            <Input
              id="mail-user"
              value={user}
              autoComplete="off"
              onChange={(e) => setUser(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="mail-password">{t("system.mail.password")}</Label>
            <Input
              id="mail-password"
              type="password"
              value={password}
              autoComplete="new-password"
              placeholder={
                status?.credentials.password ? "••••••••" : undefined
              }
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {status?.credentials.password ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void onClearCredentials()}
            >
              {t("system.mail.clearCredentials")}
            </Button>
          ) : null}
          <Button
            size="sm"
            disabled={busy || !user || !password}
            onClick={() => void onSaveCredentials()}
          >
            {t("system.mail.saveCredentials")}
          </Button>
        </div>
      </Panel>

      {/* Test */}
      <Panel className="space-y-3 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
          <Send className="size-4 text-brand-mid" aria-hidden />
          {t("system.mail.testTitle")}
        </h3>
        <p className="text-xs text-muted">{t("system.mail.testHint")}</p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1">
            <Label htmlFor="mail-test-to">{t("system.mail.testTo")}</Label>
            <Input
              id="mail-test-to"
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
          </div>
          <Button size="sm" disabled={busy || !testTo} onClick={() => void onTest()}>
            {t("system.mail.sendTest")}
          </Button>
        </div>
        {result ? (
          <p
            className={
              result.ok
                ? "rounded-card bg-success-soft px-3 py-2 text-xs text-success-strong"
                : "rounded-card bg-danger-soft px-3 py-2 text-xs text-danger-strong"
            }
            role="status"
          >
            {/* The server's own words: an auth failure and a wrong port look
                identical if this is reduced to "failed". */}
            {result.detail}
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
