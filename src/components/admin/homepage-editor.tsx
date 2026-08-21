/**
 * Homepage Studio editor.
 *
 * Left: the section list — reorder, toggle, add, remove.
 * Middle: a live preview rendered by the SAME component the public page uses.
 * Right: the inspector — per-locale text, colour, font, size, spacing,
 *        alignment, data binding and the schedule window.
 *
 * Every edit PATCHes the draft and refreshes the preview, so "live changes"
 * means the real resolved output, not a mock.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { HomepageSection, type ResolvedSection } from "@/components/homepage/section-renderer";

const LOCALES = ["en", "ar", "es", "fr"] as const;
type Locale = (typeof LOCALES)[number];

interface LocalizedField {
  key?: string | null;
  values?: Partial<Record<Locale, string>>;
}
interface DraftSection {
  id: string;
  kind: string;
  sortOrder: number;
  enabled: boolean;
  content: Record<string, LocalizedField>;
  style: Record<string, unknown>;
  config: Record<string, unknown>;
  startsAt: string | null;
  endsAt: string | null;
  missingLocales: Locale[];
  localeCoverage?: { untranslated: Locale[]; catalogueOnly: Locale[] };
}
interface EditorState {
  draft: { id: string; version: number; label: string | null; sections: DraftSection[] };
  published: { id: string; version: number; publishedAt: string; sections: number } | null;
  addableKinds: string[];
}
interface Vocabulary {
  styleTokens: Record<string, readonly string[]>;
  addableKinds: string[];
  locales: readonly string[];
}

const KIND_LABEL: Record<string, string> = {
  HERO: "Hero",
  BODY_TYPES: "Browse by body type",
  FEATURED_LISTINGS: "Featured cars",
  BRANDS: "Browse by make",
  NEW_LISTINGS: "Newly listed",
  SELL_BANNER: "Sell banner",
  WHY_US: "Why us",
  FEATURED_DEALERS: "Featured dealers",
  BEST_DEALS: "Best deals of the day",
  FESTIVAL_CARD: "Festival card",
  CANVAS_BAND: "Canvas band",
  RICH_TEXT: "Text block",
};

/** Sections whose markup lives on the page itself — order and visibility only. */
const STRUCTURAL = new Set(["HERO", "BODY_TYPES", "SELL_BANNER", "WHY_US"]);

