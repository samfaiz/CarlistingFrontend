/**
 * Heart (save) button — task P1-09.
 *
 * Two skins over the same behavior:
 *  - "overlay": round chip in the listing-card image corner,
 *  - "panel": full-width outline button for the detail price panel.
 *
 * Unauthenticated click → toast + redirect to /login?next=<current URL> so
 * the user lands back where they were. Authenticated click → optimistic
 * toggle via SavedProvider; a failed sync rolls back and shows an error toast.
 *
 * Copy lives in the "listings" catalog — loaded on every page that renders
 * listings (home, /cars, /cars/[slug], /used-cars/*, /sell).
 */
import * as React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useSaved } from "./saved-provider";

export interface SaveButtonProps {
  listingId: string;
  variant?: "overlay" | "panel";
  className?: string;
}

export function SaveButton({
  listingId,
  variant = "overlay",
  className,
}: SaveButtonProps) {
  const { t } = useTranslation("listings");
  const router = useRouter();
  const { authed, isSaved, toggle } = useSaved();
  const saved = isSaved(listingId);

  const handleClick = async (event: React.MouseEvent) => {
    // The overlay skin floats above a stretched card link — never navigate.
    event.preventDefault();
    event.stopPropagation();

    if (!authed) {
      toast({ title: t("save.loginRequired"), variant: "info" });
      void router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }
    const ok = await toggle(listingId);
    if (!ok) toast({ title: t("save.error"), variant: "error" });
  };

  const label = saved ? t("save.saved") : t("save.label");

  if (variant === "panel") {
    return (
      <Button
        variant="outline"
        aria-pressed={saved}
        onClick={(e) => void handleClick(e)}
        className={className}
        data-testid="save-button-panel"
      >
        <Heart
          aria-hidden
          className={cn(saved && "fill-danger text-danger")}
        />
        {label}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={(e) => void handleClick(e)}
      data-testid="save-button"
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-card/90 shadow-soft",
        "transition-colors hover:bg-card focus-visible:outline-2",
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn(
          "size-4 transition-colors",
          saved ? "fill-danger text-danger" : "text-ink",
        )}
      />
    </button>
  );
}
