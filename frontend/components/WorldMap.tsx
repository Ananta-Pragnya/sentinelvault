"use client";
import type { Alert } from "@/app/dashboard/page";

const SEV_COLOR: Record<string, string> = {
  critical: "#ff4444",
  high:     "#ff8c42",
  medium:   "#e6c340",
  low:      "#00e676",
};

function latLonToXY(lat: number, lon: number): [number, number] {
  return [((lon + 180) / 360) * 100, ((90 - lat) / 180) * 100];
}

interface Props {
  alerts: Alert[];
  compact?: boolean;
}

export default function WorldMap({ alerts, compact }: Props) {
  const geoAlerts = alerts.filter((a) => a.geo_bbox);

  return (
    <div style={{ height: compact ? "100%" : "100%", display: "flex", flexDirection: "column", background: "var(--bg2)", borderTop: compact ? "none" : "1px solid var(--bdr)" }}>
      {!compact && (
        <div className="bb-terminal-bar">
          <span className="bb-terminal-title">GLOBAL ALERT MAP</span>
          <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 1 }}>{geoAlerts.length} GEOTAGGED</span>
        </div>
      )}

      <div style={{ flex: 1, position: "relative", overflow: "hidden", padding: compact ? "8px" : "16px" }}>
        {/* Background continents */}
        <svg viewBox="0 0 100 50" style={{ width: "100%", height: "100%", position: "absolute", inset: compact ? 8 : 16, opacity: 0.1 }}>
          <rect width="100" height="50" fill="none" stroke="#2e2e2e" strokeWidth="0.3" />
          <rect x="5" y="4" width="22" height="36" rx="1" fill="#2e2e2e" />
          <rect x="35" y="4" width="12" height="22" rx="1" fill="#2e2e2e" />
          <rect x="37" y="27" width="10" height="18" rx="1" fill="#2e2e2e" />
          <rect x="49" y="14" width="8" height="14" rx="1" fill="#2e2e2e" />
          <rect x="57" y="3" width="28" height="24" rx="1" fill="#2e2e2e" />
          <rect x="72" y="29" width="14" height="13" rx="1" fill="#2e2e2e" />
        </svg>

        {/* Region labels */}
        <svg viewBox="0 0 100 50" style={{ width: "100%", height: "100%", position: "absolute", inset: compact ? 8 : 16, opacity: 0.18 }}>
          <text x="16" y="26" fontSize="2" fill="#444" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">AMERICAS</text>
          <text x="41" y="13" fontSize="2" fill="#444" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">EUROPE</text>
          <text x="42" y="37" fontSize="2" fill="#444" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">AFRICA</text>
          <text x="53" y="23" fontSize="1.8" fill="#444" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">M.EAST</text>
          <text x="71" y="13" fontSize="2" fill="#444" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">APAC</text>
        </svg>

        {/* Alert pins */}
        <svg viewBox="0 0 100 50" style={{ width: "100%", height: "100%", position: "absolute", inset: compact ? 8 : 16 }}>
          {geoAlerts.map((alert) => {
            if (!alert.geo_bbox) return null;
            const midLat = (alert.geo_bbox.lat_min + alert.geo_bbox.lat_max) / 2;
            const midLon = (alert.geo_bbox.lon_min + alert.geo_bbox.lon_max) / 2;
            const [x, y] = latLonToXY(midLat, midLon);
            const r = alert.score * 1.8 + 0.6;
            const color = SEV_COLOR[alert.severity] ?? "#444";
            return (
              <g key={alert.id}>
                <circle cx={x} cy={y} r={r * 3} fill={color} opacity={0.05} />
                <circle cx={x} cy={y} r={r * 1.6} fill={color} opacity={0.15} />
                <circle cx={x} cy={y} r={r} fill={color} opacity={0.9}>
                  <title>{alert.title}</title>
                </circle>
              </g>
            );
          })}
        </svg>

        {geoAlerts.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--txt3)", fontSize: 9, letterSpacing: 2 }}>
            NO GEOTAGGED ALERTS
          </div>
        )}
      </div>

      {!compact && (
        <div style={{ padding: "6px 16px", borderTop: "1px solid var(--bdr)", display: "flex", gap: 16 }}>
          {Object.entries(SEV_COLOR).map(([sev, col]) => (
            <span key={sev} style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 1, display: "flex", alignItems: "center", gap: 4, textTransform: "uppercase" }}>
              <span style={{ width: 5, height: 5, background: col, display: "inline-block" }} />{sev}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
