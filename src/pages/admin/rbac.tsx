/**
 * /admin/rbac — RBAC v2 matrix editor + staff access (G1-01, FR-RB7).
 * Super Admin only (the API is hard-fenced; others see 403s).
 *
 * The matrix is edited locally; "Review changes" shows a per-role diff
 * (+granted / −revoked) BEFORE anything is saved — the AC-RBAC-03 preview.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  rbacAddGrant,
  rbacCreateRole,
  rbacDeleteRole,
  rbacMatrix,
  rbacRevokeGrant,
  rbacStaff,
  rbacUpdateRole,
  rbacUpdateStaff,
  type RbacModuleDef,
  type RbacRole,
  type RbacStaffMember,
} from "@/components/admin/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

type Draft = Record<string, Set<string>>; // roleId -> permission set (edited)

export default function AdminRbacPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [tab, setTab] = React.useState<"matrix" | "staff">("matrix");
  const [modules, setModules] = React.useState<RbacModuleDef[]>([]);
  const [roles, setRoles] = React.useState<RbacRole[]>([]);
  const [staff, setStaff] = React.useState<RbacStaffMember[]>([]);
  const [draft, setDraft] = React.useState<Draft>({});
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [cloneFrom, setCloneFrom] = React.useState("");
  const [grantFor, setGrantFor] = React.useState<RbacStaffMember | null>(null);
  const [grantPerm, setGrantPerm] = React.useState("");
  const [grantHours, setGrantHours] = React.useState("24");
  const [grantReason, setGrantReason] = React.useState("");

  const allPerms = React.useMemo(() => modules.flatMap((m) => m.permissions), [modules]);

  const load = React.useCallback(async () => {
    if (!token) return;
    try {
      const [m, s] = await Promise.all([rbacMatrix(token), rbacStaff(token)]);
      setModules(m.modules);
      setRoles(m.roles);
      setStaff(s.items);
      setDraft(Object.fromEntries(m.roles.map((r) => [r.id, new Set(r.permissions)])));
    } catch {
      toast({ title: t("rbac.toast.loadFailed", { defaultValue: "Could not load the matrix" }), variant: "warning" });
    }
  }, [token, t]);
  React.useEffect(() => { void load(); }, [load]);

  const editable = roles.filter((r) => !r.isTemplate);
  const toggle = (roleId: string, perm: string) => {
    setDraft((prev) => {
      const next = { ...prev, [roleId]: new Set(prev[roleId]) };
      if (next[roleId].has(perm)) next[roleId].delete(perm);
      else next[roleId].add(perm);
      return next;
    });
  };

  // FR-RB7 diff preview: role -> {added, removed}
  const diff = React.useMemo(() => {
    const out: { role: RbacRole; added: string[]; removed: string[] }[] = [];
    for (const role of editable) {
      const before = new Set(role.permissions);
      const after = draft[role.id] ?? before;
      const added = [...after].filter((p) => !before.has(p));
      const removed = [...before].filter((p) => !after.has(p));
      if (added.length || removed.length) out.push({ role, added, removed });
    }
    return out;
  }, [editable, draft]);

  const saveMatrix = async () => {
    if (!token) return;
    setBusy(true);
    try {
      for (const d of diff) {
        await rbacUpdateRole(d.role.id, { permissions: [...(draft[d.role.id] ?? [])] }, token);
      }
      toast({ title: t("rbac.toast.saved", { defaultValue: "Matrix saved" }) });
      setReviewOpen(false);
      void load();
    } catch {
      toast({ title: t("rbac.toast.saveFailed", { defaultValue: "Save failed" }), variant: "warning" });
    } finally { setBusy(false); }
  };

  const createRole = async () => {
    if (!token || !newName.trim()) return;
    setBusy(true);
    try {
      const src = roles.find((r) => r.id === cloneFrom);
      await rbacCreateRole({ name: newName.trim(), permissions: src ? src.permissions : [], cloneFromId: cloneFrom || undefined }, token);
      toast({ title: t("rbac.toast.roleCreated", { defaultValue: "Role created" }) });
      setNewOpen(false); setNewName(""); setCloneFrom("");
      void load();
    } catch {
      toast({ title: t("rbac.toast.saveFailed", { defaultValue: "Save failed" }), variant: "warning" });
    } finally { setBusy(false); }
  };

  const deleteRole = async (r: RbacRole) => {
    if (!token) return;
    try {
      await rbacDeleteRole(r.id, token);
      toast({ title: t("rbac.toast.roleDeleted", { defaultValue: "Role deleted" }) });
      void load();
    } catch {
      toast({ title: t("rbac.toast.roleInUse", { defaultValue: "Role is still assigned — reassign those staff first" }), variant: "warning" });
    }
  };

  const assignRole = async (member: RbacStaffMember, staffRoleId: string) => {
    if (!token) return;
    try {
      await rbacUpdateStaff(member.id, { staffRoleId: staffRoleId || null }, token);
      toast({ title: t("rbac.toast.assigned", { defaultValue: "Access updated" }) });
      void load();
    } catch {
      toast({ title: t("rbac.toast.saveFailed", { defaultValue: "Save failed" }), variant: "warning" });
    }
  };

  const addGrant = async () => {
    if (!token || !grantFor || !grantPerm) return;
    setBusy(true);
    try {
      const expiresAt = new Date(Date.now() + Number(grantHours) * 3600 * 1000).toISOString();
      await rbacAddGrant(grantFor.id, { permission: grantPerm, expiresAt, reason: grantReason || undefined }, token);
      toast({ title: t("rbac.toast.grantAdded", { defaultValue: "Time-bound grant added" }) });
      setGrantFor(null); setGrantPerm(""); setGrantReason("");
      void load();
    } catch {
      toast({ title: t("rbac.toast.saveFailed", { defaultValue: "Save failed" }), variant: "warning" });
    } finally { setBusy(false); }
  };

  const revokeGrant = async (grantId: string) => {
    if (!token) return;
    try {
      await rbacRevokeGrant(grantId, token);
      void load();
    } catch {
      toast({ title: t("rbac.toast.saveFailed", { defaultValue: "Save failed" }), variant: "warning" });
    }
  };

  return (
    <AdminLayout title={t("rbac.title", { defaultValue: "Roles & permissions" })}>
      <div className="mb-4 flex items-center gap-2">
        <Button variant={tab === "matrix" ? "primary" : "outline"} size="sm" onClick={() => setTab("matrix")}>{t("rbac.tabMatrix", { defaultValue: "Permission matrix" })}</Button>
        <Button variant={tab === "staff" ? "primary" : "outline"} size="sm" onClick={() => setTab("staff")}>{t("rbac.tabStaff", { defaultValue: "Staff access" })}</Button>
        <div className="ms-auto flex gap-2">
          {tab === "matrix" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>{t("rbac.newRole", { defaultValue: "New role" })}</Button>
              <Button size="sm" disabled={diff.length === 0} onClick={() => setReviewOpen(true)}>
                {t("rbac.review", { defaultValue: "Review changes" })}{diff.length > 0 ? ` (${diff.length})` : ""}
              </Button>
            </>
          )}
        </div>
      </div>

      {tab === "matrix" && (
        <div className="overflow-x-auto rounded-panel border border-line bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-brand text-white">
                <th className="sticky start-0 bg-brand px-3 py-2 text-start">{t("rbac.colPermission", { defaultValue: "Permission" })}</th>
                {roles.map((r) => (
                  <th key={r.id} className="px-2 py-2 text-center" title={r.isTemplate ? t("rbac.templateHint", { defaultValue: "Template (read-only — clone to edit)" }) : `${r.assignedUsers} assigned`}>
                    <div className="max-w-[90px] truncate">{r.name}</div>
                    {r.isTemplate ? <span className="text-[10px] opacity-70">{t("rbac.template", { defaultValue: "template" })}</span> : (
                      <button type="button" className="text-[10px] underline opacity-70" onClick={() => void deleteRole(r)}>{t("rbac.delete", { defaultValue: "delete" })}</button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <React.Fragment key={m.key}>
                  <tr className="border-t border-line bg-page/70">
                    <td colSpan={roles.length + 1} className="px-3 py-1.5 font-semibold text-ink">{m.label}</td>
                  </tr>
                  {m.permissions.map((p) => (
                    <tr key={p.key} className="border-t border-line/60">
                      <td className="sticky start-0 bg-white px-3 py-1.5">
                        {p.label}
                        {p.superAdminOnly && <Badge variant="neutral" className="ms-2">{t("rbac.superOnly", { defaultValue: "super" })}</Badge>}
                        <div className="text-[10px] text-muted">{p.key}</div>
                      </td>
                      {roles.map((r) => (
                        <td key={r.id} className="px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            disabled={r.isTemplate}
                            checked={draft[r.id]?.has(p.key) ?? false}
                            onChange={() => toggle(r.id, p.key)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "staff" && (
        <div className="grid gap-3">
          {staff.map((u) => (
            <div key={u.id} className="rounded-panel border border-line bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[200px]">
                  <div className="font-medium">{u.name} {u.role === "SUPER_ADMIN" && <Badge variant="navy">SUPER</Badge>}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </div>
                {u.role !== "SUPER_ADMIN" && (
                  <select
                    className="h-9 rounded-md border border-line bg-white px-2 text-sm"
                    value={u.staffRole?.id ?? ""}
                    onChange={(e) => void assignRole(u, e.target.value)}
                  >
                    <option value="">{t("rbac.legacyRole", { defaultValue: "Legacy admin (full marketplace)" })}</option>
                    {editable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                )}
                <Button variant="outline" size="sm" onClick={() => setGrantFor(u)}>{t("rbac.addGrant", { defaultValue: "Time-bound grant" })}</Button>
              </div>
              {u.permissionGrants.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {u.permissionGrants.map((g) => (
                    <span key={g.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-page px-2 py-0.5 text-xs">
                      {g.permission} · {t("rbac.until", { defaultValue: "until" })} {new Date(g.expiresAt).toLocaleString()}
                      <button type="button" className="text-red-600" onClick={() => void revokeGrant(g.id)} title={t("rbac.revoke", { defaultValue: "Revoke" })}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Diff preview (FR-RB7 / AC-RBAC-03) */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("rbac.reviewTitle", { defaultValue: "Review permission changes" })}</DialogTitle></DialogHeader>
          <div className="grid max-h-[50vh] gap-3 overflow-y-auto">
            {diff.map((d) => (
              <div key={d.role.id} className="rounded-md border border-line p-3">
                <div className="mb-1 font-medium">{d.role.name} <span className="text-xs text-muted">({d.role.assignedUsers} {t("rbac.assigned", { defaultValue: "assigned" })})</span></div>
                {d.added.map((p) => <div key={p} className="text-xs text-emerald-700">+ {p}</div>)}
                {d.removed.map((p) => <div key={p} className="text-xs text-red-700">− {p}</div>)}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>{t("rbac.cancel", { defaultValue: "Cancel" })}</Button>
            <Button onClick={() => void saveMatrix()} disabled={busy}>{t("rbac.applyChanges", { defaultValue: "Apply changes" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New role */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("rbac.newRole", { defaultValue: "New role" })}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>{t("rbac.roleName", { defaultValue: "Role name" })}</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Junior Sales" />
            </div>
            <div className="grid gap-1">
              <Label>{t("rbac.cloneFrom", { defaultValue: "Start from (template or role)" })}</Label>
              <select className="h-9 rounded-md border border-line bg-white px-2 text-sm" value={cloneFrom} onChange={(e) => setCloneFrom(e.target.value)}>
                <option value="">{t("rbac.blankRole", { defaultValue: "Blank" })}</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.isTemplate ? "📋 " : ""}{r.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>{t("rbac.cancel", { defaultValue: "Cancel" })}</Button>
            <Button onClick={() => void createRole()} disabled={busy || !newName.trim()}>{t("rbac.create", { defaultValue: "Create" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time-bound grant (FR-RB6) */}
      <Dialog open={grantFor != null} onOpenChange={(o) => !o && setGrantFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("rbac.grantTitle", { defaultValue: "Time-bound grant" })} — {grantFor?.name}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>{t("rbac.grantPerm", { defaultValue: "Permission" })}</Label>
              <select className="h-9 rounded-md border border-line bg-white px-2 text-sm" value={grantPerm} onChange={(e) => setGrantPerm(e.target.value)}>
                <option value="">—</option>
                {allPerms.map((p) => <option key={p.key} value={p.key}>{p.label} ({p.key})</option>)}
              </select>
            </div>
            <div className="grid gap-1">
              <Label>{t("rbac.grantHours", { defaultValue: "Expires in (hours)" })}</Label>
              <Input type="number" min={1} max={720} value={grantHours} onChange={(e) => setGrantHours(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>{t("rbac.grantReason", { defaultValue: "Reason (audited)" })}</Label>
              <Input value={grantReason} onChange={(e) => setGrantReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantFor(null)}>{t("rbac.cancel", { defaultValue: "Cancel" })}</Button>
            <Button onClick={() => void addGrant()} disabled={busy || !grantPerm}>{t("rbac.grantAdd", { defaultValue: "Grant" })}</Button>
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
