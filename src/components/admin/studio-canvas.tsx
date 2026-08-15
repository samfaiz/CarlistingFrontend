/**
 * G4-01 canvas editor (FR-ST1) on vanilla Konva.
 *
 * Vanilla rather than react-konva deliberately: react-konva@19.2 demands
 * react ^19.2 while Next 15.5 pins 19.1, and the imperative Transformer /
 * snapping / undo-redo model is cleaner without the reconciler in between.
 * The layer model is the SAME shape the backend renders server-side
 * (RenderService), so what you see is what prints.
 */
import Konva from "konva";
import * as React from "react";
import type { StudioLayer } from "./api";

export interface CanvasHandle {
  addLayer: (layer: StudioLayer) => void;
  getLayers: () => StudioLayer[];
  setLayers: (layers: StudioLayer[]) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  moveSelected: (direction: "front" | "back") => void;
  undo: () => void;
  redo: () => void;
  zoom: (factor: number | "fit") => void;
  exportDataUrl: (mime?: string) => string | null;
}

interface Props {
  width: number;
  height: number;
  layers: StudioLayer[];
  /** Signed URL resolver for image layers (s3Key → https URL). */
  resolveImage: (s3Key: string) => Promise<string>;
  onSelect?: (layer: StudioLayer | null) => void;
  onChange?: (layers: StudioLayer[]) => void;
}

const SNAP = 8;

