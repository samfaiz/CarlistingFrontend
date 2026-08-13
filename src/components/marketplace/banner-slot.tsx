import { useRouter } from "next/router";
import * as React from "react";
import { API_BASE_URL } from "@/lib/api";

interface ServedBanner {
  id: string;
  name: string;
  imageUrl: string;
  targetUrl: string;
  slot: string;
}

/**
 * Public banner render hook (P4-06). Fetches the active banners for a placement
 * slot (locale-targeted), renders the highest-priority one, and records a click
 * before navigating. Renders nothing when no banner is live, so it is safe to
 * drop into any layout without changing the page when empty.
 */
export function BannerSlot({ slot, className }: { slot: string; className?: string }) {
  const { locale } = useRouter();
  const [banner, setBanner] = React.useState<ServedBanner | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ slot, ...(locale ? { locale } : {}) });
    fetch(`${API_BASE_URL}/banners?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: ServedBanner[]) => { if (!cancelled) setBanner(list[0] ?? null); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [slot, locale]);

  if (!banner) return null;

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Fire-and-forget the click beacon; let the navigation proceed normally.
    e.preventDefault();
    fetch(`${API_BASE_URL}/banners/${banner.id}/click`, { method: "POST" })
      .catch(() => undefined)
      .finally(() => {
        window.location.href = banner.targetUrl;
      });
  };

  return (
    <a href={banner.targetUrl} onClick={onClick} className={className ?? "banner-slot"} data-slot={slot} rel="nofollow sponsored">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt={banner.name} loading="lazy" />
    </a>
  );
}
