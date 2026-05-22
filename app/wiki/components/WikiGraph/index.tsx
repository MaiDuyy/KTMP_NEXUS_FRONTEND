"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { forceX, forceY } from "d3-force";
import { Plus, Minus, Maximize2, Tag } from "lucide-react";
import { wikiTypeColor, wikiTypeGroupLabel } from "../WikiTypeBadge";
import { NodeInput } from "./types";
import { nodeRadius } from "./utils";

// react-force-graph-2d uses canvas APIs (no SSR).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => null,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForceGraphInstance = any;

type Node = NodeInput & {
  id: string;
  degree: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  __targetX?: number;
};

type Link = {
  source: string | Node;
  target: string | Node;
};

type Props = {
  nodes: NodeInput[];
  edges: { from: string; to: string }[];
  centerSlug?: string;
  mini?: boolean;
  height?: number;
  onNodeClick?: (slug: string) => void;
};

// Dynamic theme colors helper
function getGraphNodeColors(type: string, isDark: boolean): { bg: string; border: string; text: string } {
  const normType = (type || "").toLowerCase();
  
  const colors: Record<string, { lightBg: string; lightBorder: string; darkBg: string; darkBorder: string; text: string }> = {
    entity: {
      lightBg: "#e0f2fe", // sky-100
      lightBorder: "#0284c7", // sky-600
      darkBg: "rgba(3, 105, 161, 0.25)", // sky-900/25
      darkBorder: "#38bdf8", // sky-400
      text: isDark ? "#38bdf8" : "#0369a1",
    },
    concept: {
      lightBg: "#d1fae5", // emerald-100
      lightBorder: "#059669", // emerald-600
      darkBg: "rgba(6, 95, 70, 0.25)", // emerald-900/25
      darkBorder: "#34d399", // emerald-400
      text: isDark ? "#34d399" : "#065f46",
    },
    topic: {
      lightBg: "#fef3c7", // amber-100
      lightBorder: "#d97706", // amber-600
      darkBg: "rgba(146, 64, 14, 0.25)", // amber-900/25
      darkBorder: "#fbbf24", // amber-400
      text: isDark ? "#fbbf24" : "#92400e",
    },
    source: {
      lightBg: "#ffe4e6", // rose-100
      lightBorder: "#e11d48", // rose-600
      darkBg: "rgba(159, 18, 57, 0.25)", // rose-900/25
      darkBorder: "#fb7185", // rose-400
      text: isDark ? "#fb7185" : "#9f1239",
    },
    index: {
      lightBg: "#f1f5f9", // slate-100
      lightBorder: "#475569", // slate-600
      darkBg: "rgba(30, 41, 59, 0.25)", // slate-800/25
      darkBorder: "#94a3b8", // slate-400
      text: isDark ? "#94a3b8" : "#1e293b",
    },
    log: {
      lightBg: "#f1f5f9",
      lightBorder: "#475569",
      darkBg: "rgba(30, 41, 59, 0.25)",
      darkBorder: "#94a3b8",
      text: isDark ? "#94a3b8" : "#1e293b",
    }
  };

  const cfg = colors[normType] ?? colors.concept;
  return {
    bg: isDark ? cfg.darkBg : cfg.lightBg,
    border: isDark ? cfg.darkBorder : cfg.lightBorder,
    text: cfg.text
  };
}

