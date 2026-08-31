/**
 * DealerLogo — the dealership's mark, with initials as the fallback.
 *
 * `DealerProfile.logoKey` has existed since P3-01 and nothing drew it; every
 * surface fell back to two letters. This renders the image when there is one
 * and the initials when there is not — and, crucially, when the image FAILS to
 * load: a logo whose object is still being processed (or was purged) must
 * degrade to initials rather than to a broken-image icon.
 */
import * as React from "react";
import { mediaUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

export function dealerInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export interface DealerLogoProps {
  name: string;
  logoKey?: string | null;
  /** CSS size token for the square, e.g. "size-10". */
  className?: string;
  /** Alt text for the image. Initials render as decorative + aria-label. */
  alt?: string;
}

export function DealerLogo({ name, logoKey, className, alt }: DealerLogoProps) {
  const [failed, setFailed] = React.useState(false);

  // A new key deserves a fresh attempt — otherwise replacing a broken logo
  // would keep showing initials until a full reload.
  React.useEffect(() => {
    setFailed(false);
  }, [logoKey]);

  const box = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-card",
    "border border-line bg-brand-light text-brand",
    className ?? "size-10",
  );

  if (logoKey && !failed) {
    return (
      <span className={box}>
        {/* Plain <img>: the media host is not in the next/image allowlist and a
            logo is small enough that the loader would cost more than it saves. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(logoKey)}
          alt={alt ?? name}
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={cn(box, "text-sm font-extrabold")} role="img" aria-label={name}>
      <span aria-hidden>{dealerInitials(name)}</span>
    </span>
  );
}
