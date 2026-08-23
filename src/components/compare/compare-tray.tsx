/**
 * Floating compare tray — task P1-10 (FR-CV1 "persistent tray").
 *
 * Rendered once in _app.tsx, fixed to the bottom of the viewport (logical
 * inline positioning only). Hidden while empty and on /compare itself.
 * Thumbnails (with per-item remove), a clear-all, and the "Compare (n)" CTA.
 *
 * Copy lives in the "common" catalog — the tray can appear on ANY page once
 * items were added, and "common" is the only namespace every page loads.
 */
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Car, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/format";
import { useCompare } from "./compare-provider";

export function CompareTray() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { ready, items, remove, clear } = useCompare();

  const visible = ready && items.length > 0 && router.pathname !== "/compare";

  /*
   * Publish the tray's real height and flag it on <body>, the same contract the
   * consent banner uses, so anything else pinned to the bottom of a phone (the
   * assistant FAB) can lift clear instead of sitting on the tray's CTA.
   */
  const trayRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (!visible) {
      delete document.body.dataset.compareTrayOpen;
      document.documentElement.style.removeProperty("--compare-tray-height");
      return;
    }
    document.body.dataset.compareTrayOpen = "true";
    const el = trayRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const publish = () =>
      document.documentElement.style.setProperty(
        "--compare-tray-height",
        `${Math.ceil(el.getBoundingClientRect().height)}px`,
      );
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      delete document.body.dataset.compareTrayOpen;
      document.documentElement.style.removeProperty("--compare-tray-height");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={trayRef}
      role="region"
      aria-label={t("compareTray.label")}
      data-testid="compare-tray"
      // `compare-tray` lifts this above the consent banner while that is open
      // (both are bottom-fixed; see globals.css) so its CTA stays clickable.
      className="compare-tray fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 shadow-pop backdrop-blur-sm transition-[bottom]"
    >
      <div className="container-shell flex items-center gap-3 py-2.5">
        <ul className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <li key={item.id} className="relative shrink-0">
              <span
                className={cn(
                  "relative block size-12 overflow-hidden rounded-card border border-line bg-brand-surface",
                )}
                title={item.title}
              >
                {item.thumb ? (
                  <Image
                    src={mediaUrl(item.thumb)}
                    alt={item.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Car className="size-5 text-brand-border" aria-hidden />
                  </span>
                )}
              </span>
              <button
                type="button"
                aria-label={t("compareTray.remove", { title: item.title })}
                onClick={() => remove(item.id)}
                className={cn(
                  "absolute -top-1.5 -end-1.5 flex size-5 items-center justify-center rounded-full",
                  "border border-line bg-card text-muted shadow-soft transition-colors hover:text-danger",
                )}
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        <Button variant="ghost" size="sm" onClick={clear} className="shrink-0">
          {t("compareTray.clear")}
        </Button>
        <Button asChild size="sm" className="shrink-0" data-testid="compare-tray-cta">
          <Link href="/compare">
            {t("compareTray.cta", { count: items.length })}
          </Link>
        </Button>
      </div>
    </div>
  );
}
