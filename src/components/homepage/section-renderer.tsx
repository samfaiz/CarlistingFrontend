/**
 * Renders one resolved home-page section.
 *
 * The SAME component renders the live public page and the Studio preview, so
 * "what you see in the editor" is not an approximation of what ships — it is
 * the identical code path with a different layout source. Markup reuses the
 * `.mk` mockup classes, so a layout left at its defaults is pixel-identical to
 * the hand-written page it replaced.
 */
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { MarketplaceCard } from "@/components/marketplace/listing-card";
import type { Card } from "@/lib/marketplace-api";

export interface ResolvedField {
  text: string | null;
  key: string | null;
}
export interface ResolvedSection {
  id: string;
  kind: string;
  content: Record<string, ResolvedField>;
  style: Record<string, unknown>;
  config: Record<string, unknown>;
  data: unknown;
}

const ARROW = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/**
 * Style tokens → CSS. Named tokens resolve through the design-system custom
 * properties so a rebrand moves them; only an explicit `custom` choice pins a
 * literal colour, which is a campaign decision an editor made on purpose.
 */
const BG: Record<string, string> = {
  page: "var(--page, #fff)",
  surface: "var(--surface, #f6f8fb)",
  brand: "var(--brand, #23416B)",
  "brand-dark": "var(--brand-dark, #16294a)",
  ink: "var(--ink, #0f172a)",
  success: "var(--success, #0F7A4A)",
  transparent: "transparent",
};
const FG: Record<string, string> = {
  ink: "var(--ink, #0f172a)",
  muted: "var(--muted, #64748b)",
  inverse: "#fff",
  brand: "var(--brand, #23416B)",
};
/* Also inline, so also clamped rather than fixed. */
const HEADING_SIZE: Record<string, string> = {
  sm: "clamp(17px, 4.4vw, 20px)",
  md: "clamp(19px, 5vw, 24px)",
  lg: "clamp(21px, 5.6vw, 28px)",
  xl: "clamp(26px, 8vw, 40px)",
};
const BODY_SIZE: Record<string, string> = {
  sm: "13px",
  md: "clamp(14px, 3.8vw, 15px)",
  lg: "clamp(15px, 4.2vw, 17px)",
};
/*
 * Section padding is written as an INLINE style, so no stylesheet can trim it
 * on a phone — 64px top and bottom is a quarter of a small screen spent on
 * whitespace. clamp() keeps the editor's choice while letting it scale with
 * the viewport: the phone value on the left, the desktop value on the right.
 */
const PAD: Record<string, string> = {
  none: "0",
  tight: "0 0 clamp(24px, 6vw, 40px)",
  normal: "clamp(24px, 6vw, 40px) 0",
  loose: "clamp(28px, 8vw, 64px) 0",
};
const FONT: Record<string, string> = {
  sans: "var(--font-sans, 'Inter Variable', system-ui, sans-serif)",
  display: "var(--font-display, 'Inter Variable', system-ui, sans-serif)",
  arabic: "'Noto Sans Arabic Variable', 'Inter Variable', sans-serif",
};

export function sectionStyle(style: Record<string, unknown>): React.CSSProperties {
  const bgToken = String(style.background ?? "page");
  const fgToken = String(style.text ?? "ink");
  return {
    background: bgToken === "custom" ? String(style.backgroundHex ?? "#ffffff") : (BG[bgToken] ?? BG.page),
    color: fgToken === "custom" ? String(style.textHex ?? "#0f172a") : (FG[fgToken] ?? FG.ink),
    fontFamily: FONT[String(style.fontFamily ?? "sans")] ?? FONT.sans,
    padding: PAD[String(style.padding ?? "normal")] ?? PAD.normal,
    // Logical property: `textAlign: start/end` is RTL-correct where left/right is not.
    textAlign: (style.align as React.CSSProperties["textAlign"]) ?? "start",
  };
}

/**
 * Editor override first, else the catalogue key. Deliberately NOT named `use*`:
 * it uses no hooks and is called inside switch branches, where a hook would be
 * a rules-of-hooks violation.
 */
