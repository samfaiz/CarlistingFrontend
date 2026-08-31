/**
 * /admin/users — users manager (task P4-03, FR-AD3).
 *
 * Suspend/ban revoke every session server-side; impersonation is
 * SUPER_ADMIN-only, audited, and surfaces the minted identity clearly so an
 * admin can never mistake whose session they hold.
 *
 * Role management (FR-SA1) lives here too, because this is the only screen that
 * lists customers: /admin/system's Staff tab reads `GET /super-admin/staff`,
 * which filters to ADMIN/SUPER_ADMIN, and `createStaff` refuses an email that
 * already exists — so before this control there was no path in the product that
 * could promote an existing customer.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { ShieldCheck, UserCog } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  getAdminUsers,
  impersonateUser,
  rbacMatrix,
  rbacRevokeGrant,
  rbacStaff,
  rbacUpdateStaff,
  setAdminUserStatus,
  setStaffRole,
  type AdminUserRow,
  type RbacRole,
  type RbacStaffMember,
} from "@/components/admin/api";
import { DataTable, FilterBar, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 25;
const STATUS_FILTERS = ["ALL", "ACTIVE", "SUSPENDED", "BANNED"] as const;

const STATUS_VARIANT: Record<string, "green" | "amber" | "red" | "neutral"> = {
  ACTIVE: "green",
  SUSPENDED: "amber",
  BANNED: "red",
  DELETED: "neutral",
};

/** Authority reads at a glance: navy = super admin, amber = admin, grey = customer. */
const ROLE_VARIANT: Record<string, "navy" | "amber" | "neutral"> = {
  SUPER_ADMIN: "navy",
  ADMIN: "amber",
  USER: "neutral",
};

type PlatformRole = "USER" | "ADMIN" | "SUPER_ADMIN";
const PLATFORM_ROLES: PlatformRole[] = ["USER", "ADMIN", "SUPER_ADMIN"];

