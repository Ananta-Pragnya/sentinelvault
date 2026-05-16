"use client";
import type { Alert } from "@/app/dashboard/page";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ff3366",
  high:     "#ff6b35",
  medium:   "#ffcc00",
  low:      "#00ff88",
};

function latLonToXY(lat: number, lon: number): [number, number] {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return [x, y];
}

export default function WorldMap({ alerts }: { alerts: Alert[] }) {
  const geoAlerts = alerts.filter((a) => a.geo_bbox);

  return (
    <div className="sentinel-card h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 border-b border-sentinel-border">
        <h2 className="text-sm font-semibold text-slate-300">Global Alert Map</h2>
        <p className="text-xs text-slate-500">{geoAlerts.length} geotagged alerts</p>
      </div>

      <div className="flex-1 relative overflow-hidden p-4">
        {/* SVG world map outline (simplified rectangle + continents hint) */}
        <svg viewBox="0 0 100 50" className="w-full h-full opacity-20 absolute inset-4">
          <rect width="100" height="50" fill="none" stroke="#1e2d4a" strokeWidth="0.3" />
          {/* Americas */}
          <rect x="5" y="5" width="22" height="35" rx="2" fill="#1e2d4a" />
          {/* Europe + Africa */}
          <rect x="35" y="5" width="15" height="40" rx="2" fill="#1e2d4a" />
          {/* Asia + APAC */}
          <rect x="55" y="3" width="35" height="32" rx="2" fill="#1e2d4a" />
          <rect x="72" y="30" width="15" height="15" rx="2" fill="#1e2d4a" />
        </svg>

        <svg viewBox="0 0 100 50" className="w-full h-full absolute inset-4">
          {geoAlerts.map((alert) => {
            if (!alert.geo_bbox) return null;
            const midLat = (alert.geo_bbox.lat_min + alert.geo_bbox.lat_max) / 2;
            const midLon = (alert.geo_bbox.lon_min + alert.geo_bbox.lon_max) / 2;
            const [x, y] = latLonToXY(midLat, midLon);
            const r = alert.score * 2.5 + 0.8;
            const color = SEVERITY_COLOR[alert.severity] ?? "#888";

            return (
              <g key={alert.id}>
                <circle cx={x} cy={y} r={r * 2} fill={color} opacity={0.15} />
                <circle cx={x} cy={y} r={r} fill={color} opacity={0.8}>
                  <title>{alert.title}</title>
                </circle>
              </g>
            );
          })}
        </svg>

        {geoAlerts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm">
            No geotagged alerts
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex gap-4 text-xs text-slate-500">
        {Object.entries(SEVERITY_COLOR).map(([sev, col]) => (
          <span key={sev} className="flex items-center gap-1 capitalize">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: col }} />
            {sev}
          </span>
        ))}
      </div>
    </div>
  );
}
