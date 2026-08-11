/**
 * "Save this search" — task P1-09 (FR-S5).
 *
 * Exported for a single placement at the bottom of the /cars filter panel.
 * Opens a small Dialog (name + alert frequency) and POSTs /saved/searches
 * with the CURRENT serialized query object. Unauthenticated click → toast +
 * redirect to /login?next=<current URL>.
 *
 * Copy lives in the "common" catalog ("saveSearch.*") — the search page does
 * not load a "saved" namespace and this button must work wherever it lands.
 */
import * as React from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { BellPlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import {
  createSavedSearch,
  type SavedSearchFrequency,
} from "@/lib/marketplace-api";

const FREQUENCIES: SavedSearchFrequency[] = ["INSTANT", "DAILY", "WEEKLY", "OFF"];

export interface SaveSearchButtonProps {
  /** Serialized /cars query params of the search being saved. */
  query: Record<string, string>;
  className?: string;
}

export function SaveSearchButton({ query, className }: SaveSearchButtonProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [frequency, setFrequency] = React.useState<SavedSearchFrequency>("DAILY");
  const [nameError, setNameError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const handleTriggerClick = (event: React.MouseEvent) => {
    if (token) return; // authed → let the DialogTrigger open the dialog
    event.preventDefault();
    toast({ title: t("saveSearch.loginRequired"), variant: "info" });
    void router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    if (!token) return;
    setSubmitting(true);
    try {
      await createSavedSearch({ name: trimmed, query, frequency }, token);
      toast({ title: t("saveSearch.success"), variant: "success" });
      setOpen(false);
      setName("");
      setFrequency("DAILY");
    } catch {
      toast({ title: t("saveSearch.error"), variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className={className}
          onClick={handleTriggerClick}
          data-testid="save-search-button"
        >
          <BellPlus aria-hidden />
          {t("saveSearch.cta")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("saveSearch.title")}</DialogTitle>
          <DialogDescription>{t("saveSearch.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
          <div>
            <Label htmlFor="save-search-name" required>
              {t("saveSearch.nameLabel")}
            </Label>
            <Input
              id="save-search-name"
              value={name}
              invalid={nameError}
              aria-describedby={nameError ? "save-search-name-error" : undefined}
              placeholder={t("saveSearch.namePlaceholder")}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError && e.target.value.trim()) setNameError(false);
              }}
            />
            {nameError ? (
              <FieldMessage id="save-search-name-error" error>
                {t("saveSearch.nameRequired")}
              </FieldMessage>
            ) : null}
          </div>
          <div>
            <Label htmlFor="save-search-frequency">
              {t("saveSearch.frequencyLabel")}
            </Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as SavedSearchFrequency)}
            >
              <SelectTrigger id="save-search-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {t(`saveSearch.frequency.${f}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldMessage>{t("saveSearch.frequencyHint")}</FieldMessage>
          </div>
          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              {t("saveSearch.cancel")}
            </Button>
            <Button type="submit" loading={submitting}>
              {t("saveSearch.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
