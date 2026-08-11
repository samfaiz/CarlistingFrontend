/**
 * Compare v1 state — task P1-10 (FR-CV1).
 *
 * Context mounted once in _app.tsx. Holds up to 4 compare entries (cars only
 * for now — the entry shape is deliberately vehicle-agnostic so bikes slot in
 * later), persisted to localStorage so the tray survives navigation/reload.
 *
 * Hydration happens in an effect (never during SSR render) so server and
 * first client paint agree; `ready` gates consumers that would otherwise
 * flash an empty state. Weighted scores / guided quiz arrive with P2-06 —
 * keep this provider limited to membership state.
 */
import * as React from "react";

/** Everything the tray + /compare page need before the detail fetch. */
export interface CompareEntry {
  id: string;
  slug: string;
  /** Composed "year make model trim" display title. */
  title: string;
  year: number;
  priceAed: number;
  /** Card image variant key, if the listing has media. */
  thumb: string | null;
}

export const COMPARE_MAX = 4;
const STORAGE_KEY = "carsens.compare.v1";

export interface CompareContextValue {
  /** True after localStorage hydration (client only). */
  ready: boolean;
  items: CompareEntry[];
  has: (listingId: string) => boolean;
  /** True when the tray is at COMPARE_MAX capacity. */
  full: boolean;
  /**
   * Add/remove an entry. Returns false when the tray is full and the entry
   * is not already in it (caller surfaces the "max 4" toast).
   */
  toggle: (entry: CompareEntry) => boolean;
  remove: (listingId: string) => void;
  clear: () => void;
}

const CompareContext = React.createContext<CompareContextValue | null>(null);

function readStorage(): CompareEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is CompareEntry =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as CompareEntry).id === "string" &&
          typeof (x as CompareEntry).slug === "string",
      )
      .slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CompareEntry[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setItems(readStorage());
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full/blocked — compare still works for the session.
    }
  }, [items, ready]);

  const has = React.useCallback(
    (listingId: string) => items.some((x) => x.id === listingId),
    [items],
  );

  const toggle = React.useCallback(
    (entry: CompareEntry): boolean => {
      // Decide on the current snapshot (state updaters are not guaranteed to
      // run synchronously, so the return value must not depend on them).
      if (items.some((x) => x.id === entry.id)) {
        setItems((prev) => prev.filter((x) => x.id !== entry.id));
        return true;
      }
      if (items.length >= COMPARE_MAX) return false;
      setItems((prev) =>
        prev.some((x) => x.id === entry.id) || prev.length >= COMPARE_MAX
          ? prev
          : [...prev, entry],
      );
      return true;
    },
    [items],
  );

  const remove = React.useCallback((listingId: string) => {
    setItems((prev) => prev.filter((x) => x.id !== listingId));
  }, []);

  const clear = React.useCallback(() => setItems([]), []);

  const value = React.useMemo<CompareContextValue>(
    () => ({
      ready,
      items,
      has,
      full: items.length >= COMPARE_MAX,
      toggle,
      remove,
      clear,
    }),
    [ready, items, has, toggle, remove, clear],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = React.useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used inside <CompareProvider> (_app.tsx)");
  }
  return ctx;
}