function fieldText(field: ResolvedField | undefined, t: (k: string) => string): string {
  if (!field) return "";
  if (field.text) return field.text;
  if (!field.key) return "";
  // Keys arrive namespaced (`mk-home:hero.title`); the translator is bound to
  // its namespace, so strip the prefix before looking it up.
  const bare = field.key.includes(":") ? field.key.split(":").slice(1).join(":") : field.key;
  const translated = t(bare);
  return translated === bare ? "" : translated;
}

function SectionHead({
  title,
  subtitle,
  viewAll,
  href,
  style,
  t,
}: {
  title?: ResolvedField;
  subtitle?: ResolvedField;
  viewAll?: ResolvedField;
  href: string;
  style: Record<string, unknown>;
  t: (k: string) => string;
}) {
  const titleText = fieldText(title, t);
  const subText = fieldText(subtitle, t);
  const viewAllText = fieldText(viewAll, t);
  const headingSize = HEADING_SIZE[String(style.headingSize ?? "lg")] ?? HEADING_SIZE.lg;
  const bodySize = BODY_SIZE[String(style.bodySize ?? "md")] ?? BODY_SIZE.md;
  if (!titleText && !subText) return null;
  return (
    <div className="section-head">
      <div>
        {titleText ? <h2 style={{ fontSize: headingSize }}>{titleText}</h2> : null}
        {subText ? <p style={{ fontSize: bodySize }}>{subText}</p> : null}
      </div>
      {viewAllText ? (
        <Link href={href} className="view-all">
          {viewAllText} {ARROW}
        </Link>
      ) : null}
    </div>
  );
}

/** A canvas band, drawn from the portable layer model the Studio canvas emits. */
function CanvasBand({ config }: { config: Record<string, unknown> }) {
  const width = Number(config.width ?? 1280) || 1280;
  const height = Number(config.height ?? 320) || 320;
  const layers = Array.isArray(config.layers) ? (config.layers as Array<Record<string, unknown>>) : [];
  const body = (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Promotional banner"
      style={{ display: "block", maxWidth: "100%", height: "auto" }}
    >
      {layers.map((l, i) => {
        const type = String(l.type ?? "");
        const common = { x: Number(l.x ?? 0), y: Number(l.y ?? 0) };
        if (type === "rect") {
          return (
            <rect
              key={i}
              {...common}
              width={Number(l.width ?? 0)}
              height={Number(l.height ?? 0)}
              fill={String(l.fill ?? "#23416B")}
              rx={Number(l.cornerRadius ?? 0)}
              opacity={Number(l.opacity ?? 1)}
            />
          );
        }
        if (type === "text") {
          return (
            <text
              key={i}
              {...common}
              dominantBaseline="hanging"
              fontSize={Number(l.fontSize ?? 24)}
              fontFamily={String(l.fontFamily ?? "Inter Variable, sans-serif")}
              fontWeight={String(l.fontStyle ?? "normal").includes("bold") ? 700 : 400}
              fill={String(l.fill ?? "#0f172a")}
            >
              {String(l.text ?? "")}
            </text>
          );
        }
        if (type === "image" && typeof l.src === "string") {
          return (
            <image
              key={i}
              {...common}
              width={Number(l.width ?? 0)}
              height={Number(l.height ?? 0)}
              href={l.src}
              preserveAspectRatio="xMidYMid slice"
            />
          );
        }
        return null;
      })}
    </svg>
  );
  const href = typeof config.href === "string" && config.href ? config.href : null;
  return href ? <Link href={href}>{body}</Link> : body;
}

