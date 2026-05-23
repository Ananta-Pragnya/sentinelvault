"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Alert } from "@/app/dashboard/page";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Node {
  id: string;
  label: string;
  severity: string;
  score: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: string;
  target: string;
  probability: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  critical: "#ff4444",
  high: "#ff8c42",
  medium: "#e6c340",
  low: "#00e676",
};

const NODE_R = 7;
const W = 600;
const H = 380;

// ── Physics ────────────────────────────────────────────────────────────────────

function tick(nodes: Node[], edges: Edge[]): Node[] {
  const next = nodes.map((n) => ({ ...n }));

  // Repulsion between nodes
  for (let i = 0; i < next.length; i++) {
    for (let j = i + 1; j < next.length; j++) {
      const dx = next[j].x - next[i].x;
      const dy = next[j].y - next[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      if (dist < 80) {
        const force = (80 - dist) / dist * 0.4;
        next[i].vx -= dx * force;
        next[i].vy -= dy * force;
        next[j].vx += dx * force;
        next[j].vy += dy * force;
      }
    }
  }

  // Spring attraction along edges
  for (const edge of edges) {
    const a = next.find((n) => n.id === edge.source);
    const b = next.find((n) => n.id === edge.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const target = 120;
    const force = (dist - target) / dist * 0.05 * edge.probability;
    a.vx += dx * force;
    a.vy += dy * force;
    b.vx -= dx * force;
    b.vy -= dy * force;
  }

  // Gravity toward centre
  for (const n of next) {
    n.vx += (W / 2 - n.x) * 0.003;
    n.vy += (H / 2 - n.y) * 0.003;
  }

  // Apply velocity with damping + boundary clamp
  for (const n of next) {
    n.vx *= 0.85;
    n.vy *= 0.85;
    n.x = Math.max(NODE_R + 4, Math.min(W - NODE_R - 4, n.x + n.vx));
    n.y = Math.max(NODE_R + 4, Math.min(H - NODE_R - 4, n.y + n.vy));
  }

  return next;
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  alerts: Alert[];
  onClose: () => void;
}

export default function CausalChainGraph({ alerts, onClose }: Props) {
  const rafRef   = useRef<number | null>(null);
  const [nodes,   setNodes]   = useState<Node[]>([]);
  const [edges,   setEdges]   = useState<Edge[]>([]);
  const [hovered, setHovered] = useState<Node | null>(null);
  const [paused,  setPaused]  = useState(false);

  // Build graph from alert causal_chain data
  useEffect(() => {
    if (alerts.length === 0) return;

    // Index alert by event_id for edge resolution
    const byEventId = new Map<string, Alert>();
    for (const a of alerts) {
      if (a.event_id) byEventId.set(a.event_id, a);
    }

    // Seed positions in a circle
    const total = Math.min(alerts.length, 30);
    const subset = alerts.slice(0, total);
    const angle  = (2 * Math.PI) / total;

    const initNodes: Node[] = subset.map((a, i) => ({
      id:       a.id,
      label:    a.title.slice(0, 30),
      severity: a.severity,
      score:    a.score,
      x: W / 2 + (W * 0.35) * Math.cos(i * angle - Math.PI / 2),
      y: H / 2 + (H * 0.35) * Math.sin(i * angle - Math.PI / 2),
      vx: 0,
      vy: 0,
    }));

    // Build edges from causal_chain
    const initEdges: Edge[] = [];
    for (const a of subset) {
      if (!a.causal_chain) continue;
      for (const link of a.causal_chain) {
        const target = byEventId.get(link.event_id);
        if (target && subset.some((n) => n.id === target.id)) {
          initEdges.push({
            source:      a.id,
            target:      target.id,
            probability: link.probability,
          });
        }
      }
    }

    // Fallback: connect by shared asset_tags if no causal_chain data
    if (initEdges.length === 0) {
      for (let i = 0; i < subset.length; i++) {
        for (let j = i + 1; j < subset.length; j++) {
          const shared = subset[i].asset_tags.filter((t) =>
            subset[j].asset_tags.includes(t)
          );
          if (shared.length > 0) {
            initEdges.push({
              source:      subset[i].id,
              target:      subset[j].id,
              probability: Math.min(0.9, 0.3 + shared.length * 0.2),
            });
          }
        }
      }
    }

    setNodes(initNodes);
    setEdges(initEdges);
  }, [alerts]);

  // Animation loop
  const nodesRef = useRef<Node[]>([]);
  nodesRef.current = nodes;
  const edgesRef = useRef<Edge[]>([]);
  edgesRef.current = edges;
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const animate = useCallback(() => {
    if (!pausedRef.current) {
      setNodes((prev) => tick(prev, edgesRef.current));
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [nodes.length, animate]);

  const hoveredEdges = hovered
    ? edges.filter((e) => e.source === hovered.id || e.target === hovered.id)
    : [];

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 900,
      background: "rgba(12,12,12,0.97)",
      display: "flex", flexDirection: "column",
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 40, borderBottom: "1px solid var(--bdr)",
        background: "var(--bg2)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--live)" }}>
            CAUSAL CHAIN GRAPH
          </span>
          <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: "1px" }}>
            {nodes.length} NODES · {edges.length} LINKS
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setPaused((v) => !v)}
            style={{
              padding: "3px 10px", fontSize: 9, letterSpacing: "1.5px",
              background: paused ? "var(--live-d)" : "transparent",
              border: `1px solid ${paused ? "var(--live)" : "var(--bdr)"}`,
              color: paused ? "var(--live)" : "var(--txt3)",
              cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {paused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "3px 10px", fontSize: 9, letterSpacing: "1.5px",
              background: "transparent", border: "1px solid var(--bdr)",
              color: "var(--txt3)", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>

      {/* Graph area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ flex: 1 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Edges */}
          {edges.map((edge, i) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;
            const isHighlit = hoveredEdges.some(
              (e) => e.source === edge.source && e.target === edge.target
            );
            return (
              <line key={i}
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={isHighlit ? "var(--live)" : "#333"}
                strokeWidth={isHighlit ? 1.5 : 0.8}
                strokeOpacity={isHighlit ? 0.9 : 0.4 + edge.probability * 0.3}
                strokeDasharray={edge.probability < 0.5 ? "3 3" : undefined}
              />
            );
          })}

          {/* Edge probability labels on hover */}
          {hoveredEdges.map((edge, i) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;
            const mx = (src.x + tgt.x) / 2;
            const my = (src.y + tgt.y) / 2;
            return (
              <text key={i} x={mx} y={my - 4} textAnchor="middle"
                fontSize={7} fill="var(--live)" letterSpacing={1}
              >
                {(edge.probability * 100).toFixed(0)}%
              </text>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const color = SEV_COLOR[node.severity] ?? "#888";
            const isHov = hovered?.id === node.id;
            return (
              <g key={node.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(node)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Glow ring on hover */}
                {isHov && (
                  <circle cx={node.x} cy={node.y} r={NODE_R + 5}
                    fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3}
                  />
                )}
                <circle cx={node.x} cy={node.y} r={NODE_R}
                  fill={color} fillOpacity={isHov ? 0.9 : 0.65}
                  stroke={color} strokeWidth={isHov ? 1.5 : 0.5}
                />
                {/* Score label inside node */}
                <text x={node.x} y={node.y + 3} textAnchor="middle"
                  fontSize={5} fill="#000" fontWeight={700} letterSpacing={0}
                >
                  {node.score.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover detail card */}
        {hovered && (
          <div style={{
            position: "absolute", top: 50, right: 16, width: 240, zIndex: 10,
            background: "var(--bg2)", border: "1px solid var(--bdr)", padding: 12,
            pointerEvents: "none",
          }}>
            <div style={{
              fontSize: 9, letterSpacing: "1.5px",
              color: SEV_COLOR[hovered.severity] ?? "var(--txt)",
              border: `1px solid ${(SEV_COLOR[hovered.severity] ?? "#888") + "55"}`,
              padding: "1px 6px", display: "inline-block", marginBottom: 8,
            }}>
              {hovered.severity.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt)", lineHeight: 1.4, marginBottom: 6 }}>
              {hovered.label}
            </div>
            <div style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: "1px" }}>
              SCORE {hovered.score.toFixed(3)}
            </div>
            {hoveredEdges.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 9, color: "var(--txt3)", letterSpacing: "1px" }}>
                {hoveredEdges.length} CAUSAL LINK{hoveredEdges.length > 1 ? "S" : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        padding: "6px 16px", borderTop: "1px solid var(--bdr)",
        display: "flex", gap: 16, alignItems: "center",
        background: "var(--bg)", flexShrink: 0, fontSize: 9, color: "var(--txt3)",
      }}>
        {Object.entries(SEV_COLOR).map(([sev, col]) => (
          <span key={sev} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 7, height: 7, background: col, display: "inline-block", borderRadius: "50%" }} />
            {sev.toUpperCase()}
          </span>
        ))}
        <span style={{ marginLeft: "auto", letterSpacing: "1px" }}>
          HOVER NODE TO HIGHLIGHT LINKS · NODES = ALERTS · EDGES = CAUSAL CORRELATION
        </span>
      </div>
    </div>
  );
}
