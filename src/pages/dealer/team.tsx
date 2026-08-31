/**
 * /dealer/team — branches and team management (task P3-01 FE, FR-DP9).
 *
 * OWNER-gated for role changes (the backend enforces it; the UI matches). The
 * last-owner and last-branch guards live server-side — this page just shows
 * the refusal message verbatim, because "a dealership must keep at least one
 * owner" is exactly what the user needs to read.
 */
import type { GetServerSideProps } from "next";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import * as React from "react";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { TeamInvites } from "@/components/dealer/team-invites";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { DealerOnboarding } from "@/components/dealer/dealer-onboarding";
import { useDealer } from "@/components/dealer/use-dealer";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { ApiError } from "@/lib/api";
import {
  addDealerBranch,
  getDealerMembers,
  getTaxonomyMeta,
  removeDealerBranch,
  removeDealerMember,
  setDealerMemberRole,
  type DealerMemberRole,
  type DealerMemberRow,
  type TaxonomyTerm,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

const ROLES: DealerMemberRole[] = ["OWNER", "MANAGER", "SALES"];

export default function DealerTeamPage() {
  const { t } = useTranslation("dealer");
  const { context, quota, loading, error, needsOnboarding, accessToken, refresh } =
    useDealer();

  const [members, setMembers] = React.useState<DealerMemberRow[]>([]);
  const [emirates, setEmirates] = React.useState<TaxonomyTerm[]>([]);
  const [membersLoading, setMembersLoading] = React.useState(true);
  const [branchOpen, setBranchOpen] = React.useState(false);
  const [branchName, setBranchName] = React.useState("");
  const [branchEmirate, setBranchEmirate] = React.useState("");
  const [branchAddress, setBranchAddress] = React.useState("");
  const [branchPhone, setBranchPhone] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const dealerId = context?.dealer?.id;

  const loadMembers = React.useCallback(async () => {
    if (!accessToken || !dealerId) return;
    try {
      setMembers(await getDealerMembers(dealerId, accessToken));
    } finally {
      setMembersLoading(false);
    }
  }, [accessToken, dealerId]);

  React.useEffect(() => {
    void loadMembers();
    void getTaxonomyMeta().then((meta) => setEmirates(meta.emirates));
  }, [loadMembers]);

  const showApiError = (err: unknown) => {
    const message = err instanceof ApiError ? err.message : t("team.failed");
    toast({ title: message, variant: "warning" });
  };

  const changeRole = async (member: DealerMemberRow, role: DealerMemberRole) => {
    if (!accessToken || !dealerId || member.role === role) return;
    try {
      await setDealerMemberRole(dealerId, member.id, role, accessToken);
      toast({ title: t("team.saved"), variant: "success" });
      await loadMembers();
    } catch (err) {
      showApiError(err);
    }
  };

  const removeMember = async (member: DealerMemberRow) => {
    if (!accessToken || !dealerId) return;
    try {
      await removeDealerMember(dealerId, member.id, accessToken);
      toast({ title: t("team.saved"), variant: "success" });
      await loadMembers();
    } catch (err) {
      showApiError(err);
    }
  };

  const submitBranch = async () => {
    if (!accessToken || !dealerId || saving) return;
    setSaving(true);
    try {
      await addDealerBranch(
        dealerId,
        {
          name: branchName.trim(),
          emirateId: branchEmirate,
          ...(branchAddress.trim() ? { address: branchAddress.trim() } : {}),
          ...(branchPhone.trim() ? { phone: branchPhone.trim() } : {}),
        },
        accessToken,
      );
      toast({ title: t("team.saved"), variant: "success" });
      setBranchOpen(false);
      setBranchName("");
      setBranchAddress("");
      setBranchPhone("");
      await refresh();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteBranch = async (branchId: string) => {
    if (!accessToken || !dealerId) return;
    try {
      await removeDealerBranch(dealerId, branchId, accessToken);
      toast({ title: t("team.saved"), variant: "success" });
      await refresh();
    } catch (err) {
      showApiError(err);
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
  if (error || !context?.dealer) {
    return <main className="p-8 text-sm text-muted">{t("errors.load")}</main>;
  }

  const canManage = context.permissions?.canManageTeam ?? false;

  const memberColumns: Column<DealerMemberRow>[] = [
    {
      key: "name",
      header: t("team.memberColumns.name"),
      isRowHeader: true,
      render: (row) => row.user.name,
    },
    {
      key: "email",
      header: t("team.memberColumns.email"),
      render: (row) => row.user.email,
    },
    {
      key: "role",
      header: t("team.memberColumns.role"),
      render: (row) =>
        canManage ? (
          <Select
            value={row.role}
            onValueChange={(value) => void changeRole(row, value as DealerMemberRole)}
          >
            <SelectTrigger
              className="h-8 w-32"
              aria-label={t("team.memberColumns.role")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {t(`team.roles.${role}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="neutral">{t(`team.roles.${row.role}`)}</Badge>
        ),
    },
    {
      key: "actions",
      header: t("team.memberColumns.actions"),
      align: "end",
      render: (row) =>
        canManage ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void removeMember(row)}
            aria-label={`${t("team.remove")} ${row.user.name}`}
          >
            <Trash2 className="size-4" aria-hidden />
            {t("team.remove")}
          </Button>
        ) : null,
    },
  ];

  return (
    <DealerLayout context={context} quota={quota} title={t("team.title")}>
      {/*
        Adding a colleague was the one thing this screen could not do: roles
        could be changed and members removed, but dealerMember.create only ever
        ran for the founder, so a team of one stayed a team of one.
      */}
      <TeamInvites
        dealerId={context.dealer.id}
        accessToken={accessToken!}
        canInvite={canManage}
        canInviteOwner={context.role === "OWNER"}
        onChanged={() => void loadMembers()}
      />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">{t("team.branches")}</h2>
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setBranchOpen(true)}>
              <Plus aria-hidden />
              {t("team.addBranch")}
            </Button>
          )}
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {context.dealer.branches.map((branch) => (
            <li key={branch.id}>
              <Card className="p-3">
                <p className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{branch.name}</span>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteBranch(branch.id)}
                      aria-label={`${t("team.remove")} ${branch.name}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  )}
                </p>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {[branch.address, branch.emirate?.name].filter(Boolean).join(", ")}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold text-ink">{t("team.members")}</h2>
        <DataTable
          caption={t("team.members")}
          columns={memberColumns}
          rows={members}
          rowKey={(row) => row.id}
          loading={membersLoading}
          empty={{ title: t("team.members") }}
        />
      </section>

      <Dialog open={branchOpen} onOpenChange={setBranchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("team.addBranch")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-name">{t("team.branchName")}</Label>
              <Input
                id="branch-name"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-emirate">{t("team.branchEmirate")}</Label>
              <Select value={branchEmirate} onValueChange={setBranchEmirate}>
                <SelectTrigger id="branch-emirate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emirates.map((emirate) => (
                    <SelectItem key={emirate.id} value={emirate.id}>
                      {emirate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-address">{t("team.branchAddress")}</Label>
              <Input
                id="branch-address"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-phone">{t("team.branchPhone")}</Label>
              <Input
                id="branch-phone"
                value={branchPhone}
                onChange={(e) => setBranchPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("team.cancel")}</Button>
            </DialogClose>
            <Button
              onClick={() => void submitBranch()}
              disabled={saving || branchName.trim().length < 2 || !branchEmirate}
            >
              {saving && <Loader2 className="animate-spin" aria-hidden />}
              {t("team.addBranch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DealerLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return {
      redirect: { destination: `${prefix}/login?next=/dealer/team`, permanent: false },
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
