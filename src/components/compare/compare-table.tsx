/**
 * The comparison itself: car columns, then every spec the compared vehicles
 * actually carry, grouped basic → advanced and collapsible.
 *
 * Two horizontal scrollers — the sticky car header and the table body — kept in
 * step by hand, because a single scroller cannot be both `overflow-x: auto`
 * (which makes the vertical axis a scrollport too) and vertically sticky. The
 * label column is pinned to the inline start of each, so six columns stay
 * readable on a phone.
 */
import * as React from "react";
import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { formatPrice, mediaUrl } from "@/lib/format";
import type { CompareColumn, CompareResult } from "@/lib/marketplace-api";
import { useCompareLabels } from "./use-compare-labels";
import styles from "./compare-table.module.css";

export interface CompareTableProps {
  result: CompareResult;
  locale: string;
  /** Hidden on a shared link: the visitor is not editing someone else's set. */
  onRemove?: (listingId: string) => void;
  onAdd?: () => void;
  showAdd: boolean;
  diffOnly: boolean;
}

/** Advanced groups start folded — they are reference, not the first read. */
const startsCollapsed = (tier: string) => tier === "advanced";

export function CompareTable({
  result,
  locale,
  onRemove,
  onAdd,
  showAdd,
  diffOnly,
}: CompareTableProps) {
  const { t } = useTranslation("mk-compare");
  const { rowLabel, groupLabel, rowValue } = useCompareLabels(locale);

  const headRef = React.useRef<HTMLDivElement | null>(null);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);

  // One scroller drives the other; the guard stops the echo from looping.
  React.useEffect(() => {
    const head = headRef.current;
    const body = bodyRef.current;
    if (!head || !body) return;
    let syncing = false;
    const mirror = (from: HTMLDivElement, to: HTMLDivElement) => () => {
      if (syncing) return;
      syncing = true;
      to.scrollLeft = from.scrollLeft;
      window.requestAnimationFrame(() => {
        syncing = false;
      });
    };
    const onHead = mirror(head, body);
    const onBody = mirror(body, head);
    head.addEventListener("scroll", onHead, { passive: true });
    body.addEventListener("scroll", onBody, { passive: true });
    return () => {
      head.removeEventListener("scroll", onHead);
      body.removeEventListener("scroll", onBody);
    };
  }, []);

  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  // A new comparison can bring new groups; seed their default fold state once.
  React.useEffect(() => {
    setCollapsed((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const group of result.groups) {
        if (next[group.key] === undefined) {
          next[group.key] = startsCollapsed(group.tier);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [result.groups]);

  const rowsByKey = React.useMemo(() => {
    const map = new Map<string, CompareResult["rows"][number]>();
    for (const row of result.rows) map.set(`${row.group}:${row.key}`, row);
    return map;
  }, [result.rows]);

  const sections = React.useMemo(
    () =>
      result.groups
        .map((group) => ({
          group,
          rows: group.rowKeys
            .map((key) => rowsByKey.get(`${group.key}:${key}`))
            .filter((r): r is CompareResult["rows"][number] => r !== undefined)
            .filter((r) => (diffOnly ? !r.identical : true)),
        }))
        .filter((s) => s.rows.length > 0),
    [result.groups, rowsByKey, diffOnly],
  );

  // The "+" tile occupies a real column so the header and the value cells stay
  // on the same grid; the body simply leaves that last cell empty.
  const columnCount = result.columns.length + (showAdd ? 1 : 0);
  const frameStyle = {
    "--cmp-cols": String(columnCount),
  } as React.CSSProperties;

  const priceOf = (column: CompareColumn) =>
    column.priceAed != null ? formatPrice(column.priceAed, locale) : t("noValue");

  return (
    <>
      <div ref={headRef} className={`${styles.scroller} ${styles.headScroller}`}>
        <div
          className={`compare-cars ${styles.frame} ${styles.carsGrid}`}
          style={frameStyle}
        >
          <div className="cmp-spec-col">
            <h3>{t("cars.heading", { count: result.columns.length })}</h3>
            <p>{t("cars.hint")}</p>
          </div>
          {result.columns.map((column) => (
            <div className="cmp-car" key={column.key}>
              {onRemove && column.listingId && (
                <button
                  className="cmp-remove"
                  type="button"
                  aria-label={t("cars.removeNamed", { title: column.title })}
                  onClick={() => onRemove(column.listingId!)}
                >
                  <span aria-hidden>✕</span>
                </button>
              )}
              <div className="cmp-car-photo">
                {column.coverKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(column.coverKey)} alt="" />
                ) : (
                  <div style={{ aspectRatio: "16/10" }} />
                )}
              </div>
              <h4>{column.title}</h4>
              <div className="cmp-car-price">{priceOf(column)}</div>
              {column.kind === "MODEL" && column.liveCount != null && (
                <p className="cmp-car-meta">
                  {t("cars.liveCount", { count: column.liveCount })}
                </p>
              )}
              <div className="cmp-car-actions">
                {column.slug && (
                  <Link href={`/cars/${column.slug}`} className="btn btn-primary">
                    {t("cars.viewDetails")}
                  </Link>
                )}
              </div>
            </div>
          ))}
          {showAdd && (
            <button
              type="button"
              className={`cmp-add ${styles.addTile}`}
              onClick={onAdd}
              data-testid="compare-add-tile"
            >
              <span className="cmp-add-content">
                <span className="add-icon-big" aria-hidden>
                  <Plus size={22} />
                </span>
                <span className={styles.addTitle}>{t("add.title")}</span>
                <small>{t("add.subtitle")}</small>
              </span>
            </button>
          )}
        </div>
      </div>

      <div ref={bodyRef} className={styles.scroller}>
        <div className={styles.frame} style={frameStyle}>
          {sections.map(({ group, rows }) => {
            const isCollapsed = collapsed[group.key] ?? startsCollapsed(group.tier);
            const bodyId = `cmp-group-${group.key}`;
            return (
              <div
                className={`cmp-section ${styles.section}${isCollapsed ? " collapsed" : ""}`}
                key={group.key}
              >
                <h3 className={`cmp-section-title ${styles.sectionTitle}`}>
                  <button
                    type="button"
                    className={styles.toggle}
                    aria-expanded={!isCollapsed}
                    aria-controls={bodyId}
                    onClick={() =>
                      setCollapsed((prev) => ({
                        ...prev,
                        [group.key]: !isCollapsed,
                      }))
                    }
                  >
                    <span className="left">
                      {groupLabel(group)}
                      {/* The first groups are self-evidently the basics; the
                          badge only earns its place further down the page. */}
                      {group.tier !== "basic" && (
                        <span className={styles.groupTier}>
                          {t(`tiers.${group.tier}`)}
                        </span>
                      )}
                    </span>
                    <span className={styles.toggleEnd}>
                      <span className={styles.rowCount}>
                        {t("rowCount", { count: rows.length })}
                      </span>
                      <ChevronDown className="cmp-chevron" size={18} aria-hidden />
                    </span>
                  </button>
                </h3>
                <div className={`cmp-table ${styles.tableBody}`} id={bodyId}>
                  {rows.map((row) => (
                    <div
                      className={`cmp-row ${styles.row}`}
                      key={`${row.group}:${row.key}`}
                    >
                      <div className={`cmp-label ${styles.labelCell}`}>
                        {rowLabel(row)}
                        {row.unit && row.kind === "spec" ? ` (${row.unit})` : ""}
                      </div>
                      {row.values.map((value, index) => (
                        <div
                          key={index}
                          className={`cmp-val${
                            row.winners.includes(index) && !row.identical
                              ? " winner"
                              : ""
                          }${value === null ? ` ${styles.gap}` : ""}`}
                        >
                          {value === null
                            ? t("notListed")
                            : rowValue(row, value)}
                        </div>
                      ))}
                      {showAdd && <div className={styles.spacerCell} />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