export function WikiGraph({
  nodes: rawNodes,
  edges: rawEdges,
  centerSlug,
  mini = false,
  height,
  onNodeClick,
}: Props) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fgRef = React.useRef<ForceGraphInstance>(null);
  
  // Responsive dark mode tracking
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setIsDarkMode(document.documentElement.classList.contains("dark"));
    const obs = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const EDGE_COLOR = isDarkMode ? "rgba(71, 85, 105, 0.55)" : "rgba(203, 213, 225, 0.85)"; // stroke-slate-700 / stroke-slate-300 mờ
  const EDGE_HIGHLIGHT = isDarkMode ? "#3b82f6" : "#2563eb"; // Project primary blue highlight
  const LABEL_COLOR = isDarkMode ? "#f1f5f9" : "#0f172a"; // slate-100 / slate-900
  const BG_COLOR = isDarkMode ? "#090d16" : "#f8fafc"; // Dark matching theme / Light slate-50
  
  const [fgReady, setFgReady] = React.useState(false);
  const setFgRef = React.useCallback((instance: ForceGraphInstance | null) => {
    fgRef.current = instance;
    setFgReady(!!instance);
  }, []);
  
  const [dimensions, setDimensions] = React.useState({ w: 800, h: height ?? 400 });
  const hoveredIdRef = React.useRef<string | null>(null);
  const [hoverVersion, setHoverVersion] = React.useState(0);
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    title: string;
    type: string;
    degree: number;
  } | null>(null);

  // Measure container dimensions
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height: h } = entries[0].contentRect;
      setDimensions({ w: width, h: height ?? h });
    });
    obs.observe(el);
    setDimensions({ w: el.clientWidth, h: height ?? el.clientHeight });
    return () => obs.disconnect();
  }, [height]);

  const nodeMapRef = React.useRef<Map<string, Node>>(new Map());

  // Graph data preprocessing
  /* eslint-disable react-hooks/refs */
  const { nodes, links, adjacency, components, componentTargetX } = React.useMemo(() => {
    const degreeMap = new Map<string, number>();
    const filteredEdges = rawEdges.filter((e) => e.from !== e.to);
    
    for (const e of filteredEdges) {
      degreeMap.set(e.from, (degreeMap.get(e.from) ?? 0) + 1);
      degreeMap.set(e.to, (degreeMap.get(e.to) ?? 0) + 1);
    }
    
    const seen = new Set<string>();
    const nodes: Node[] = rawNodes.map((n) => {
      const existing = nodeMapRef.current.get(n.slug);
      const degree = degreeMap.get(n.slug) ?? 0;
      seen.add(n.slug);
      
      const fx = n.slug === centerSlug ? 0 : undefined;
      const fy = n.slug === centerSlug ? 0 : undefined;

      if (existing) {
        existing.title = n.title;
        existing.page_type = n.page_type;
        existing.degree = degree;
        existing.fx = fx;
        existing.fy = fy;
        return existing;
      }
      const fresh: Node = { ...n, id: n.slug, degree, fx, fy };
      nodeMapRef.current.set(n.slug, fresh);
      return fresh;
    });

    for (const id of nodeMapRef.current.keys()) {
      if (!seen.has(id)) nodeMapRef.current.delete(id);
    }
    /* eslint-enable react-hooks/refs */
    
    const ids = new Set(nodes.map((n) => n.id));
    const links: Link[] = filteredEdges
      .filter((e) => ids.has(e.from) && ids.has(e.to))
      .map((e) => ({ source: e.from, target: e.to }));

    const adj = new Map<string, Set<string>>();
    for (const n of nodes) adj.set(n.id, new Set());
    for (const l of links) {
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    }

    const compOf = new Map<string, number>();
    let cid = 0;
    for (const n of nodes) {
      if (compOf.has(n.id)) continue;
      const stack = [n.id];
      while (stack.length > 0) {
        const cur = stack.pop()!;
        if (compOf.has(cur)) continue;
        compOf.set(cur, cid);
        for (const nb of adj.get(cur) ?? []) {
          if (!compOf.has(nb)) stack.push(nb);
        }
      }
      cid++;
    }
    return {
      nodes,
      links,
      adjacency: adj,
      components: compOf,
      componentTargetX: cid,
    };
  }, [rawNodes, rawEdges]);

  // Attach D3 forces
  React.useEffect(() => {
    const fg = fgRef.current;
    if (!fg || nodes.length === 0) return;

    const margin = dimensions.w * 0.15;
    const usable = Math.max(dimensions.w - 2 * margin, 1);

    fg.d3Force(
      "x",
      forceX<Node>((d: Node) => {
        const c = components.get(d.id) ?? 0;
        return componentTargetX <= 1
          ? 0
          : -usable / 2 + (usable * c) / (componentTargetX - 1);
      }).strength(0.1)
    );
    fg.d3Force("y", forceY<Node>(0).strength(0.05));

    const charge = fg.d3Force("charge");
    if (charge) {
      charge.strength((d: Node) => (mini ? -60 : -120) * Math.sqrt((d.degree ?? 0) + 1));
    }
    const linkForce = fg.d3Force("link");
    if (linkForce) linkForce.distance(mini ? 35 : 70).strength(0.4);

    fg.d3Force("center", null);

    fg.d3ReheatSimulation();
  }, [fgReady, nodes, components, componentTargetX, centerSlug, dimensions.w, dimensions.h, mini]);

  const hasFitRef = React.useRef(false);
  React.useEffect(() => {
    hasFitRef.current = false;
  }, [rawNodes.length, rawEdges.length]);

  const handleEngineStop = React.useCallback(() => {
    if (hasFitRef.current) return;
    hasFitRef.current = true;
    if (!mini) {
      if (rawNodes.length <= 1) {
        fgRef.current?.centerAt(0, 0, 0);
        fgRef.current?.zoom(2, 400);
      } else {
        fgRef.current?.zoomToFit(400, 60);
      }
    } else {
      fgRef.current?.centerAt(0, 0, 0);
      fgRef.current?.zoom(1.4, 400);
    }
  }, [mini, rawNodes.length]);

  const graphData = React.useMemo(() => ({ nodes, links }), [nodes, links]);

  const neighborIdsRef = React.useRef<Set<string> | null>(null);
  const adjacencyRef = React.useRef(adjacency);
  React.useEffect(() => {
    adjacencyRef.current = adjacency;
  }, [adjacency]);

  // Custom Node rendering
  const drawNode = React.useCallback(
    (rawNode: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = rawNode as Node;
      if (n.x === undefined || n.y === undefined) return;
      const r = nodeRadius(n.degree ?? 0, mini);
      const nodeColors = getGraphNodeColors(n.page_type, isDarkMode);
      const hovered = hoveredIdRef.current;
      const neighborSet = neighborIdsRef.current;
      const isHovered = hovered === n.id;
      const isDimmed = !!hovered && !neighborSet?.has(n.id);
      const isCenter = n.id === centerSlug;

      if (isHovered) {
        ctx.beginPath();
        ctx.fillStyle = nodeColors.border;
        ctx.globalAlpha = isDarkMode ? 0.22 : 0.15;
        ctx.arc(n.x, n.y, r * 1.8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (!isDimmed) {
        ctx.beginPath();
        ctx.fillStyle = BG_COLOR;
        ctx.arc(n.x, n.y, (isHovered ? r * 1.3 : r) + 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.fillStyle = nodeColors.bg;
      ctx.globalAlpha = isDimmed ? 0.15 : 1;
      ctx.arc(n.x, n.y, isHovered ? r * 1.3 : r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Clean theme-integrated borders
      ctx.lineWidth = isCenter ? 2.5 : isHovered ? 2.0 : 1.25;
      ctx.strokeStyle = isCenter
        ? (isDarkMode ? "#ffffff" : "#0f172a")
        : isHovered
          ? (isDarkMode ? "#ffffff" : "#0f172a")
          : nodeColors.border;
      ctx.globalAlpha = isDimmed ? 0.25 : 1.0;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      const labelVisible =
        !mini &&
        !isDimmed &&
        (isHovered || isCenter || globalScale >= 1.2 || (n.degree ?? 0) >= 3);
      if (labelVisible) {
        const fontSize = isHovered ? 12 : 11;
        ctx.font = `${isHovered ? 700 : 500} ${fontSize}px sans-serif`;
        ctx.fillStyle = LABEL_COLOR;
        ctx.globalAlpha = isHovered || isCenter ? 1 : 0.8;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        const text = n.title.length > 20 ? n.title.slice(0, 18) + "…" : n.title;
        ctx.fillText(text, n.x + r + 5, n.y);
        ctx.globalAlpha = 1;
      }
    },
    [mini, centerSlug, hoverVersion]
  );

  const linkColor = React.useCallback(
    (rawLink: object) => {
      const hovered = hoveredIdRef.current;
      const l = rawLink as Link;
      if (!hovered) return EDGE_COLOR;
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;
      const hot = s === hovered || t === hovered;
      return hot ? EDGE_HIGHLIGHT : "rgba(0,0,0,0.03)";
    },
    [hoverVersion]
  );
  
  const linkWidth = React.useCallback(
    (rawLink: object) => {
      const hovered = hoveredIdRef.current;
      const l = rawLink as Link;
      if (!hovered) return 1.2;
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;
      return s === hovered || t === hovered ? 2.5 : 0.8;
    },
    [hoverVersion]
  );

  const handleNodeClick = React.useCallback(
    (rawNode: object) => {
      const n = rawNode as Node;
      if (onNodeClick) onNodeClick(n.id);
      else router.push(`/wiki/${n.id}`);
    },
    [onNodeClick, router]
  );

  const handleNodeHover = React.useCallback((rawNode: object | null) => {
    const n = rawNode as Node | null;
    const newId = n?.id ?? null;
    if (hoveredIdRef.current === newId) return;
    hoveredIdRef.current = newId;
    
    if (!newId) {
      neighborIdsRef.current = null;
    } else {
      const set = new Set<string>([newId]);
      for (const nb of adjacencyRef.current.get(newId) ?? []) set.add(nb);
      neighborIdsRef.current = set;
    }
    
    setHoverVersion((v) => v + 1);
    if (!n) {
      setTooltip(null);
    } else {
      setTooltip((prev) => ({
        ...(prev ?? { x: 0, y: 0 }),
        title: n.title,
        type: n.page_type,
        degree: n.degree ?? 0,
      }));
    }
  }, []);

  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of rawNodes) counts[n.page_type] = (counts[n.page_type] ?? 0) + 1;
    return counts;
  }, [rawNodes]);
  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden border border-border bg-slate-50 dark:bg-[#090d16] ${mini ? "rounded-lg" : "rounded-xl"}`}
      style={{ height: height ?? "100%", background: BG_COLOR }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip((prev) =>
          prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top - 16 } : prev
        );
      }}
    >
      <ForceGraph2D
        ref={setFgRef}
        width={dimensions.w}
        height={dimensions.h}
        graphData={graphData}
        backgroundColor={BG_COLOR}
        nodeId="id"
        nodeRelSize={1}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={(rawNode: object, color: string, ctx: CanvasRenderingContext2D) => {
          const n = rawNode as Node;
          if (n.x === undefined || n.y === undefined) return;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, nodeRadius(n.degree ?? 0, mini) + 4, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkColor={linkColor}
        linkWidth={linkWidth}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={mini ? 50 : 90}
        d3AlphaDecay={0.06}
        d3VelocityDecay={0.55}
        onEngineStop={handleEngineStop}
        enableZoomInteraction={!mini}
        enablePanInteraction={!mini}
        enableNodeDrag={!mini}
        minZoom={0.2}
        maxZoom={5}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none z-50 px-2.5 py-1.5 border border-border bg-card/95 text-foreground rounded-lg shadow-md text-xs font-sans backdrop-blur-sm"
          style={{
            position: "absolute",
            left: Math.min(tooltip.x + 12, dimensions.w - 220),
            top: Math.max(tooltip.y - 8, 8),
            maxWidth: 220,
          }}
        >
          <p className="font-bold text-xs mb-0.5 truncate">{tooltip.title}</p>
          <div className="flex items-center gap-2 text-muted-foreground text-[10.5px]">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-border"
              style={{ background: getGraphNodeColors(tooltip.type, isDarkMode).border }}
            />
            <span className="capitalize font-medium">{wikiTypeGroupLabel(tooltip.type)}</span>
            <span className="ml-auto font-mono">{tooltip.degree} liên kết</span>
          </div>
        </div>
      )}

      {/* Legend */}
      {!mini && (
        <div className="absolute bottom-3 left-3 border border-border bg-card/90 backdrop-blur-sm p-2 rounded-xl shadow-md text-[10.5px] font-sans max-w-[200px] select-none">
          <div className="mb-2 font-mono font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider">CHÚ GIẢI LOẠI</div>
          <div className="flex flex-col gap-1.5">
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const nodeColors = getGraphNodeColors(type, isDarkMode);
                return (
                  <div
                    key={type}
                    className="flex items-center gap-2 px-1 py-0.5"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border"
                      style={{
                        background: nodeColors.bg,
                        borderColor: nodeColors.border,
                      }}
                    />
                    <span className="text-foreground font-bold">{wikiTypeGroupLabel(type)}</span>
                    <span className="text-muted-foreground ml-auto font-mono">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Zoom controls */}
      {!mini && (
        <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1 border border-border bg-card/90 backdrop-blur-sm shadow-md p-1 rounded-lg select-none">
          <button
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 200)}
            className="w-7 h-7 flex items-center justify-center hover:bg-muted border border-transparent hover:border-border rounded-md transition-all text-foreground cursor-pointer"
            title="Phóng to"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 200)}
            className="w-7 h-7 flex items-center justify-center hover:bg-muted border border-transparent hover:border-border rounded-md transition-all text-foreground cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-5 border-t border-border my-0.5" />
          <button
            onClick={() => fgRef.current?.zoomToFit(400, 60)}
            className="w-7 h-7 flex items-center justify-center hover:bg-muted border border-transparent hover:border-border rounded-md transition-all text-foreground cursor-pointer"
            title="Vừa màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
