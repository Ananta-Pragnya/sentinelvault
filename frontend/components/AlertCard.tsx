"use client";
import { useState } from "react";
import SeverityBadge from "./SeverityBadge";
import type { Alert } from "@/app/dashboard/page";

const SEV_COLOR: Record<string, string> = {
  critical: "#EF4444",
  high:     "#F97316",
  medium:   "#EAB308",
  low:      "#22C55E",
};

interface Props { alert: Alert; token: string; }

export default function AlertCard({ alert, token }: Props) {
  const [action, setAction] = useState<string | null>(null);
  const api = process.env.NEXT_PUBLIC_API_URL;
  const color = SEV_COLOR[alert.severity] ?? "#71717A";

  const handleAction = async (a: string) => {
    await fetch(`${api}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ alert_id: alert.id, action: a }),
    });
    setAction(a);
  };

  const ts = new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="card hover-lift p-4 alert-enter"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <SeverityBadge severity={alert.severity} />
        <div className="flex items-center gap-2 shrink-0">
          <span className="mono text-[10px] text-sv-muted">{ts}</span>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-sv-text mb-1.5 leading-snug">{alert.title}</h3>
      <p className="text-[11px] text-sv-dim leading-relaxed mb-3">{alert.summary}</p>

      {alert.asset_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {alert.asset_tags.map((tag) => (
            <span key={tag} className="mono text-[10px] px-1.5 py-0.5 bg-sv-raised border border-sv-border rounded-sm text-sv-muted">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-12 h-1 bg-sv-border rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${alert.score * 100}%`, background: color }} />
          </div>
          <span className="mono text-[10px] text-sv-muted">{alert.score.toFixed(2)}</span>
        </div>

        {action ? (
          <span className="mono text-[10px] text-sv-muted capitalize">{action}</span>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAction("acted")}
              className="mono text-[10px] px-2 py-1 rounded-sm transition-colors"
              style={{ background: "rgba(34,197,94,0.08)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              Act
            </button>
            <button
              onClick={() => handleAction("acknowledged")}
              className="mono text-[10px] px-2 py-1 rounded-sm transition-colors"
              style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              Ack
            </button>
            <button
              onClick={() => handleAction("dismissed")}
              className="mono text-[10px] px-2 py-1 rounded-sm text-sv-muted transition-colors hover:text-sv-dim"
              style={{ background: "rgba(82,82,91,0.15)", border: "1px solid rgba(82,82,91,0.25)" }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
