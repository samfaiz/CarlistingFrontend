/**
 * /admin/studio — G4-01/02 Design Studio (FR-ST1/ST3/ST4).
 *
 * Canvas MVP: artboard presets, layer list with reorder/visibility, text +
 * shapes + uploaded/AI imagery, transforms with snapping, undo/redo, zoom,
 * versioned scenes, brand kit colours, and both exports — client PNG (quick)
 * and server render (print-quality, registers into the asset library).
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import { StudioCanvas, type CanvasHandle } from "@/components/admin/studio-canvas";
import {
  studioAiModels,
  studioGenerateImage,
  studioGenerateLayout,
  studioPresets,
  studioRegisterAsset,
  studioRenderScene,
  studioSaveScene,
  studioScene,
  studioScenes,
  type FalModelRow,
  type StudioLayer,
  type StudioPreset,
  type StudioScene,
} from "@/components/admin/api";
import { apiGet, apiPost } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

// NOT next/dynamic: it does not forward refs, so the imperative canvas handle
// (addLayer/undo/export) never reached the page. Konva only touches the DOM
// inside effects, so a mount guard is all the client-only isolation needed.

const BRAND_COLORS = ["#23416B", "#7F9BC2", "#E8B84B", "#FFFFFF", "#111827", "#16A34A", "#DC2626"];
const uid = () => `l-${Math.random().toString(36).slice(2, 10)}`;

export default function StudioPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";
  const canvasRef = React.useRef<CanvasHandle>(null);

  const [presets, setPresets] = React.useState<StudioPreset[]>([]);
  const [presetKey, setPresetKey] = React.useState("meta_feed_1080");
  const [scenes, setScenes] = React.useState<StudioScene[]>([]);
  const [models, setModels] = React.useState<FalModelRow[]>([]);
  const [layers, setLayers] = React.useState<StudioLayer[]>([]);
  const [selected, setSelected] = React.useState<StudioLayer | null>(null);
  const [sceneName, setSceneName] = React.useState("Untitled ad");
  const [versionGroupId, setVersionGroupId] = React.useState<string | undefined>();
  const [sceneId, setSceneId] = React.useState<string | undefined>();
  const [version, setVersion] = React.useState<number>(0);
  const [brief, setBrief] = React.useState("");
  const [imagePrompt, setImagePrompt] = React.useState("");
  const [modelKey, setModelKey] = React.useState("flux-2-dev");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const preset = presets.find((p) => p.key === presetKey) ?? { key: presetKey, label: presetKey, width: 1080, height: 1080 };

  React.useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const [p, s, m] = await Promise.all([studioPresets(token), studioScenes(token), studioAiModels(token)]);
        setPresets(p);
        setScenes(s);
        setModels(m);
      } catch {
        toast({ title: t("studio.loadFailed", { defaultValue: "Could not load the studio" }), variant: "error" });
      }
    })();
  }, [token, t]);

  const resolveImage = React.useCallback(
    async (s3Key: string) => {
      const res = await apiGet<{ url: string }>(`/studio/signed-url?key=${encodeURIComponent(s3Key)}`, { token });
      return res.url;
    },
    [token],
  );

  const add = (layer: StudioLayer) => canvasRef.current?.addLayer(layer);

  const addText = () =>
    add({
      id: uid(), type: "text", name: t("studio.textLayer", { defaultValue: "Text" }),
      x: Math.round(preset.width * 0.1), y: Math.round(preset.height * 0.4),
      width: Math.round(preset.width * 0.8), text: t("studio.sampleText", { defaultValue: "Your headline here" }),
      fontSize: Math.max(24, Math.round(preset.width / 16)), fontFamily: "Inter", fontStyle: "bold", fill: "#111827",
    });

  const addRect = () =>
    add({
      id: uid(), type: "rect", name: t("studio.shapeLayer", { defaultValue: "Rectangle" }),
      x: Math.round(preset.width * 0.15), y: Math.round(preset.height * 0.15),
      width: Math.round(preset.width * 0.4), height: Math.round(preset.height * 0.2),
      fill: "#23416B", cornerRadius: 12,
    });

  const addCircle = () =>
    add({
      id: uid(), type: "circle", name: t("studio.circleLayer", { defaultValue: "Circle" }),
      x: Math.round(preset.width * 0.5), y: Math.round(preset.height * 0.5), radius: Math.round(preset.width * 0.12), fill: "#E8B84B",
    });

  const upload = async (file: File) => {
    setBusy("upload");
    try {
      const pre = await apiPost<{ uploadUrl: string; key: string }>("/media/presign", { contentType: file.type }, { token });
      await fetch(pre.uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
      await studioRegisterAsset({ name: file.name, s3Key: pre.key, mimeType: file.type, sizeBytes: file.size, tags: ["upload"] }, token);
      add({
        id: uid(), type: "image", name: file.name, s3Key: pre.key,
        x: Math.round(preset.width * 0.1), y: Math.round(preset.height * 0.1),
        width: Math.round(preset.width * 0.5), height: Math.round(preset.height * 0.35),
      });
      toast({ title: t("studio.uploaded", { defaultValue: "Image added and saved to the library" }) });
    } catch {
      toast({ title: t("studio.uploadFailed", { defaultValue: "Upload failed" }), variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setBusy("image");
    try {
      const res = await studioGenerateImage(
        { modelKey, prompt: imagePrompt, width: preset.width, height: Math.round(preset.height * 0.6) },
        token,
      );
      add({
        id: uid(), type: "image", name: t("studio.aiImage", { defaultValue: "AI image" }), s3Key: res.s3Key,
        x: 0, y: 0, width: preset.width, height: Math.round(preset.height * 0.6),
      });
      toast({
        title:
          res.provider === "fal"
            ? t("studio.imageGenerated", { defaultValue: "Image generated" })
            : t("studio.imagePlaceholder", { defaultValue: "Placeholder added (no fal.ai key in the vault yet)" }),
      });
    } catch (error) {
      toast({ title: (error as Error).message, variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const generateLayout = async () => {
    if (!brief.trim()) return;
    setBusy("layout");
    try {
      const res = await studioGenerateLayout({ brief, presetKey, locale: "en" }, token);
      setSceneId(res.scene.id);
      setVersionGroupId(res.scene.versionGroupId);
      setVersion(res.scene.version);
      setSceneName(res.scene.name);
      setLayers(res.scene.scene.layers);
      setScenes(await studioScenes(token));
      toast({ title: t("studio.layoutReady", { defaultValue: "Editable ad generated — every element is a layer" }) });
    } catch (error) {
      toast({ title: (error as Error).message, variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy("save");
    try {
      const current = canvasRef.current?.getLayers() ?? layers;
      const saved = await studioSaveScene(
        { name: sceneName, presetKey, scene: { layers: current }, versionGroupId },
        token,
      );
      setSceneId(saved.id);
      setVersionGroupId(saved.versionGroupId);
      setVersion(saved.version);
      setScenes(await studioScenes(token));
      toast({ title: t("studio.saved", { defaultValue: "Saved as version {{v}}", v: saved.version }) });
    } catch {
      toast({ title: t("studio.saveFailed", { defaultValue: "Save failed" }), variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const serverRender = async (format: "png" | "svg", scale: number) => {
    if (!sceneId) {
      toast({ title: t("studio.saveFirst", { defaultValue: "Save the scene first" }), variant: "error" });
      return;
    }
    setBusy("render");
    try {
      const res = await studioRenderScene(sceneId, { format, scale }, token);
      const url = await resolveImage(res.s3Key);
      window.open(url, "_blank", "noopener");
      toast({ title: t("studio.rendered", { defaultValue: "Rendered {{w}}×{{h}} and added to the library", w: res.width, h: res.height }) });
    } catch (error) {
      toast({ title: (error as Error).message, variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const exportPng = () => {
    const dataUrl = canvasRef.current?.exportDataUrl("image/png");
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${sceneName.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  const loadScene = async (id: string) => {
    setBusy("load");
    try {
      const s = await studioScene(id, token);
      setSceneId(s.id);
      setVersionGroupId(s.versionGroupId);
      setVersion(s.version);
      setSceneName(s.name);
      setPresetKey(s.presetKey);
      setLayers(s.scene.layers ?? []);
    } finally {
      setBusy(null);
    }
  };

  const patchSelected = (patch: Partial<StudioLayer>) => {
    if (!selected) return;
    const next = (canvasRef.current?.getLayers() ?? layers).map((l) => (l.id === selected.id ? { ...l, ...patch } : l));
    setLayers(next);
    setSelected({ ...selected, ...patch });
  };

  return (
    <AdminLayout title={t("studio.title", { defaultValue: "Design Studio" })}>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr_280px]">
        {/* ── Left: scenes + layers ── */}
        <div className="space-y-4">
          <Card className="p-3">
            <h3 className="mb-2 text-sm font-semibold text-ink">{t("studio.artboard", { defaultValue: "Artboard" })}</h3>
            <select
              className="w-full rounded-card border border-line bg-page px-2 py-1.5 text-sm"
              value={presetKey}
              onChange={(e) => setPresetKey(e.target.value)}
            >
              {presets.map((p) => (
                <option key={p.key} value={p.key}>{p.label} — {p.width}×{p.height}</option>
              ))}
            </select>
          </Card>

          <Card className="p-3">
            <h3 className="mb-2 text-sm font-semibold text-ink">{t("studio.layers", { defaultValue: "Layers" })}</h3>
            <ul className="space-y-1 text-sm" data-testid="layer-list">
              {[...layers].reverse().map((l) => (
                <li
                  key={l.id}
                  className={`flex items-center justify-between rounded px-2 py-1 ${selected?.id === l.id ? "bg-brand/10 text-brand" : "text-muted"}`}
                >
                  <span className="truncate">{l.name ?? l.type}</span>
                  <Badge variant="neutral">{l.type}</Badge>
                </li>
              ))}
              {layers.length === 0 && (
                <li className="px-2 py-1 text-muted">{t("studio.noLayers", { defaultValue: "No layers yet" })}</li>
              )}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1">
              <Button size="sm" variant="outline" onClick={() => canvasRef.current?.moveSelected("front")}>{t("studio.front", { defaultValue: "Front" })}</Button>
              <Button size="sm" variant="outline" onClick={() => canvasRef.current?.moveSelected("back")}>{t("studio.back", { defaultValue: "Back" })}</Button>
              <Button size="sm" variant="outline" onClick={() => canvasRef.current?.duplicateSelected()}>{t("studio.duplicate", { defaultValue: "Duplicate" })}</Button>
              <Button size="sm" variant="outline" onClick={() => canvasRef.current?.deleteSelected()}>{t("studio.delete", { defaultValue: "Delete" })}</Button>
            </div>
          </Card>

          <Card className="p-3">
            <h3 className="mb-2 text-sm font-semibold text-ink">{t("studio.scenes", { defaultValue: "Saved scenes" })}</h3>
            <ul className="max-h-56 space-y-1 overflow-auto text-sm">
              {scenes.map((s) => (
                <li key={s.id}>
                  <button className="w-full truncate rounded px-2 py-1 text-start text-muted hover:bg-line/40" onClick={() => void loadScene(s.id)}>
                    {s.name} <span className="text-xs">v{s.version}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* ── Centre: toolbar + canvas ── */}
        <div className="space-y-3">
          <Card className="flex flex-wrap items-center gap-2 p-3">
            <Input className="w-52" value={sceneName} onChange={(e) => setSceneName(e.target.value)} aria-label={t("studio.sceneName", { defaultValue: "Scene name" })} />
            <Button size="sm" onClick={addText}>{t("studio.addText", { defaultValue: "+ Text" })}</Button>
            <Button size="sm" onClick={addRect}>{t("studio.addRect", { defaultValue: "+ Rect" })}</Button>
            <Button size="sm" onClick={addCircle}>{t("studio.addCircle", { defaultValue: "+ Circle" })}</Button>
            <label className="cursor-pointer rounded-card border border-line px-3 py-1.5 text-sm">
              {t("studio.upload", { defaultValue: "Upload" })}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
            </label>
            <span className="mx-1 h-5 w-px bg-line" />
            <Button size="sm" variant="outline" onClick={() => canvasRef.current?.undo()}>{t("studio.undo", { defaultValue: "Undo" })}</Button>
            <Button size="sm" variant="outline" onClick={() => canvasRef.current?.redo()}>{t("studio.redo", { defaultValue: "Redo" })}</Button>
            <Button size="sm" variant="outline" onClick={() => canvasRef.current?.zoom(1.2)}>+</Button>
            <Button size="sm" variant="outline" onClick={() => canvasRef.current?.zoom(0.8)}>−</Button>
            <Button size="sm" variant="outline" onClick={() => canvasRef.current?.zoom("fit")}>{t("studio.fit", { defaultValue: "Fit" })}</Button>
            <span className="mx-1 h-5 w-px bg-line" />
            <Button size="sm" onClick={() => void save()} disabled={busy === "save"} data-testid="save-scene">
              {t("studio.save", { defaultValue: "Save" })}{version ? ` (v${version})` : ""}
            </Button>
            <Button size="sm" variant="outline" onClick={exportPng}>{t("studio.exportPng", { defaultValue: "Export PNG" })}</Button>
            <Button size="sm" variant="outline" onClick={() => void serverRender("png", 2)} disabled={busy === "render"}>
              {t("studio.serverRender", { defaultValue: "Server render ×2" })}
            </Button>
            <Button size="sm" variant="outline" onClick={() => void serverRender("svg", 1)} disabled={busy === "render"}>
              {t("studio.serverSvg", { defaultValue: "SVG (vector)" })}
            </Button>
          </Card>

          <div className="overflow-auto rounded-card border border-line bg-line/20 p-4">
            {mounted ? (
            <StudioCanvas
              ref={canvasRef}
              width={preset.width}
              height={preset.height}
              layers={layers}
              resolveImage={resolveImage}
              onSelect={setSelected}
              onChange={setLayers}
            />
            ) : (
              <div className="h-[420px] w-[420px] animate-pulse rounded-card bg-line/40" />
            )}
          </div>
        </div>

        {/* ── Right: AI + inspector ── */}
        <div className="space-y-4">
          <Card className="space-y-2 p-3">
            <h3 className="text-sm font-semibold text-ink">{t("studio.aiLayout", { defaultValue: "AI ad layout" })}</h3>
            <Textarea rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={t("studio.briefPlaceholder", { defaultValue: "Brief: what should this ad sell?" })} />
            <Button size="sm" className="w-full" onClick={() => void generateLayout()} disabled={busy === "layout"} data-testid="generate-layout">
              {busy === "layout" ? t("studio.generating", { defaultValue: "Generating…" }) : t("studio.generateLayout", { defaultValue: "Generate editable ad" })}
            </Button>
          </Card>

          <Card className="space-y-2 p-3">
            <h3 className="text-sm font-semibold text-ink">{t("studio.aiImage", { defaultValue: "AI image" })}</h3>
            <select className="w-full rounded-card border border-line bg-page px-2 py-1.5 text-sm" value={modelKey} onChange={(e) => setModelKey(e.target.value)}>
              {models.map((m) => (
                <option key={m.key} value={m.key}>{m.label} — ${m.costUsd}</option>
              ))}
            </select>
            <Textarea rows={2} value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder={t("studio.imagePromptPlaceholder", { defaultValue: "Describe the hero visual…" })} />
            <Button size="sm" className="w-full" onClick={() => void generateImage()} disabled={busy === "image"}>
              {busy === "image" ? t("studio.generating", { defaultValue: "Generating…" }) : t("studio.generateImage", { defaultValue: "Generate image layer" })}
            </Button>
          </Card>

          <Card className="space-y-2 p-3">
            <h3 className="text-sm font-semibold text-ink">{t("studio.inspector", { defaultValue: "Inspector" })}</h3>
            {!selected && <p className="text-sm text-muted">{t("studio.selectLayer", { defaultValue: "Select a layer on the canvas" })}</p>}
            {selected && (
              <div className="space-y-2">
                {selected.type === "text" && (
                  <>
                    <Label>{t("studio.text", { defaultValue: "Text" })}</Label>
                    <Textarea rows={2} value={selected.text ?? ""} onChange={(e) => patchSelected({ text: e.target.value })} />
                    <Label>{t("studio.fontSize", { defaultValue: "Font size" })}</Label>
                    <Input type="number" value={selected.fontSize ?? 24} onChange={(e) => patchSelected({ fontSize: Number(e.target.value) })} />
                  </>
                )}
                <Label>{t("studio.color", { defaultValue: "Colour" })}</Label>
                <div className="flex flex-wrap gap-1">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c}
                      aria-label={c}
                      className="h-6 w-6 rounded border border-line"
                      style={{ background: c }}
                      onClick={() => patchSelected({ fill: c })}
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return { props: { ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
