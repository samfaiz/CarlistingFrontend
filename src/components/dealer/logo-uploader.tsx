/**
 * Dealership logo upload.
 *
 * `DealerProfile.logoKey` was written by the API and read by nothing — three
 * customer-facing surfaces still draw two letters. This is the missing half:
 * the place a dealership can actually put a logo there.
 *
 * The flow is the same presign → PUT the sell wizard and the trade-licence
 * upload use, plus one extra step that matters: `POST /media/process` queues
 * the ClamAV scan and the WebP variants. It is not optional, because the raw
 * `uploads/` object is NOT publicly readable — only the derived `media/*`
 * variants are — so storing the presign key straight into `logoKey` would save
 * a logo that renders as a broken image on every page it appears.
 *
 * The derived key is therefore what gets saved, and the upload waits for that
 * object to actually exist before saving it rather than writing a key that
 * 403s for the next few seconds.
 */
import * as React from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { ConfirmDialog } from "@/components/dealer/confirm-dialog";
import { DealerLogo } from "@/components/dealer/dealer-logo";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ApiError, apiPost } from "@/lib/api";
import { mediaUrl } from "@/lib/format";
import {
  presignUpload,
  updateDealer,
  type UploadContentType,
} from "@/lib/marketplace-api";

const ACCEPTED: UploadContentType[] = ["image/jpeg", "image/png", "image/webp"];

/** Mirrors the media worker: uploads/<user>/<id>.jpg → media/card/<user>/<id>.webp */
function cardVariantKey(uploadKey: string): string {
  return uploadKey.replace(/^uploads\//, "media/card/").replace(/\.\w+$/, ".webp");
}

/**
 * Waits for the processed object to be servable. An <img> probe rather than
 * fetch(): the media host is a different origin with no CORS headers, and an
 * image load needs none.
 */
function waitForImage(url: string, attempts = 12): Promise<boolean> {
  return new Promise((resolve) => {
    let left = attempts;
    const attempt = () => {
      const probe = new Image();
      probe.onload = () => resolve(true);
      probe.onerror = () => {
        left -= 1;
        if (left <= 0) resolve(false);
        else window.setTimeout(attempt, 1000);
      };
      // Cache-bust so a cached 403 does not become a permanent "not ready".
      probe.src = `${url}?p=${attempts - left}`;
    };
    attempt();
  });
}

export interface LogoUploaderProps {
  dealerId: string;
  dealerName: string;
  logoKey: string | null;
  accessToken: string;
  canEdit: boolean;
  onSaved: () => void | Promise<void>;
}

export function LogoUploader({
  dealerId,
  dealerName,
  logoKey,
  accessToken,
  canEdit,
  onSaved,
}: LogoUploaderProps) {
  const { t } = useTranslation("dealer");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);

  const upload = async (file: File) => {
    if (!ACCEPTED.includes(file.type as UploadContentType)) {
      toast({ title: t("editProfile.logo.badType"), variant: "warning" });
      return;
    }
    setBusy(true);
    try {
      const presigned = await presignUpload(file.type as UploadContentType, accessToken);
      if (file.size > presigned.maxBytes) {
        toast({ title: t("editProfile.logo.tooBig"), variant: "warning" });
        return;
      }
      const put = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error(`PUT ${put.status}`);

      await apiPost("/media/process", { key: presigned.key }, { token: accessToken });

      const variantKey = cardVariantKey(presigned.key);
      const ready = await waitForImage(mediaUrl(variantKey));
      if (!ready) toast({ title: t("editProfile.logo.processing"), variant: "info" });

      await updateDealer(dealerId, { logoKey: variantKey }, accessToken);
      toast({ title: t("editProfile.logo.uploaded"), variant: "success" });
      await onSaved();
    } catch (err) {
      toast({
        title: err instanceof ApiError ? err.message : t("editProfile.logo.failed"),
        variant: "warning",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await updateDealer(dealerId, { logoKey: "" }, accessToken);
      setRemoveOpen(false);
      toast({ title: t("editProfile.logo.removed"), variant: "success" });
      await onSaved();
    } catch (err) {
      toast({
        title: err instanceof ApiError ? err.message : t("editProfile.logo.failed"),
        variant: "warning",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <DealerLogo
        name={dealerName}
        logoKey={logoKey}
        className="size-20"
        alt={t("editProfile.logo.alt", { name: dealerName })}
      />
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{t("editProfile.logo.title")}</p>
        <p className="mt-0.5 text-xs text-muted">{t("editProfile.logo.hint")}</p>
        {canEdit && (
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              ref={inputRef}
              id="dealer-logo-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <ImagePlus aria-hidden />
              )}
              {logoKey ? t("editProfile.logo.replace") : t("editProfile.logo.upload")}
            </Button>
            {logoKey && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setRemoveOpen(true)}
              >
                <Trash2 aria-hidden />
                {t("editProfile.logo.remove")}
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={t("editProfile.logo.removeTitle")}
        body={t("editProfile.logo.removeBody")}
        confirmLabel={t("editProfile.logo.removeConfirm")}
        cancelLabel={t("editProfile.logo.removeCancel")}
        busy={busy}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
