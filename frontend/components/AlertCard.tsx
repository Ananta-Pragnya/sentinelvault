"use client";
import { useState } from "react";
import SeverityBadge from "./SeverityBadge";
import type { Alert } from "@/app/dashboard/page";

interface Props {
  alert: Alert;
  token: string;
}

export default function AlertCard({ alert, token }: Props) {
  const [action, setAction] = useState<string | null>(null);
  const api = process.env.NEXT_PUBLIC_API_URL;

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
    <div className="sentinel-card p-4 animate-slide-in hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <SeverityBadge severity={alert.severity} />
        <span className="text-xs text-slate-500">{ts}</span>
      </div>

      <h3 className="text-sm font-semibold text-white mb-1 leading-snug">{alert.title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-3">{alert.summary}</p>

      {alert.asset_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {alert.asset_tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-sentinel-border/50 rounded text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 text-xs">
        <span className="text-slate-500 mr-1">Score {alert.score.toFixed(2)}</span>
        {action ? (
          <span className="text-slate-500 capitalize">{action}</span>
        ) : (
          <>
            <button onClick={() => handleAction("acted")} className="px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">Act</button>
            <button onClick={() => handleAction("acknowledged")} className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">Ack</button>
            <button onClick={() => handleAction("dismissed")} className="px-2 py-1 rounded bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-colors">Dismiss</button>
          </>
        )}
      </div>
    </div>
  );
}
