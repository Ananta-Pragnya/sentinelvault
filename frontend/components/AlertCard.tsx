"use client";
import { useState } from "react";
import type { Alert } from "@/app/dashboard/page";

const SEV_COLOR: Record<string, string> = {
  critical: "var(--red)",
  high:     "var(--ora)",
  medium:   "var(--yel)",
  low:      "var(--live)",
};
const SEV_SHORT: Record<string, string> = {
  critical: "CRIT", high: "HIGH", medium: "MED", low: "LOW",
};

interface Props {
  alert: Alert;
  token: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function AlertCard({ alert, token, isSelected, onClick }: Props) {
  const [action, setAction] = useState<string | null>(alert.user_action ?? null);
  const api = process.env.NEXT_PUBLIC_API_URL;
  const color = SEV_COLOR[alert.severity] ?? "var(--txt3)";
  const sevShort = SEV_SHORT[alert.severity] ?? alert.severity.toUpperCase();

  const alertId = `SV-${alert.id.slice(-4).toUpperCase()}`;
  const ts = new Date(alert.created_at);
  const age = (() => {
    const diff = Date.now() - ts.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  })();

  const handleAction = async (a: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`${api}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ alert_id: alert.id, action: a }),
    });
    setAction(a);
  };

  return (
    <div
      className={`bb-alert alert-enter${isSelected ? " selected" : ""}`}
      onClick={onClick}
    >
      {/* Severity column */}
      <div className="bb-sev-col">
        <div className="bb-sev-bar" style={{ background: color }} />
        <div className="bb-sev-label" style={{ color }}>{sevShort}</div>
      </div>

      {/* Content */}
      <div>
        <div className="bb-alert-title">{alert.title}</div>
        <div className="bb-alert-body">{alert.summary}</div>
        {alert.asset_tags?.length > 0 && (
          <div className="bb-alert-meta">
            {alert.asset_tags.map((t) => (
              <span key={t} className="bb-tick">{t.toUpperCase()}</span>
            ))}
          </div>
        )}
        {action ? (
          <div className="bb-action-row">
            <span className={`bb-action-btn ${action}`}>{action.toUpperCase()}</span>
          </div>
        ) : (
          <div className="bb-action-row">
            <button className="bb-action-btn" onClick={(e) => handleAction("acted", e)}>ACT</button>
            <button className="bb-action-btn" onClick={(e) => handleAction("acknowledged", e)}>ACK</button>
            <button className="bb-action-btn" onClick={(e) => handleAction("dismissed", e)}>DISMISS</button>
          </div>
        )}
      </div>

      {/* Score column */}
      <div className="bb-alert-right">
        <div className="bb-alert-id">{alertId}</div>
        <div className="bb-alert-age">{age} ago</div>
        <div className="bb-score-num" style={{ color }}>{alert.score.toFixed(2)}</div>
        <div className="bb-score-track">
          <div className="bb-score-fill" style={{ width: `${alert.score * 100}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}