export function HomepageEditor({
  api,
}: {
  /** Authenticated fetch bound to the admin API. */
  api: (path: string, init?: RequestInit) => Promise<{ status: number; body: unknown }>;
}) {
  const { t } = useTranslation("admin");
  const [state, setState] = React.useState<EditorState | null>(null);
  const [vocab, setVocab] = React.useState<Vocabulary | null>(null);
  const [preview, setPreview] = React.useState<ResolvedSection[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [previewLocale, setPreviewLocale] = React.useState<Locale>("en");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const [editor, v, p] = await Promise.all([
      api("/admin/homepage"),
      api("/admin/homepage/vocabulary"),
      api(`/admin/homepage/preview?locale=${previewLocale}`),
    ]);
    if (editor.status === 200) setState(editor.body as EditorState);
    if (v.status === 200) setVocab(v.body as Vocabulary);
    if (p.status === 200) setPreview(((p.body as { sections: ResolvedSection[] }).sections) ?? []);
  }, [api, previewLocale]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const selected = state?.draft.sections.find((s) => s.id === selectedId) ?? null;

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(true);
    const r = await api(`/admin/homepage/sections/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    setBusy(false);
    if (r.status !== 200) {
      toast({ title: t("homepage.saveFailed"), description: String((r.body as { message?: string })?.message ?? r.status), variant: "error" });
      return;
    }
    await load();
  };

  const addSection = async (kind: string) => {
    setBusy(true);
    const r = await api("/admin/homepage/sections", { method: "POST", body: JSON.stringify({ kind }) });
    setBusy(false);
    if (r.status === 201) {
      setSelectedId((r.body as { id: string }).id);
      await load();
      toast({ title: t("homepage.sectionAdded") });
    } else {
      toast({ title: t("homepage.addFailed"), variant: "error" });
    }
  };

  const removeSection = async (id: string) => {
    setBusy(true);
    await api(`/admin/homepage/sections/${id}`, { method: "DELETE" });
    setBusy(false);
    if (selectedId === id) setSelectedId(null);
    await load();
  };

  const move = async (id: string, dir: -1 | 1) => {
    if (!state) return;
    const ids = state.draft.sections.map((s) => s.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setBusy(true);
    await api("/admin/homepage/reorder", { method: "POST", body: JSON.stringify({ ids }) });
    setBusy(false);
    await load();
  };

  const publish = async () => {
    setBusy(true);
    const r = await api("/admin/homepage/publish", { method: "POST", body: JSON.stringify({}) });
    setBusy(false);
    if (r.status === 201) {
      toast({ title: t("homepage.published"), description: t("homepage.publishedBody") });
      await load();
    } else if (r.status === 403) {
      toast({ title: t("homepage.publishForbidden"), variant: "error" });
    } else {
      toast({ title: t("homepage.publishFailed"), description: String((r.body as { message?: string })?.message ?? ""), variant: "error" });
    }
  };

  if (!state || !vocab) {
    return <p className="text-muted p-6">{t("homepage.loading")}</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
      {/* ── Sections ─────────────────────────────────────────────────────── */}
      <Panel className="p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("homepage.sections")}</h2>
          <Badge variant="neutral">v{state.draft.version}</Badge>
        </div>
        <ul className="space-y-1">
          {state.draft.sections.map((s, i) => (
            <li key={s.id}>
              <div
                className={`flex items-center gap-1 rounded-card border px-2 py-1.5 ${
                  selectedId === s.id ? "border-brand bg-brand/5" : "border-line"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className="flex-1 text-start text-sm"
                  aria-current={selectedId === s.id}
                >
                  <span className={s.enabled ? "" : "text-muted line-through"}>{KIND_LABEL[s.kind] ?? s.kind}</span>
                  {s.missingLocales.length > 0 ? (
                    <span className="ms-1 text-[11px] text-amber-600" title={t("homepage.localeWarning")}>
                      ⚠ {s.missingLocales.join("/")}
                    </span>
                  ) : null}
                </button>
                <button type="button" onClick={() => void move(s.id, -1)} disabled={i === 0 || busy} aria-label={t("homepage.moveUp")} className="px-1 text-muted disabled:opacity-30">
                  ↑
                </button>
                <button type="button" onClick={() => void move(s.id, 1)} disabled={i === state.draft.sections.length - 1 || busy} aria-label={t("homepage.moveDown")} className="px-1 text-muted disabled:opacity-30">
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <Label htmlFor="add-section" className="text-xs">
            {t("homepage.addSection")}
          </Label>
          <select
            id="add-section"
            className="mt-1 w-full rounded-card border border-line px-2 py-1.5 text-sm"
            value=""
            onChange={(e) => {
              if (e.target.value) void addSection(e.target.value);
              e.target.value = "";
            }}
            disabled={busy}
          >
            <option value="">{t("homepage.choose")}</option>
            {vocab.addableKinds.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k] ?? k}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <Button onClick={() => void publish()} disabled={busy} className="w-full">
            {t("homepage.publish")}
          </Button>
          <p className="mt-2 text-xs text-muted">
            {state.published
              ? t("homepage.liveVersion", { version: state.published.version })
              : t("homepage.nothingLive")}
          </p>
        </div>
      </Panel>

      {/* ── Live preview ─────────────────────────────────────────────────── */}
      <Panel className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <h2 className="text-sm font-semibold">{t("homepage.preview")}</h2>
          <div className="flex gap-1">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setPreviewLocale(l)}
                className={`rounded px-2 py-0.5 text-xs uppercase ${previewLocale === l ? "bg-brand text-white" : "text-muted"}`}
                aria-pressed={previewLocale === l}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {/* `mk` scopes the marketplace design layer; dir flips for the AR check. */}
        <div className="mk max-h-[70vh] overflow-y-auto" dir={previewLocale === "ar" ? "rtl" : "ltr"}>
          {preview.length === 0 ? (
            <p className="p-6 text-sm text-muted">{t("homepage.previewEmpty")}</p>
          ) : (
            preview.map((s) => (
              <div key={s.id} className={selectedId === s.id ? "outline outline-2 outline-brand" : undefined}>
                {STRUCTURAL.has(s.kind) ? (
                  <div className="border-b border-dashed border-line px-4 py-6 text-center text-xs text-muted">
                    {KIND_LABEL[s.kind] ?? s.kind} — {t("homepage.structuralNote")}
                  </div>
                ) : (
                  <HomepageSection section={s} />
                )}
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* ── Inspector ────────────────────────────────────────────────────── */}
      <Panel className="p-3">
        {!selected ? (
          <p className="text-sm text-muted">{t("homepage.selectSection")}</p>
        ) : (
          <Inspector
            key={selected.id}
            section={selected}
            vocab={vocab}
            busy={busy}
            onPatch={(body) => patch(selected.id, body)}
            onRemove={() => removeSection(selected.id)}
            t={t}
          />
        )}
      </Panel>
    </div>
  );
}

function Inspector({
  section,
  vocab,
  busy,
  onPatch,
  onRemove,
  t,
}: {
  section: DraftSection;
  vocab: Vocabulary;
  busy: boolean;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
  onRemove: () => void;
  t: (k: string, o?: Record<string, unknown>) => string;
}) {
  const [locale, setLocale] = React.useState<Locale>("en");
  const fields = Object.keys(section.content);
  const style = section.style;
  const isStructural = STRUCTURAL.has(section.kind);

  const setStyle = (k: string, v: unknown) => onPatch({ style: { ...style, [k]: v } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{KIND_LABEL[section.kind] ?? section.kind}</h2>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={(e) => void onPatch({ enabled: e.target.checked })}
            disabled={busy}
          />
          {t("homepage.visible")}
        </label>
      </div>

      {section.localeCoverage && section.localeCoverage.untranslated.length > 0 ? (
        <p className="rounded-card bg-red-50 p-2 text-xs text-red-700">
          {t("homepage.blankLocales", { locales: section.localeCoverage.untranslated.join(", ") })}
        </p>
      ) : null}
      {section.localeCoverage && section.localeCoverage.catalogueOnly.length > 0 ? (
        <p className="rounded-card bg-amber-50 p-2 text-xs text-amber-800">
          {t("homepage.catalogueLocales", { locales: section.localeCoverage.catalogueOnly.join(", ") })}
        </p>
      ) : null}

      {/* ── Text, per locale ── */}
      {fields.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-muted">{t("homepage.text")}</h3>
            <div className="flex gap-1">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={`rounded px-1.5 text-[11px] uppercase ${locale === l ? "bg-brand text-white" : "text-muted"}`}
                  aria-pressed={locale === l}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {fields.map((name) => (
              <TextField
                key={`${name}-${locale}`}
                id={`f-${section.id}-${name}`}
                name={name}
                field={section.content[name]}
                locale={locale}
                disabled={busy}
                onCommit={(value) => onPatch({ content: { [name]: { values: { [locale]: value } } } })}
                t={t}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Appearance ── */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted">{t("homepage.appearance")}</h3>
        <div className="grid grid-cols-2 gap-2">
          <TokenSelect id={`bg-${section.id}`} label={t("homepage.background")} value={String(style.background ?? "page")} options={vocab.styleTokens.background} onChange={(v) => setStyle("background", v)} disabled={busy} />
          <TokenSelect id={`fg-${section.id}`} label={t("homepage.textColour")} value={String(style.text ?? "ink")} options={vocab.styleTokens.text} onChange={(v) => setStyle("text", v)} disabled={busy} />
          {String(style.background) === "custom" ? (
            <div>
              <Label htmlFor={`bghex-${section.id}`} className="text-[11px]">
                {t("homepage.backgroundHex")}
              </Label>
              <input
                id={`bghex-${section.id}`}
                type="color"
                className="mt-1 h-8 w-full rounded border border-line"
                value={String(style.backgroundHex ?? "#23416B")}
                onChange={(e) => void setStyle("backgroundHex", e.target.value)}
                disabled={busy}
              />
            </div>
          ) : null}
          {String(style.text) === "custom" ? (
            <div>
              <Label htmlFor={`fghex-${section.id}`} className="text-[11px]">
                {t("homepage.textHex")}
              </Label>
              <input
                id={`fghex-${section.id}`}
                type="color"
                className="mt-1 h-8 w-full rounded border border-line"
                value={String(style.textHex ?? "#0f172a")}
                onChange={(e) => void setStyle("textHex", e.target.value)}
                disabled={busy}
              />
            </div>
          ) : null}
          <TokenSelect id={`font-${section.id}`} label={t("homepage.font")} value={String(style.fontFamily ?? "sans")} options={vocab.styleTokens.fontFamily} onChange={(v) => setStyle("fontFamily", v)} disabled={busy} />
          <TokenSelect id={`hs-${section.id}`} label={t("homepage.headingSize")} value={String(style.headingSize ?? "lg")} options={vocab.styleTokens.headingSize} onChange={(v) => setStyle("headingSize", v)} disabled={busy} />
          <TokenSelect id={`bs-${section.id}`} label={t("homepage.bodySize")} value={String(style.bodySize ?? "md")} options={vocab.styleTokens.bodySize} onChange={(v) => setStyle("bodySize", v)} disabled={busy} />
          <TokenSelect id={`pad-${section.id}`} label={t("homepage.padding")} value={String(style.padding ?? "normal")} options={vocab.styleTokens.padding} onChange={(v) => setStyle("padding", v)} disabled={busy} />
          <TokenSelect id={`al-${section.id}`} label={t("homepage.align")} value={String(style.align ?? "start")} options={vocab.styleTokens.align} onChange={(v) => setStyle("align", v)} disabled={busy} />
          <TokenSelect id={`w-${section.id}`} label={t("homepage.width")} value={String(style.width ?? "container")} options={vocab.styleTokens.width} onChange={(v) => setStyle("width", v)} disabled={busy} />
        </div>
      </section>

      {/* ── Data binding ── */}
      {"limit" in section.config ? (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted">{t("homepage.data")}</h3>
          <Label htmlFor={`limit-${section.id}`} className="text-[11px]">
            {t("homepage.howMany")}
          </Label>
          <Input
            id={`limit-${section.id}`}
            type="number"
            min={1}
            max={24}
            defaultValue={Number(section.config.limit ?? 8)}
            onBlur={(e) => void onPatch({ config: { ...section.config, limit: Number(e.target.value) } })}
            disabled={busy}
          />
        </section>
      ) : null}

      {/* ── Schedule ── */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted">{t("homepage.schedule")}</h3>
        <p className="mb-2 text-[11px] text-muted">{t("homepage.scheduleHint")}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`from-${section.id}`} className="text-[11px]">
              {t("homepage.showFrom")}
            </Label>
            <Input
              id={`from-${section.id}`}
              type="datetime-local"
              defaultValue={section.startsAt ? section.startsAt.slice(0, 16) : ""}
              onBlur={(e) => void onPatch({ startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
              disabled={busy}
            />
          </div>
          <div>
            <Label htmlFor={`to-${section.id}`} className="text-[11px]">
              {t("homepage.hideAfter")}
            </Label>
            <Input
              id={`to-${section.id}`}
              type="datetime-local"
              defaultValue={section.endsAt ? section.endsAt.slice(0, 16) : ""}
              onBlur={(e) => void onPatch({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
              disabled={busy}
            />
          </div>
        </div>
      </section>

      {!isStructural ? (
        <Button variant="outline" onClick={onRemove} disabled={busy} className="w-full text-red-600">
          {t("homepage.removeSection")}
        </Button>
      ) : (
        <p className="text-[11px] text-muted">{t("homepage.structuralNote")}</p>
      )}
    </div>
  );
}

function TextField({
  id,
  name,
  field,
  locale,
  disabled,
  onCommit,
  t,
}: {
  id: string;
  name: string;
  field: LocalizedField;
  locale: Locale;
  disabled: boolean;
  onCommit: (value: string) => void;
  t: (k: string, o?: Record<string, unknown>) => string;
}) {
  const override = field.values?.[locale] ?? "";
  return (
    <div>
      <Label htmlFor={id} className="text-[11px] capitalize">
        {name.replace(/([A-Z])/g, " $1")}
      </Label>
      <Input
        id={id}
        defaultValue={override}
        placeholder={field.key ? t("homepage.fromCatalogue", { key: field.key }) : ""}
        onBlur={(e) => {
          if (e.target.value !== override) onCommit(e.target.value);
        }}
        disabled={disabled}
      />
    </div>
  );
}

function TokenSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-[11px]">
        {label}
      </Label>
      <select
        id={id}
        className="mt-1 w-full rounded-card border border-line px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
