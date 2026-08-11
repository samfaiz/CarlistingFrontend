/**
 * Missing-trim request — task P1-03 (FR-VS4).
 *
 * When the Spec DB has no record for the seller's trim/year we let them tell us
 * what is missing; admin curation turns the request into a TrimSpec (FR-VS7),
 * so the database grows from real demand instead of guesswork.
 */
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldMessage, Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { createTrimRequest } from "@/lib/marketplace-api";

export interface TrimRequestDialogProps {
  /** Prefilled from the wizard's current selection where known. */
  defaults?: { make?: string; model?: string; trim?: string; year?: number };
}

export function TrimRequestDialog({ defaults }: TrimRequestDialogProps) {
  const { t } = useTranslation("sell");
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    make: defaults?.make ?? "",
    model: defaults?.model ?? "",
    trim: defaults?.trim ?? "",
    year: defaults?.year ? String(defaults.year) : "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async () => {
    if (!token) {
      toast({ title: t("autofill.request.signInFirst"), variant: "warning" });
      return;
    }
    if (form.make.trim().length < 2 || form.model.trim().length < 1) {
      setError(t("autofill.request.required"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createTrimRequest(
        {
          make: form.make.trim(),
          model: form.model.trim(),
          ...(form.trim.trim() ? { trim: form.trim.trim() } : {}),
          ...(form.year ? { year: Number(form.year) } : {}),
        },
        token,
      );
      toast({ title: t("autofill.request.sent"), variant: "success" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("autofill.request.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="mt-1 px-0">
          {t("autofill.requestLink")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("autofill.request.title")}</DialogTitle>
          <DialogDescription>{t("autofill.request.body")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="tr-make" required>
              {t("autofill.request.make")}
            </Label>
            <Input id="tr-make" value={form.make} onChange={set("make")} />
          </div>
          <div>
            <Label htmlFor="tr-model" required>
              {t("autofill.request.model")}
            </Label>
            <Input id="tr-model" value={form.model} onChange={set("model")} />
          </div>
          <div>
            <Label htmlFor="tr-trim">{t("autofill.request.trim")}</Label>
            <Input id="tr-trim" value={form.trim} onChange={set("trim")} />
          </div>
          <div>
            <Label htmlFor="tr-year">{t("autofill.request.year")}</Label>
            <Input id="tr-year" inputMode="numeric" value={form.year} onChange={set("year")} />
          </div>
        </div>
        {error ? <FieldMessage error>{error}</FieldMessage> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("autofill.request.cancel")}
          </Button>
          <Button loading={submitting} onClick={() => void submit()}>
            {t("autofill.request.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