export const StudioCanvas = React.forwardRef<CanvasHandle, Props>(function StudioCanvas(
  { width, height, layers, resolveImage, onSelect, onChange },
  ref,
) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const stageRef = React.useRef<Konva.Stage | null>(null);
  const layerRef = React.useRef<Konva.Layer | null>(null);
  const guideRef = React.useRef<Konva.Layer | null>(null);
  const uiRef = React.useRef<Konva.Layer | null>(null);
  const trRef = React.useRef<Konva.Transformer | null>(null);
  const historyRef = React.useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });
  const modelRef = React.useRef<StudioLayer[]>(layers);
  const changeRef = React.useRef(onChange);
  const selectRef = React.useRef(onSelect);
  changeRef.current = onChange;
  selectRef.current = onSelect;

  /** Reads the live Konva nodes back into the portable layer model. */
  const readModel = React.useCallback((): StudioLayer[] => {
    const layer = layerRef.current;
    if (!layer) return [];
    return layer
      .getChildren((n) => n.getClassName() !== "Transformer")
      .map((node) => {
        const attrs = node.attrs as Record<string, unknown>;
        const base: StudioLayer = {
          id: String(attrs.id ?? node._id),
          type: attrs.layerType as StudioLayer["type"],
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          rotation: Math.round(node.rotation()),
          opacity: node.opacity(),
          name: attrs.layerName as string | undefined,
          role: attrs.role as string | undefined,
          visible: node.visible(),
        };
        if (node instanceof Konva.Text) {
          return {
            ...base,
            text: node.text(),
            width: Math.round(node.width() * node.scaleX()),
            fontSize: Math.round(node.fontSize()),
            fontFamily: node.fontFamily(),
            fontStyle: node.fontStyle(),
            align: node.align(),
            fill: String(node.fill()),
          };
        }
        if (node instanceof Konva.Circle) {
          return { ...base, radius: Math.round(node.radius() * node.scaleX()), fill: String(node.fill()) };
        }
        if (node instanceof Konva.Image) {
          return {
            ...base,
            width: Math.round(node.width() * node.scaleX()),
            height: Math.round(node.height() * node.scaleY()),
            s3Key: attrs.s3Key as string,
          };
        }
        const rect = node as Konva.Rect;
        return {
          ...base,
          width: Math.round(rect.width() * rect.scaleX()),
          height: Math.round(rect.height() * rect.scaleY()),
          fill: String(rect.fill()),
          cornerRadius: typeof rect.cornerRadius() === "number" ? (rect.cornerRadius() as number) : undefined,
          stroke: rect.stroke() ? String(rect.stroke()) : undefined,
          strokeWidth: rect.strokeWidth(),
        };
      });
  }, []);

  /**
   * The model the parent last received FROM us. The paint effect compares
   * against it: a model we just emitted needs no repaint (the Konva nodes
   * already say exactly that), while a model the parent hands us — a loaded
   * scene, an AI layout, a new layer — does.
   */
  const emittedRef = React.useRef<StudioLayer[] | null>(null);

  const emit = React.useCallback((model: StudioLayer[], opts: { repaint: boolean; pushHistory?: boolean }) => {
    if (opts.pushHistory !== false) {
      historyRef.current.past.push(JSON.stringify(modelRef.current));
      if (historyRef.current.past.length > 50) historyRef.current.past.shift();
      historyRef.current.future = [];
    }
    modelRef.current = model;
    if (!opts.repaint) emittedRef.current = model;
    changeRef.current?.(model);
  }, []);

  /** Konva nodes already hold the truth (drag / transform / delete) — no repaint. */
  const commit = React.useCallback(
    (pushHistory = true) => emit(readModel(), { repaint: false, pushHistory }),
    [emit, readModel],
  );

  /** Builds a Konva node from one portable layer. */
  const buildNode = React.useCallback(
    async (spec: StudioLayer): Promise<Konva.Shape | null> => {
      const common = {
        id: spec.id,
        x: spec.x,
        y: spec.y,
        rotation: spec.rotation ?? 0,
        opacity: spec.opacity ?? 1,
        draggable: true,
        visible: spec.visible !== false,
        layerType: spec.type,
        layerName: spec.name,
        role: spec.role,
      };
      if (spec.type === "text") {
        return new Konva.Text({
          ...common,
          text: spec.text ?? "Text",
          width: spec.width,
          fontSize: spec.fontSize ?? 24,
          fontFamily: spec.fontFamily ?? "Inter",
          fontStyle: spec.fontStyle ?? "normal",
          align: spec.align ?? "left",
          fill: spec.fill ?? "#111827",
        });
      }
      if (spec.type === "circle") {
        return new Konva.Circle({ ...common, radius: spec.radius ?? 60, fill: spec.fill ?? "#23416B" });
      }
      if (spec.type === "image" && spec.s3Key) {
        try {
          const url = await resolveImage(spec.s3Key);
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new window.Image();
            el.crossOrigin = "anonymous";
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = url;
          });
          return new Konva.Image({
            ...common,
            image: img,
            width: spec.width ?? img.width,
            height: spec.height ?? img.height,
            s3Key: spec.s3Key,
          });
        } catch {
          return new Konva.Rect({
            ...common,
            width: spec.width ?? 200,
            height: spec.height ?? 150,
            fill: "#E5E7EB",
            stroke: "#9CA3AF",
            strokeWidth: 1,
            s3Key: spec.s3Key,
          });
        }
      }
      return new Konva.Rect({
        ...common,
        width: spec.width ?? 200,
        height: spec.height ?? 120,
        fill: spec.fill ?? "#23416B",
        cornerRadius: spec.cornerRadius ?? 0,
        stroke: spec.stroke,
        strokeWidth: spec.strokeWidth ?? 0,
      });
    },
    [resolveImage],
  );

  /** Snapping guides against artboard edges + centres. */
  const showGuides = React.useCallback(
    (node: Konva.Node) => {
      const guides = guideRef.current;
      if (!guides) return;
      guides.destroyChildren();
      const box = node.getClientRect({ relativeTo: node.getStage() ?? undefined });
      const targets = [
        { v: 0, axis: "x" as const }, { v: width / 2, axis: "x" as const }, { v: width, axis: "x" as const },
        { v: 0, axis: "y" as const }, { v: height / 2, axis: "y" as const }, { v: height, axis: "y" as const },
      ];
      for (const target of targets) {
        const edges = target.axis === "x" ? [box.x, box.x + box.width / 2, box.x + box.width] : [box.y, box.y + box.height / 2, box.y + box.height];
        for (const [i, edge] of edges.entries()) {
          if (Math.abs(edge - target.v) > SNAP) continue;
          const delta = target.v - edge;
          if (target.axis === "x") node.x(node.x() + delta);
          else node.y(node.y() + delta);
          guides.add(
            new Konva.Line({
              points: target.axis === "x" ? [target.v, 0, target.v, height] : [0, target.v, width, target.v],
              stroke: "#E8B84B",
              strokeWidth: 1,
              dash: [4, 4],
              listening: false,
            }),
          );
          void i;
          break;
        }
      }
      guides.batchDraw();
    },
    [width, height],
  );

  /** Rebuilds the whole stage from a layer model. */
  const paint = React.useCallback(
    async (model: StudioLayer[]) => {
      const layer = layerRef.current;
      const tr = trRef.current;
      if (!layer || !tr) return;
      // The nodes the transformer points at are about to be destroyed; detach
      // first so it never holds a destroyed reference.
      tr.nodes([]);
      layer.destroyChildren();
      for (const spec of model) {
        const node = await buildNode(spec);
        if (!node) continue;
        node.on("dragmove", () => showGuides(node));
        node.on("dragend transformend", () => {
          guideRef.current?.destroyChildren();
          guideRef.current?.batchDraw();
          commit();
        });
        node.on("click tap", () => {
          tr.nodes([node]);
          layer.batchDraw();
          selectRef.current?.(modelRef.current.find((l) => l.id === node.id()) ?? null);
        });
        layer.add(node);
      }
      layer.batchDraw();
      uiRef.current?.batchDraw();
    },
    [buildNode, commit, showGuides],
  );

  // Mount the stage once.
  React.useEffect(() => {
    if (!containerRef.current) return;
    const stage = new Konva.Stage({ container: containerRef.current, width, height });
    const main = new Konva.Layer();
    const guides = new Konva.Layer({ listening: false });
    // The transformer lives on its OWN layer: paint() destroys the content
    // layer's children wholesale, and a transformer caught in that sweep is
    // destroyed while refs still point at it (found by the G4 E2E — every
    // click after the first silently hit the Next dev error overlay).
    const ui = new Konva.Layer();
    const tr = new Konva.Transformer({ rotateEnabled: true, borderStroke: "#23416B", anchorStroke: "#23416B" });
    ui.add(tr);
    stage.add(main);
    stage.add(guides);
    stage.add(ui);
    stageRef.current = stage;
    layerRef.current = main;
    guideRef.current = guides;
    uiRef.current = ui;
    trRef.current = tr;

    stage.on("click tap", (e) => {
      if (e.target === stage) {
        tr.nodes([]);
        main.batchDraw();
        selectRef.current?.(null);
      }
    });

    void paint(modelRef.current);
    return () => {
      stage.destroy();
      stageRef.current = null;
    };
    // Stage is created once; size changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Artboard resize (preset change).
  React.useEffect(() => {
    stageRef.current?.size({ width, height });
    stageRef.current?.batchDraw();
  }, [width, height]);

  // External model replacement (loaded scene, AI layout, a newly added layer).
  // Skipped for models we just emitted ourselves: repainting mid-interaction
  // destroys and rebuilds every node, which raced with additions and dropped
  // them (found by the G4 E2E — only the first added layer survived).
  React.useEffect(() => {
    if (emittedRef.current === layers) return;
    modelRef.current = layers;
    void paint(layers);
  }, [layers, paint]);

  React.useImperativeHandle(
    ref,
    (): CanvasHandle => ({
      // Model-first: append to the layer model and let the paint effect render
      // it. Touching Konva directly here raced with an in-flight repaint.
      addLayer: (spec) => emit([...readModel(), spec], { repaint: true }),
      getLayers: () => readModel(),
      setLayers: (next) => {
        modelRef.current = next;
        void paint(next);
      },
      deleteSelected: () => {
        const tr = trRef.current;
        if (!tr || tr.nodes().length === 0) return;
        tr.nodes().forEach((n) => n.destroy());
        tr.nodes([]);
        layerRef.current?.batchDraw();
        commit();
        selectRef.current?.(null);
      },
      duplicateSelected: () => {
        const tr = trRef.current;
        const layer = layerRef.current;
        if (!tr || !layer || tr.nodes().length === 0) return;
        const clones = tr.nodes().map((n) => {
          const clone = n.clone({ x: n.x() + 24, y: n.y() + 24, id: `${n.id()}-copy-${Date.now()}` });
          layer.add(clone);
          return clone;
        });
        tr.nodes(clones);
        layer.batchDraw();
        uiRef.current?.batchDraw();
        commit();
      },
      moveSelected: (direction) => {
        const tr = trRef.current;
        if (!tr) return;
        tr.nodes().forEach((n) => (direction === "front" ? n.moveToTop() : n.moveToBottom()));
        layerRef.current?.batchDraw();
        commit();
      },
      undo: () => {
        const history = historyRef.current;
        const prev = history.past.pop();
        if (!prev) return;
        history.future.push(JSON.stringify(modelRef.current));
        const model = JSON.parse(prev) as StudioLayer[];
        modelRef.current = model;
        // We paint here, so mark it emitted: the effect must not paint twice.
        emittedRef.current = model;
        void paint(model);
        changeRef.current?.(model);
      },
      redo: () => {
        const history = historyRef.current;
        const next = history.future.pop();
        if (!next) return;
        history.past.push(JSON.stringify(modelRef.current));
        const model = JSON.parse(next) as StudioLayer[];
        modelRef.current = model;
        // We paint here, so mark it emitted: the effect must not paint twice.
        emittedRef.current = model;
        void paint(model);
        changeRef.current?.(model);
      },
      zoom: (factor) => {
        const stage = stageRef.current;
        if (!stage) return;
        if (factor === "fit") {
          const box = containerRef.current?.parentElement?.getBoundingClientRect();
          const scale = box ? Math.min(1, (box.width - 32) / width) : 1;
          stage.scale({ x: scale, y: scale });
          stage.size({ width: width * scale, height: height * scale });
        } else {
          const scale = Math.min(3, Math.max(0.1, (stage.scaleX() || 1) * factor));
          stage.scale({ x: scale, y: scale });
          stage.size({ width: width * scale, height: height * scale });
        }
        stage.batchDraw();
      },
      exportDataUrl: (mime = "image/png") => {
        const stage = stageRef.current;
        if (!stage) return null;
        trRef.current?.nodes([]);
        layerRef.current?.batchDraw();
        return stage.toDataURL({ mimeType: mime, pixelRatio: 1 / (stage.scaleX() || 1) });
      },
    }),
    [buildNode, commit, height, paint, readModel, showGuides, width],
  );

  return (
    <div className="inline-block bg-white shadow-card" data-testid="studio-stage">
      <div ref={containerRef} />
    </div>
  );
});
