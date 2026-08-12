/**
 * PDPL rights panel (task P2-05, PRD §13.4).
 *
 * Export downloads client-side from the authenticated JSON endpoint so the
 * file never has to be parked on a public URL. Deletion is guarded by retyping
 * the account email — the same confirmation the backend independently enforces,
 * because a destructive action must not rely on the client asking nicely.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { signOut } from "next-auth/react";
import { Download, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { deleteMyAccount, exportMyData } from "@/lib/marketplace-api";

export function PrivacyPanel({
  accessToken,
  email,
}: {
  accessToken: string;
  email: string;
}) {
  const { t } = useTranslation("account");
  const [exporting, setExporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportMyData(accessToken);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carsens-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("privacy.exportDone"), variant: "success" });
    } catch {
      toast({ title: t("privacy.exportFailed"), variant: "warning" });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount(confirm, accessToken);
      toast({ title: t("privacy.deleteDone"), variant: "success" });
      void signOut({ callbackUrl: "/" });
    } catch {
      toast({ title: t("privacy.deleteFailed"), variant: "warning" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Panel className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-brand-mid" aria-hidden />
        <h2 className="text-sm font-bold text-ink">{t("privacy.heading")}</h2>
      </div>
      <p className="text-sm text-muted">{t("privacy.body")}</p>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
          {t("privacy.export")}
        </Button>

        <Button variant="outline" onClick={() => setDeleteOpen(true)}>
          <Trash2 aria-hidden />
          {t("privacy.delete")}
        </Button>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("privacy.deleteTitle")}</DialogTitle>
              <DialogDescription>{t("privacy.deleteWarning")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-email">
                {t("privacy.confirmLabel", { email })}
              </Label>
              <Input
                id="confirm-email"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t("privacy.cancel")}</Button>
              </DialogClose>
              <Button
                variant="danger"
                disabled={confirm.trim().toLowerCase() !== email.toLowerCase() || deleting}
                onClick={() => void handleDelete()}
              >
                {deleting && <Loader2 className="animate-spin" aria-hidden />}
                {t("privacy.deleteConfirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Panel>
  );
}
