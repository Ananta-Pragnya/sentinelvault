"use client";
import type { Alert } from "@/app/dashboard/page";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#EF4444",
  high:     "#F97316",
  medium:   "#EAB308",
  low:      "#22C55E",
};

function latLonToXY(lat: number, lon: number): [number, number] {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return [x, y];
}

export default function WorldMap({ alerts }: { alerts: Alert[] }) {
  const geoAlerts = alerts.filter((a) => a.geo_bbox);

  return (
    <div className="card h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 border-b border-sv-border">
        <h2 className="text-sm font-semibold text-sv-text">Global Alert Map</h2>
        <p className="mono text-[10px] text-sv-muted">{geoAlerts.length} geotagged alerts</p>
      </div>

      <div className="flex-1 relative overflow-hidden p-4">
        {/* Background map outline */}
        <svg viewBox="0 0 100 50" className="w-full h-full absolute inset-4" style={{ opacity: 0.12 }}>
          <rect width="100" height="50" fill="none" stroke="#3F3F46" strokeWidth="0.3" />
          {/* Americas */}
          <rect x="5" y="4" width="22" height="36" rx="1.5" fill="#27272A" />
          {/* Europe */}
          <rect x="35" y="4" width="12" height="22" rx="1.5" fill="#27272A" />
          {/* Africa */}
          <rect x="37" y="27" width="10" height="18" rx="1.5" fill="#27272A" />
          {/* Middle East */}
          <rect x="49" y="14" width="8" height="14" rx="1.5" fill="#27272A" />
          {/* Asia */}
          <rect x="57" y="3" width="28" height="24" rx="1.5" fill="#27272A" />
          {/* APAC / Oceania */}
          <rect x="72" y="29" width="14" height="13" rx="1.5" fill="#27272A" />
        </svg>

        {/* Region labels */}
        <svg viewBox="0 0 100 50" className="w-full h-full absolute inset-4" style={{ opacity: 0.25 }}>
          <text x="16" y="26" fontSize="2.2" fill="#52525B" textAnchor="middle" fontFamily="monospace">Americas</text>
          <text x="41" y="14" fontSize="2.2" fill="#52525B" textAnchor="middle" fontFamily="monospace">Europe</text>
          <text x="42" y="36" fontSize="2.2" fill="#52525B" textAnchor="middle" fontFamily="monospace">Africa</text>
          <text x="53" y="22" fontSize="2.2" fill="#52525B" textAnchor="middle" fontFamily="monospace">M.East</text>
          <text x="71" y="14" fontSize="2.2" fill="#52525B" textAnchor="middle" fontFamily="monospace">APAC</text>
        </svg>

        {/* Alert pins */}
        <svg viewBox="0 0 100 50" className="w-full h-full absolute inset-4">
          {geoAlerts.map((alert) => {
            if (!alert.geo_bbox) return null;
            const midLat = (alert.geo_bbox.lat_min + alert.geo_bbox.lat_max) / 2;
            const midLon = (alert.geo_bbox.lon_min + alert.geo_bbox.lon_max) / 2;
            const [x, y] = latLonToXY(midLat, midLon);
            const r = alert.score * 2.2 + 0.8;
            const color = SEVERITY_COLOR[alert.severity] ?? "#71717A";

            return (
              <g key={alert.id}>
                <circle cx={x} cy={y} r={r * 2.5} fill={color} opacity={0.08} />
                <circle cx={x} cy={y} r={r * 1.4} fill={color} opacity={0.2} />
                <circle cx={x} cy={y} r={r} fill={color} opacity={0.85}>
                  <title>{alert.title} ({alert.severity})</title>
                </circle>
              </g>
            );
          })}
        </svg>

        {geoAlerts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center mono text-[11px] text-sv-muted">
            No geotagged alerts yet
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex gap-4 mono text-[10px] text-sv-muted border-t border-sv-border pt-2">
        {Object.entries(SEVERITY_COLOR).map(([sev, col]) => (
          <span key={sev} className="flex items-center gap-1 capitalize">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: col }} />
            {sev}
          </span>
        ))}
      </div>
    </div>
  );
}
