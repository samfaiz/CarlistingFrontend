/**
 * Resolves "which dealership am I acting for, and what may I do" once per page
 * (task P3-02).
 *
 * The permissions come from the API, never from a client-side guess: the
 * backend re-reads DealerMember on every request, so a member removed a second
 * ago loses access on their next call rather than when their token expires.
 * Mirroring that logic in the browser would only create a second answer that
 * can disagree with the real one.
 */
import * as React from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  getDealerQuota,
  getMyDealer,
  type DealerContextResponse,
  type QuotaState,
} from "@/lib/marketplace-api";

export interface UseDealerResult {
  context: DealerContextResponse | null;
  quota: QuotaState | null;
  loading: boolean;
  error: string | null;
  /** No dealership at all — the caller should send the visitor to onboarding. */
  needsOnboarding: boolean;
  accessToken: string | undefined;
  refresh: () => Promise<void>;
}

export function useDealer(): UseDealerResult {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const accessToken = session?.accessToken;
  const dealerIdParam =
    typeof router.query.dealerId === "string" ? router.query.dealerId : undefined;

  const [context, setContext] = React.useState<DealerContextResponse | null>(null);
  const [quota, setQuota] = React.useState<QuotaState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const resolved = await getMyDealer(accessToken, dealerIdParam);
      setContext(resolved);
      if (resolved.dealer) {
        // Quota is a separate call on purpose: every team member may read it,
        // while the dealer record itself carries billing-adjacent fields.
        setQuota(await getDealerQuota(resolved.dealer.id, accessToken));
      } else {
        setQuota(null);
      }
    } catch {
      setError("load-failed");
    } finally {
      setLoading(false);
    }
  }, [accessToken, dealerIdParam]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return {
    context,
    quota,
    loading: loading || status === "loading",
    error,
    needsOnboarding: !loading && context !== null && context.dealer === null,
    accessToken,
    refresh: load,
  };
}
