/**
 * "Add another car" picker — the `+` tile at the end of the compare columns.
 *
 * An inline disclosure rather than a modal: the compare page is already a wide
 * scrolling surface, and a phone reader gets the picker in the flow instead of
 * a trapped overlay. Three sources, in the order a shopper actually thinks of
 * them — the cars they saved, the searches they saved, then plain search.
 *
 * Everything here is the `.mk` design layer plus layout-only module CSS; the
 * shadcn kit belongs to the internal surfaces.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { useSession } from "next-auth/react";
import { formatPrice, mediaUrl } from "@/lib/format";
import {
  getSavedCars,
  getSavedSearches,
  searchListings,
  type Card,
  type SavedCar,
  type SavedSearch,
  type SearchListingsParams,
} from "@/lib/marketplace-api";
import { useCompare, type CompareEntry } from "./compare-provider";
import styles from "./add-car-panel.module.css";

type Source = "saved" | "searches" | "search";

const SOURCES: Source[] = ["saved", "searches", "search"];

interface Candidate {
  entry: CompareEntry;
  meta: string;
}

const fromCard = (card: Card): Candidate => ({
  entry: {
    id: card.id,
    slug: card.slug,
    title: [card.year, card.make.name, card.model.name, card.trim?.name]
      .filter(Boolean)
      .join(" "),
    year: card.year,
    priceAed: card.priceAed,
    thumb: card.media[0]?.variants?.card ?? null,
  },
  meta: card.emirate.name,
});

const fromSaved = (row: SavedCar): Candidate => ({
  entry: {
    id: row.listing.id,
    slug: row.listing.slug,
    title: [
      row.listing.year,
      row.listing.make.name,
      row.listing.model.name,
      row.listing.trim?.name,
    ]
      .filter(Boolean)
      .join(" "),
    year: row.listing.year,
    priceAed: row.listing.priceAed,
    thumb: row.listing.media[0]?.variants?.card ?? null,
  },
  meta: row.listing.emirate.name,
});

export interface AddCarPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Slugs already in the comparison — offered but not addable twice. */
  presentIds: string[];
  locale: string;
}

export function AddCarPanel({
  open,
  onOpenChange,
  presentIds,
  locale,
}: AddCarPanelProps) {
  const { t } = useTranslation("mk-compare");
  const { data: session } = useSession();
  const { toggle, full } = useCompare();
  const token = session?.accessToken;

  const [source, setSource] = React.useState<Source>(token ? "saved" : "search");
  const [query, setQuery] = React.useState("");
  const [savedSearches, setSavedSearches] = React.useState<SavedSearch[]>([]);
  const [activeSearchId, setActiveSearchId] = React.useState<string>("");
  const [results, setResults] = React.useState<Candidate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  // Saved searches are the menu for the "searches" source, so they load once
  // the panel opens rather than on every source switch.
  React.useEffect(() => {
    if (!open || !token) return;
    let live = true;
    getSavedSearches(token)
      .then((rows) => {
        if (!live) return;
        setSavedSearches(rows);
        setActiveSearchId((prev) => prev || (rows[0]?.id ?? ""));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [open, token]);

  React.useEffect(() => {
    if (!open) return;
    let live = true;
    setFailed(false);

    const run = async (): Promise<Candidate[]> => {
      if (source === "saved") {
        if (!token) return [];
        const rows = await getSavedCars(token);
        return rows.filter((r) => r.stillLive).map(fromSaved);
      }
      if (source === "searches") {
        const chosen = savedSearches.find((s) => s.id === activeSearchId);
        if (!chosen) return [];
        // A saved search stores the /cars query-param object (all strings);
        // the API layer re-serialises it, so widening it back is safe.
        const res = await searchListings({
          ...chosen.query,
          limit: 12,
        } as unknown as SearchListingsParams);
        return res.items.map(fromCard);
      }
      const res = await searchListings({
        q: query.trim() || undefined,
        limit: 12,
      });
      return res.items.map(fromCard);
    };

    setLoading(true);
    // The free-text source waits for a pause in typing; the other two fire at
    // once because the user already chose what they want to see.
    const delay = source === "search" && query.trim() ? 350 : 0;
    const timer = window.setTimeout(() => {
      run()
        .then((rows) => {
          if (live) setResults(rows);
        })
        .catch(() => {
          if (live) {
            setResults([]);
            setFailed(true);
          }
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    }, delay);

    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [open, source, token, query, activeSearchId, savedSearches]);

  if (!open) return null;

  const add = (candidate: Candidate) => {
    if (toggle(candidate.entry)) onOpenChange(false);
  };

  return (
    <section
      className={styles.panel}
      aria-label={t("add.panelLabel")}
      data-testid="compare-add-panel"
    >
      <div className={styles.panelHead}>
        <h3 className={styles.panelTitle}>{t("add.title")}</h3>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onOpenChange(false)}
        >
          {t("add.close")}
        </button>
      </div>

      <div className={styles.sources} role="group" aria-label={t("add.sourceLabel")}>
        {SOURCES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={source === option}
            disabled={option !== "search" && !token}
            className={`${styles.sourceBtn} ${source === option ? styles.sourceBtnOn : ""}`}
            onClick={() => setSource(option)}
          >
            {t(`add.source.${option}`)}
          </button>
        ))}
      </div>

      {source === "search" && (
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="cmp-add-search">
            {t("add.searchLabel")}
          </label>
          <input
            id="cmp-add-search"
            type="search"
            className={`form-input ${styles.control}`}
            value={query}
            placeholder={t("add.searchPlaceholder")}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {source === "searches" && (
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="cmp-add-saved-search">
            {t("add.savedSearchLabel")}
          </label>
          <select
            id="cmp-add-saved-search"
            className={`form-input ${styles.control}`}
            value={activeSearchId}
            onChange={(e) => setActiveSearchId(e.target.value)}
          >
            {savedSearches.length === 0 && (
              <option value="">{t("add.noSavedSearches")}</option>
            )}
            {savedSearches.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!token && source !== "search" && (
        <p className={styles.note}>{t("add.signInHint")}</p>
      )}

      {full && <p className={styles.note}>{t("add.trayFull")}</p>}

      {loading ? (
        <p className={styles.note}>{t("add.loading")}</p>
      ) : failed ? (
        <p className={styles.note} role="status">
          {t("add.failed")}
        </p>
      ) : results.length === 0 ? (
        <p className={styles.note}>{t("add.empty")}</p>
      ) : (
        <ul className={styles.results}>
          {results.map((candidate) => {
            const already = presentIds.includes(candidate.entry.id);
            return (
              <li key={candidate.entry.id} className={styles.result}>
                <span className={styles.thumb} aria-hidden>
                  {candidate.entry.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(candidate.entry.thumb)} alt="" />
                  ) : null}
                </span>
                <span className={styles.resultText}>
                  <strong>{candidate.entry.title}</strong>
                  <small>
                    {formatPrice(candidate.entry.priceAed, locale)} · {candidate.meta}
                  </small>
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={already || full}
                  onClick={() => add(candidate)}
                >
                  {already ? t("add.alreadyIn") : t("add.add")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