export default function AdminUsersPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const selfId = session?.user?.id;

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [rows, setRows] = React.useState<AdminUserRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [impersonated, setImpersonated] = React.useState<{
    email: string;
    accessToken: string;
  } | null>(null);

  /* Role management state. `roleTarget` is a snapshot of the row taken when the
     dialog opened, so the confirmation keeps saying "from X" even if a
     background reload lands mid-decision. */
  const [roleTarget, setRoleTarget] = React.useState<AdminUserRow | null>(null);
  const [nextRole, setNextRole] = React.useState<PlatformRole>("USER");
  const [nextStaffRoleId, setNextStaffRoleId] = React.useState("");
  const [savingRole, setSavingRole] = React.useState(false);
  const [staffRoles, setStaffRoles] = React.useState<RbacRole[]>([]);
  const [staffAccess, setStaffAccess] = React.useState<RbacStaffMember[]>([]);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const page = await getAdminUsers(token, {
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: PAGE_SIZE,
        offset,
      });
      setRows(page.items);
      setTotal(page.total);
    } catch {
      toast({ title: t("users.toast.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, offset, t]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  /*
   * The RBAC side of the picture, loaded once for Super Admins only (both
   * endpoints are SUPER_ADMIN-fenced, so an ADMIN would just collect 403s).
   * It answers two questions the users list cannot: which named roles exist to
   * assign, and how many ACTIVE Super Admins remain — the number the backend
   * uses to refuse the last demotion.
   */
  const loadRbac = React.useCallback(async () => {
    if (!token || !isSuperAdmin) return;
    try {
      const [matrix, staff] = await Promise.all([rbacMatrix(token), rbacStaff(token)]);
      // Templates are read-only seeds; RbacService refuses to assign them.
      setStaffRoles(matrix.roles.filter((r) => !r.isTemplate));
      setStaffAccess(staff.items);
    } catch {
      // Non-fatal: the role control still works, it just cannot pre-check the
      // last-Super-Admin rule or offer a named role. The backend enforces both.
      setStaffRoles([]);
      setStaffAccess([]);
    }
  }, [token, isSuperAdmin]);

  React.useEffect(() => {
    void loadRbac();
  }, [loadRbac]);

  const accessByUser = React.useMemo(
    () => new Map(staffAccess.map((member) => [member.id, member])),
    [staffAccess],
  );
  const activeSuperAdmins = React.useMemo(
    () => staffAccess.filter((m) => m.role === "SUPER_ADMIN" && m.status === "ACTIVE").length,
    [staffAccess],
  );

  const act = async (
    row: AdminUserRow,
    action: "suspend" | "ban" | "reinstate",
  ) => {
    if (!token) return;
    setBusyId(row.id);
    try {
      const result = await setAdminUserStatus(row.id, action, undefined, token);
      toast({
        title: t(`users.toast.${action}`, { count: result.sessionsRevoked }),
        variant: "success",
      });
      await load();
    } catch {
      toast({ title: t("users.toast.failed"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const impersonate = async (row: AdminUserRow) => {
    if (!token) return;
    setBusyId(row.id);
    try {
      const result = await impersonateUser(row.id, token);
      setImpersonated({ email: result.target.email, accessToken: result.accessToken });
    } catch {
      toast({ title: t("users.toast.failed"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const openRoleDialog = (row: AdminUserRow) => {
    setRoleTarget(row);
    setNextRole(row.role as PlatformRole);
    // Carry whatever named role they already hold, so a SUPER_ADMIN → ADMIN
    // move does not silently drop it.
    setNextStaffRoleId(accessByUser.get(row.id)?.staffRole?.id ?? "");
  };

  /**
   * The backend refuses several role changes by design and reports them as
   * plain English 400s. Map the ones we know onto catalogue keys so the
   * operator reads a localized reason; anything else falls back to the
   * backend's own message, which beats a generic "action failed".
   */
  const roleErrorMessage = (error: unknown) => {
    const raw = error instanceof Error ? error.message : "";
    if (/own role/i.test(raw)) return t("users.role.errors.self");
    if (/last super admin/i.test(raw)) return t("users.role.errors.lastSuperAdmin");
    if (/not found/i.test(raw)) return t("users.role.errors.notFound");
    if (/template/i.test(raw)) return t("users.role.errors.template");
    return raw || t("users.role.errors.generic");
  };

  const applyRoleChange = async () => {
    if (!token || !roleTarget) return;
    const row = roleTarget;
    const target = nextRole;
    setSavingRole(true);
    try {
      if (target === "USER") {
        /*
         * Order matters. `PUT /admin/rbac/staff/:id` 404s once the account is
         * no longer staff, so the RBAC residue has to be cleared while it still
         * is. The role endpoint only blanks the legacy `permissions` array — it
         * leaves the named role, the denials, the data scopes and any live
         * time-bound grants behind, and a later re-promotion resurrects them.
         */
        const access = accessByUser.get(row.id);
        if (access) {
          await rbacUpdateStaff(
            row.id,
            { staffRoleId: null, grants: [], denials: [], dataScopes: null },
            token,
          );
          await Promise.all(access.permissionGrants.map((g) => rbacRevokeGrant(g.id, token)));
        }
        await setStaffRole(row.id, target, token);
      } else {
        await setStaffRole(row.id, target, token);
        if (nextStaffRoleId) {
          /*
           * Two calls, because the role DTO is `{ role }` and nothing else.
           * This second one is what makes the promotion safe: PermissionsService
           * falls back to LEGACY_ADMIN_PERMISSIONS — every non-super permission
           * in the registry — for an ADMIN with no named role.
           */
          try {
            await rbacUpdateStaff(row.id, { staffRoleId: nextStaffRoleId }, token);
          } catch (error) {
            toast({
              title: t("users.role.errors.roleAssignFailed", { reason: roleErrorMessage(error) }),
              variant: "warning",
            });
          }
        }
      }
      toast({
        title: t("users.toast.roleChanged", {
          name: row.name,
          role: t(`users.role.options.${target}`),
        }),
        variant: "success",
      });
      setRoleTarget(null);
      await Promise.all([load(), loadRbac()]);
    } catch (error) {
      toast({ title: roleErrorMessage(error), variant: "warning" });
    } finally {
      setSavingRole(false);
    }
  };

  const columns: Column<AdminUserRow>[] = [
    {
      key: "user",
      header: t("users.columns.user"),
      isRowHeader: true,
      render: (row) => (
        <span>
          <span className="block font-medium text-ink">{row.name}</span>
          <span className="text-xs text-muted">{row.email}</span>
        </span>
      ),
    },
    {
      key: "role",
      header: t("users.columns.role"),
      render: (row) => (
        <Badge variant={ROLE_VARIANT[row.role] ?? "neutral"}>{row.role}</Badge>
      ),
    },
    {
      key: "status",
      header: t("users.columns.status"),
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? "neutral"}>{row.status}</Badge>
      ),
    },
    {
      key: "listings",
      header: t("users.columns.listings"),
      align: "end",
      render: (row) => row._count.listings,
    },
    {
      key: "joined",
      header: t("users.columns.joined"),
      render: (row) => formatRelativeTime(row.createdAt, "en"),
    },
    {
      key: "actions",
      header: t("users.columns.actions"),
      align: "end",
      render: (row) => {
        const staff = row.role !== "USER";
        const busy = busyId === row.id;
        /*
         * A Super Admin cannot change their own role (the backend refuses it),
         * so the control is absent rather than present-and-doomed. A DELETED
         * account has nothing to promote.
         */
        const canChangeRole =
          isSuperAdmin && row.id !== selfId && row.status !== "DELETED";
        // Mirrors the backend guard exactly: it counts ACTIVE Super Admins
        // platform-wide and refuses at <= 1.
        const isLastSuperAdmin = row.role === "SUPER_ADMIN" && activeSuperAdmins <= 1;
        return (
          <span className="flex justify-end gap-1.5">
            {canChangeRole && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy || isLastSuperAdmin}
                title={isLastSuperAdmin ? t("users.role.lastSuperAdmin") : undefined}
                onClick={() => openRoleDialog(row)}
              >
                <ShieldCheck aria-hidden />
                {t("users.role.change")}
              </Button>
            )}
            {!staff && row.status === "ACTIVE" && (
              <>
                {isSuperAdmin && (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void impersonate(row)}>
                    <UserCog aria-hidden />
                    {t("users.impersonate")}
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void act(row, "suspend")}>
                  {t("users.suspend")}
                </Button>
                <Button size="sm" variant="danger" disabled={busy} onClick={() => void act(row, "ban")}>
                  {t("users.ban")}
                </Button>
              </>
            )}
            {!staff && row.status !== "ACTIVE" && row.status !== "DELETED" && (
              <Button size="sm" disabled={busy} onClick={() => void act(row, "reinstate")}>
                {t("users.reinstate")}
              </Button>
            )}
          </span>
        );
      },
    },
  ];

  // "Promoting" means crossing the customer/staff line — that is the case the
  // passkey gate and the two-sides rule (PRD §1.4) actually bite on. An
  // ADMIN → SUPER_ADMIN move is a staff change, not a promotion.
  const promoting = roleTarget?.role === "USER" && nextRole !== "USER";
  const demoting = Boolean(roleTarget) && roleTarget?.role !== "USER" && nextRole === "USER";
  const needsStaffRole = nextRole === "ADMIN";
  const confirmDisabled =
    savingRole ||
    !roleTarget ||
    nextRole === roleTarget.role ||
    (needsStaffRole && !nextStaffRoleId);

  return (
    <AdminLayout title={t("users.title")}>
      <FilterBar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setOffset(0);
        }}
        options={STATUS_FILTERS.map((f) => ({
          value: f,
          label: f === "ALL" ? t("users.filters.all") : f,
        }))}
        active={statusFilter}
        onSelect={(value) => {
          setStatusFilter(value as (typeof STATUS_FILTERS)[number]);
          setOffset(0);
        }}
      />

      <DataTable
        caption={t("users.title")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        empty={{ title: t("users.empty") }}
        pagination={{ total, limit: PAGE_SIZE, offset, onChange: setOffset }}
      />

      <Dialog open={Boolean(impersonated)} onOpenChange={(open) => !open && setImpersonated(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.impersonationDialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">
            {t("users.impersonationDialog.body", { email: impersonated?.email })}
          </p>
          <p className="break-all rounded-card bg-page p-2 font-mono text-xs text-ink">
            {impersonated?.accessToken}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(impersonated?.accessToken ?? "");
                toast({ title: t("users.impersonationDialog.copied"), variant: "success" });
              }}
            >
              {t("users.impersonationDialog.copy")}
            </Button>
            <Button onClick={() => setImpersonated(null)}>
              {t("users.impersonationDialog.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(roleTarget)}
        onOpenChange={(open) => {
          if (!open && !savingRole) setRoleTarget(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("users.role.dialogTitle")}</DialogTitle>
          </DialogHeader>

          {roleTarget && (
            <div className="space-y-4">
              {/* Who, and what they hold today — a role change should never be
                  possible without reading the subject back. */}
              <div className="rounded-card bg-page p-3">
                <p className="font-medium text-ink">{roleTarget.name}</p>
                <p className="text-xs text-muted">{roleTarget.email}</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                  {t("users.role.current")}
                  <Badge variant={ROLE_VARIANT[roleTarget.role] ?? "neutral"}>
                    {t(`users.role.options.${roleTarget.role}`)}
                  </Badge>
                </p>
              </div>

              <div>
                <Label htmlFor="role-next" required>
                  {t("users.role.next")}
                </Label>
                <Select
                  value={nextRole}
                  onValueChange={(value) => {
                    setNextRole(value as PlatformRole);
                    if (value === "USER") setNextStaffRoleId("");
                  }}
                >
                  <SelectTrigger id="role-next">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(`users.role.options.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {nextRole !== "USER" && (
                <div>
                  <Label htmlFor="role-staff-role" required={needsStaffRole}>
                    {t("users.role.staffRole")}
                  </Label>
                  <Select value={nextStaffRoleId} onValueChange={setNextStaffRoleId}>
                    <SelectTrigger id="role-staff-role">
                      <SelectValue placeholder={t("users.role.staffRolePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-xs text-muted">
                    {needsStaffRole
                      ? t("users.role.staffRoleHint")
                      : t("users.role.staffRoleOptional")}
                  </p>
                  {needsStaffRole && staffRoles.length === 0 && (
                    <p className="mt-1.5 text-xs text-danger">{t("users.role.staffRoleNone")}</p>
                  )}
                </div>
              )}

              {/* Consequences, stated before the click — every line below is
                  something the backend actually does (or pointedly does not). */}
              <div className="rounded-card border border-line p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("users.role.consequences")}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-ink">
                  <li>
                    {t("users.role.warnNoRevoke", {
                      name: roleTarget.name,
                      count: roleTarget._count.sessions,
                    })}
                  </li>
                  {promoting && <li>{t("users.role.warnPasskey")}</li>}
                  {promoting && roleTarget._count.listings > 0 && (
                    <li>{t("users.role.warnListings", { count: roleTarget._count.listings })}</li>
                  )}
                  {demoting && <li>{t("users.role.warnCleanup")}</li>}
                  <li>{t("users.role.warnAudited")}</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={savingRole} onClick={() => setRoleTarget(null)}>
              {t("users.role.cancel")}
            </Button>
            <Button loading={savingRole} disabled={confirmDisabled} onClick={() => void applyRoleChange()}>
              {t("users.role.confirm", { role: t(`users.role.options.${nextRole}`) })}
            </Button>
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
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)),
    },
  };
};
