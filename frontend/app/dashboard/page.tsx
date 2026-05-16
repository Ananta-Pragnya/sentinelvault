"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AlertFeed from "@/components/AlertFeed";
import WorldMap from "@/components/WorldMap";
import SeverityBadge from "@/components/SeverityBadge";

const SEVERITIES = ["all", "critical", "high", "medium", "low"] as const;
type Severity = (typeof SEVERITIES)[number];

export interface Alert {
  id: string;
  title: string;
  severity: string;
  score: number;
  summary: string;
  asset_tags: string[];
  geo_bbox?: { lat_min: number; lat_max: number; lon_min: number; lon_max: number };
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<Severity>("all");
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("sv_token") ?? "";
    if (!t) { router.replace("/onboarding"); return; }
    setToken(t);

    const api = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${api}/alerts?limit=50`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((data) => { setAlerts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const onNewAlert = (alert: Alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 200));
    setUnread((n) => n + 1);
  };

  const visible = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div className="min-h-screen flex flex-col bg-sentinel-bg">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-sentinel-border">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-sentinel-accent">SentinelVault</span>
          {unread > 0 && (
            <span className="bg-sentinel-critical text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {unread} new
            </span>
          )}
        </div>

        <nav className="flex items-center gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setUnread(0); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === s
                  ? "bg-sentinel-accent text-sentinel-bg"
                  : "text-slate-400 hover:text-white hover:bg-sentinel-card"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => router.push("/assistant")}
            className="ml-4 px-4 py-1.5 rounded-lg bg-sentinel-card border border-sentinel-border text-sm text-slate-300 hover:border-sentinel-accent hover:text-sentinel-accent transition-all"
          >
            AI Assistant
          </button>
          <button
            onClick={() => { localStorage.removeItem("sv_token"); router.replace("/onboarding"); }}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sign out
          </button>
        </nav>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 border-r border-sentinel-border overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-sentinel-card rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <AlertFeed
              alerts={visible}
              token={token}
              onNewAlert={onNewAlert}
            />
          )}
        </aside>

        <main className="flex-1 p-4">
          <WorldMap alerts={visible} />
        </main>
      </div>
    </div>
  );
}
