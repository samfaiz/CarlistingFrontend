/**
 * Saved-cars state — task P1-09 (FR-U1).
 *
 * Lightweight context mounted once in _app.tsx. When the session becomes
 * authenticated it fetches GET /saved/cars ONCE per session and keeps the
 * saved listing-id set in memory; heart buttons everywhere read/toggle it.
 *
 * `toggle` is optimistic: the set flips immediately, the API call follows,
 * and a failure rolls the flip back (the caller decides how to surface the
 * error — the provider stays toast-free so it carries no i18n dependency).
 */
import * as React from "react";
import { useSession } from "next-auth/react";
import { getSavedCars, saveCar, unsaveCar } from "@/lib/marketplace-api";

export interface SavedContextValue {
  /** True once the session state is known (authed fetch done or guest). */
  ready: boolean;
  /** True when a signed-in user is present (heart can toggle server state). */
  authed: boolean;
  isSaved: (listingId: string) => boolean;
  /**
   * Optimistically flip a listing's saved state and sync the backend.
   * Resolves `true` on success, `false` on API failure (state rolled back).
   * Never call when `authed` is false — the button redirects to login instead.
   */
  toggle: (listingId: string) => Promise<boolean>;
  /** Saved count (for badges/menus later phases). */
  count: number;
}

const SavedContext = React.createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const token = session?.accessToken;

  const [ids, setIds] = React.useState<Set<string>>(() => new Set());
  const [ready, setReady] = React.useState(false);
  // "Once per session": remember which user the set was fetched for.
  const fetchedFor = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !token) {
      fetchedFor.current = null;
      setIds(new Set());
      setReady(true);
      return;
    }
    const userId = session.user.id;
    if (fetchedFor.current === userId) return;
    fetchedFor.current = userId;
    let cancelled = false;
    getSavedCars(token)
      .then((rows) => {
        if (cancelled) return;
        setIds(new Set(rows.map((row) => row.listing.id)));
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Degrade to an empty set — hearts still work (POST/DELETE succeed).
        setIds(new Set());
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [status, token, session?.user.id]);

  const isSaved = React.useCallback((listingId: string) => ids.has(listingId), [ids]);

  const toggle = React.useCallback(
    async (listingId: string): Promise<boolean> => {
      if (!token) return false;
      const wasSaved = ids.has(listingId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      try {
        if (wasSaved) await unsaveCar(listingId, token);
        else await saveCar(listingId, token);
        return true;
      } catch {
        // Roll back the optimistic flip.
        setIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        return false;
      }
    },
    [ids, token],
  );

  const value = React.useMemo<SavedContextValue>(
    () => ({
      ready,
      authed: Boolean(token),
      isSaved,
      toggle,
      count: ids.size,
    }),
    [ready, token, isSaved, toggle, ids.size],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const ctx = React.useContext(SavedContext);
  if (!ctx) {
    throw new Error("useSaved must be used inside <SavedProvider> (_app.tsx)");
  }
  return ctx;
}
