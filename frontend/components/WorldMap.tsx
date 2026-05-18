"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { Alert } from "@/app/dashboard/page";

// ── Compact SVG mode (used in detail sidebar — no tiles, no SSR issues) ────────

const SEV_COLOR: Record<string, string> = {
  critical: "#ff4444", high: "#ff8c42", medium: "#e6c340", low: "#00e676",
};

function project(lat: number, lon: number): [number, number] {
  return [((lon + 180) / 360) * 100, ((90 - lat) / 180) * 50];
}

const CONTINENTS = [
  "M 3.3,5.6 L 22,4.7 L 31,6.7 L 35,11.9 L 31,13 L 28,18.1 L 25.6,20.6 L 28.3,22.8 L 20.8,19.4 L 17.2,16.1 L 15.6,11.9 L 13.3,10 L 4.4,8.3 Z",
  "M 28.3,22.8 L 32.8,21.9 L 40.3,26.4 L 39.2,29.2 L 38.3,31.4 L 35.8,33.3 L 33.9,34.4 L 31.9,37.8 L 31.1,40 L 29.7,37 L 30.6,31.9 L 28.3,28.3 L 27.8,24.4 Z",
  "M 35.8,8.1 L 42.9,1.9 L 44.4,3.6 L 43.9,8.3 L 37.8,8.3 Z",
  "M 47.5,14.4 L 48.9,12.8 L 48.6,11.7 L 51.4,10.3 L 52.8,9.2 L 57.8,5.3 L 58.9,6.9 L 58.3,8.3 L 56.7,8.6 L 60.3,12 L 61.1,13.1 L 57.2,13.9 L 55.6,14.7 L 54.4,14.4 L 53.3,12.8 L 51.1,12.5 L 49.4,12.8 Z",
  "M 48.6,15 L 52.8,14.4 L 58.9,16.4 L 64.2,21.7 L 61.1,26.1 L 59.7,30.6 L 58.1,33.3 L 55,34.4 L 53.3,29.7 L 50.8,23.6 L 45.3,21.1 L 45.3,17 Z",
  "M 60,14.7 L 63.9,14.4 L 68.3,17.8 L 72.2,22.8 L 74.4,19.4 L 80.3,21.9 L 83.6,18.9 L 88.9,15.3 L 89.4,12.5 L 94.4,8.3 L 97.2,6.9 L 88.9,4.7 L 77.8,5 L 66.7,6.1 L 61.1,8.9 L 61.1,13.1 Z",
  "M 81.9,33.9 L 86.1,28.3 L 90.3,28.1 L 92.5,32.5 L 91.9,34.4 L 90.3,35.6 L 88.3,34.7 L 86.7,33.9 Z",
];

function CompactMap({ alerts }: { alerts: Alert[] }) {
  const geoAlerts = useMemo(() => alerts.filter((a) => a.geo_bbox), [alerts]);
  return (
    <div style={{ height:"100%", background:"var(--bg2)", position:"relative", overflow:"hidden" }}>
      <svg viewBox="0 0 100 50" style={{ width:"100%", height:"100%", display:"block" }}>
        {CONTINENTS.map((d, i) => <path key={i} d={d} fill="#1e1e1e" stroke="#2e2e2e" strokeWidth="0.3" />)}
        {geoAlerts.map((alert) => {
          if (!alert.geo_bbox) return null;
          const lat = (alert.geo_bbox.lat_min + alert.geo_bbox.lat_max) / 2;
          const lon = (alert.geo_bbox.lon_min + alert.geo_bbox.lon_max) / 2;
          const [x, y] = project(lat, lon);
          const r = alert.score * 1.4 + 0.5;
          const color = SEV_COLOR[alert.severity] ?? "#444";
          return (
            <g key={alert.id}>
              <circle cx={x} cy={y} r={r * 2.5} fill={color} opacity={0.08} />
              <circle cx={x} cy={y} r={r} fill={color} opacity={0.85}><title>{alert.title}</title></circle>
            </g>
          );
        })}
      </svg>
      {geoAlerts.length === 0 && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"var(--txt3)", letterSpacing:2 }}>
          NO GEOTAGGED
        </div>
      )}
    </div>
  );
}

// ── Full Leaflet map (loaded client-side only to avoid SSR window errors) ──────

const WorldMapFull = dynamic(() => import("./WorldMapFull"), {
  ssr: false,
  loading: () => (
    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", fontSize:9, letterSpacing:"2px", color:"var(--txt3)" }}>
      INITIALISING MAP...
    </div>
  ),
});

// ── Exported component ─────────────────────────────────────────────────────────

interface Props { alerts: Alert[]; compact?: boolean }

export default function WorldMap({ alerts, compact }: Props) {
  if (compact) return <CompactMap alerts={alerts} />;
  return <WorldMapFull alerts={alerts} />;
}
