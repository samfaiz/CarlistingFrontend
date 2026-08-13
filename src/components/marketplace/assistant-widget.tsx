import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { apiPost } from "@/lib/api";

interface CardItem {
  id: string;
  slug: string;
  year: number;
  priceAed: number;
  mileageKm: number;
  make?: { name: string };
  model?: { name: string };
}
interface AssistantResponse {
  kind: "results" | "refusal" | "help";
  text?: string;
  link?: string;
  filters?: Record<string, unknown>;
  total?: number;
  items?: CardItem[];
  searchUrl?: string;
  compareUrl?: string | null;
}
interface Turn {
  role: "user" | "assistant";
  text?: string;
  response?: AssistantResponse;
}

/**
 * Buying-assistant chat widget (P5-02, FR-AI1). Floating launcher on home +
 * search; NL requests become real filtered results rendered as in-chat cards
 * with "See all" (search deep link) and "Compare" (FR-CV8 handoff). Follow-ups
 * carry the prior filter set. Guests are rate-limited server-side.
 */
export function AssistantWidget() {
  const { t } = useTranslation("mk-assistant");
  const { locale } = useRouter();
  const [open, setOpen] = React.useState(false);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const priorFilters = React.useRef<Record<string, unknown> | undefined>(undefined);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, open]);

  const send = async () => {
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setTurns((ts) => [...ts, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await apiPost<AssistantResponse>("/ai/assistant", {
        message,
        priorFilters: priorFilters.current,
        locale: locale ?? "en",
      });
      if (res.kind === "results") priorFilters.current = res.filters;
      setTurns((ts) => [...ts, { role: "assistant", response: res }]);
    } catch {
      setTurns((ts) => [...ts, { role: "assistant", response: { kind: "help", text: t("error", { defaultValue: "The assistant is busy — try again in a minute." }) } }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="assistant-fab"
        aria-label={t("open", { defaultValue: "Ask the buying assistant" })}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "×" : "🤖"}
      </button>

      {open && (
        <div className="assistant-panel" role="dialog" aria-label={t("title", { defaultValue: "Buying assistant" })}>
          <div className="assistant-head">
            <strong>{t("title", { defaultValue: "Buying assistant" })}</strong>
            <span>{t("subtitle", { defaultValue: "Describe the car you want" })}</span>
          </div>
          <div className="assistant-body" ref={scrollRef}>
            {turns.length === 0 && (
              <div className="assistant-hint">
                {t("hint", { defaultValue: "Try:" })}{" "}
                <button type="button" onClick={() => { setInput(t("example", { defaultValue: "family SUV under 150K, low mileage" })); }}>
                  “{t("example", { defaultValue: "family SUV under 150K, low mileage" })}”
                </button>
              </div>
            )}
            {turns.map((turn, i) => (
              <div key={i} className={`assistant-turn ${turn.role}`}>
                {turn.role === "user" && <p>{turn.text}</p>}
                {turn.role === "assistant" && turn.response && (
                  <div>
                    {turn.response.kind !== "results" && <p>{turn.response.text}</p>}
                    {turn.response.kind === "help" && turn.response.link && (
                      <Link href={turn.response.link} className="assistant-link">{t("helpLink", { defaultValue: "Open the help centre →" })}</Link>
                    )}
                    {turn.response.kind === "results" && (
                      <>
                        <p>{t("found", { count: turn.response.total ?? 0, defaultValue: `Found ${turn.response.total} matches` })}</p>
                        <div className="assistant-cards">
                          {(turn.response.items ?? []).slice(0, 3).map((c) => (
                            <Link key={c.id} href={`/cars/${c.slug}`} className="assistant-card">
                              <strong>{c.year} {c.make?.name} {c.model?.name}</strong>
                              <span>AED {c.priceAed.toLocaleString()} · {c.mileageKm.toLocaleString()} km</span>
                            </Link>
                          ))}
                        </div>
                        <div className="assistant-actions">
                          {turn.response.searchUrl && <Link href={turn.response.searchUrl} className="assistant-link">{t("seeAll", { defaultValue: "See all results →" })}</Link>}
                          {turn.response.compareUrl && <Link href={turn.response.compareUrl} className="assistant-link">{t("compare", { defaultValue: "Compare top 3 →" })}</Link>}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="assistant-turn assistant"><p>…</p></div>}
          </div>
          <form
            className="assistant-input"
            onSubmit={(e) => { e.preventDefault(); void send(); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder", { defaultValue: "e.g. Toyota SUV under 120K in Dubai" })}
              maxLength={600}
            />
            <button type="submit" disabled={busy || !input.trim()}>{t("send", { defaultValue: "Send" })}</button>
          </form>
        </div>
      )}
    </>
  );
}