export function HomepageSection({ section }: { section: ResolvedSection }) {
  const { t } = useTranslation("mk-home");
  const { kind, content, style, config, data } = section;
  const wrapper = sectionStyle(style);
  const width = String(style.width ?? "container");
  const inner = width === "full" ? { width: "100%" } : undefined;
  const containerClass = width === "full" ? "" : "container";

  const heading = (href: string) => (
    <SectionHead title={content.title} subtitle={content.subtitle} viewAll={content.viewAll} href={href} style={style} t={t} />
  );

  switch (kind) {
    case "FEATURED_LISTINGS":
    case "NEW_LISTINGS":
    case "BEST_DEALS": {
      const cards = (Array.isArray(data) ? data : []) as Card[];
      if (cards.length === 0) return null;
      const href = kind === "NEW_LISTINGS" ? "/cars?sort=newest" : "/cars";
      return (
        <section style={wrapper}>
          <div className={containerClass} style={inner}>
            {heading(href)}
            <div className="cards">
              {cards.map((car) => (
                <MarketplaceCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "FEATURED_DEALERS": {
      const dealers = (Array.isArray(data) ? data : []) as Array<{
        id: string;
        slug: string;
        name: string;
        verificationStatus: string;
        brands: string[];
        _count: { listings: number };
      }>;
      if (dealers.length === 0) return null;
      return (
        <section style={wrapper}>
          <div className={containerClass} style={inner}>
            {heading("/dealers")}
            <div className="brands">
              {dealers.map((d) => (
                <Link key={d.id} href={`/dealers/${d.slug}`} className="brand-card">
                  <div className="logo-circle">{d.name.charAt(0)}</div>
                  <div className="brand-name">{d.name}</div>
                  <div className="count">
                    {d._count.listings} {t("body.cars")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "BRANDS": {
      const makes = (Array.isArray(data) ? data : []) as Array<{
        id: string; name: string; slug: string; vehicleTypes?: string[];
      }>;
      if (makes.length === 0) return null;
      // A bike-only marque links to /bikes; sending Ducati to /cars is a dead end.
      const surface = (m: { vehicleTypes?: string[] }) =>
        m.vehicleTypes && m.vehicleTypes.length === 1 && m.vehicleTypes[0] === "BIKE" ? "/bikes" : "/cars";
      const scope = String(config.vehicleType ?? "CAR") === "BIKE" ? "/bikes" : "/cars";
      return (
        <section className="brands-section" style={wrapper}>
          <div className={containerClass} style={inner}>
            {heading(scope)}
            <div className="brands">
              {makes.map((m) => (
                <Link key={m.id} href={`${surface(m)}?make=${m.slug}`} className="brand-card">
                  <div className="logo-circle">{m.name.charAt(0)}</div>
                  <div className="brand-name">{m.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "FESTIVAL_CARD": {
      const title = fieldText(content.title, t);
      const subtitle = fieldText(content.subtitle, t);
      const cta = fieldText(content.cta, t);
      const href = typeof config.href === "string" ? config.href : "/cars";
      const badge = typeof config.badge === "string" ? config.badge : null;
      return (
        <section style={wrapper}>
          <div className={containerClass} style={inner}>
            <div
              style={{
                borderRadius: 18,
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: wrapper.textAlign === "center" ? "center" : "flex-start",
                gap: 10,
              }}
            >
              {badge ? (
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.85 }}>
                  {badge}
                </span>
              ) : null}
              <h2 style={{ margin: 0, fontSize: HEADING_SIZE[String(style.headingSize ?? "lg")] ?? HEADING_SIZE.lg }}>{title}</h2>
              {subtitle ? <p style={{ margin: 0, fontSize: BODY_SIZE[String(style.bodySize ?? "md")] ?? BODY_SIZE.md, opacity: 0.9 }}>{subtitle}</p> : null}
              {cta ? (
                <Link
                  href={href}
                  className="btn btn-xl"
                  style={{ marginTop: 12, background: "#fff", color: "var(--brand, #23416B)" }}
                >
                  {cta}
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      );
    }

    case "CANVAS_BAND":
      return (
        <section style={wrapper}>
          <div className={containerClass} style={inner}>
            <CanvasBand config={config} />
          </div>
        </section>
      );

    case "RICH_TEXT": {
      const title = fieldText(content.title, t);
      const body = fieldText(content.body, t);
      return (
        <section style={wrapper}>
          <div className={containerClass} style={inner}>
            {title ? <h2 style={{ fontSize: HEADING_SIZE[String(style.headingSize ?? "lg")] ?? HEADING_SIZE.lg }}>{title}</h2> : null}
            {body ? <p style={{ fontSize: BODY_SIZE[String(style.bodySize ?? "md")] ?? BODY_SIZE.md, whiteSpace: "pre-wrap" }}>{body}</p> : null}
          </div>
        </section>
      );
    }

    // HERO, BODY_TYPES, SELL_BANNER and WHY_US keep their bespoke markup on the
    // page itself — they are structural, not card rows. The layout still governs
    // whether and in what order they appear.
    default:
      return null;
  }
}

export { fieldText as resolveFieldText };
