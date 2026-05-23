"use client";
import { useEffect, useRef, useState } from "react";
import AlertCard from "./AlertCard";
import type { Alert } from "@/app/dashboard/page";

interface Group {
  primary: Alert;
  related: Alert[];
}

function groupAlerts(alerts: Alert[]): Group[] {
  const used = new Set<string>();
  const groups: Group[] = [];

  for (const alert of alerts) {
    if (used.has(alert.id)) continue;

    const related = alerts.filter((other) => {
      if (other.id === alert.id || used.has(other.id)) return false;
      const dt = Math.abs(
        new Date(alert.created_at).getTime() - new Date(other.created_at).getTime()
      );
      if (dt > 30 * 60_000) return false;
      return alert.asset_tags.some((t) => other.asset_tags.includes(t));
    });

    const all = [alert, ...related];
    const primary = all.reduce((a, b) => (a.score > b.score ? a : b));
    all.forEach((a) => used.add(a.id));
    groups.push({ primary, related: all.filter((a) => a.id !== primary.id) });
  }

  return groups;
}

interface Props {
  alerts: Alert[];
  token: string;
  onNewAlert: (alert: Alert) => void;
  onSelect?: (alert: Alert) => void;
  selected?: Alert | null;
}

export default function AlertFeed({ alerts, token, onNewAlert, onSelect, selected }: Props) {
  const wsRef   = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;

    const connect = () => {
      const wsBase = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
      const ws = new WebSocket(`${wsBase}/ws?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "ping") return;
          onNewAlert(data as Alert);
        } catch {}
      };

      ws.onclose = () => {
        const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
        retryRef.current++;
        setTimeout(connect, delay);
      };

      ws.onopen = () => { retryRef.current = 0; };
    };

    connect();
    return () => wsRef.current?.close();
  }, [token, onNewAlert]);

  if (alerts.length === 0) {
    return (
      <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--txt3)", fontSize: 10, letterSpacing: 2 }}>
        NO ALERTS · MONITORING FEEDS...
      </div>
    );
  }

  const groups = groupAlerts(alerts);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div>
      {groups.map(({ primary, related }) => {
        const isOpen = expanded.has(primary.id);
        return (
          <div key={primary.id}>
            <AlertCard
              alert={primary}
              token={token}
              isSelected={selected?.id === primary.id}
              onClick={() => onSelect?.(primary)}
            />

            {related.length > 0 && (
              <>
                <div
                  onClick={() => toggleExpand(primary.id)}
                  style={{
                    padding: "4px 12px 4px 32px",
                    fontSize: 9,
                    letterSpacing: "1.5px",
                    color: "var(--txt3)",
                    borderBottom: "1px solid var(--bdr)",
                    cursor: "pointer",
                    background: "var(--bg)",
                    userSelect: "none",
                  }}
                >
                  {isOpen ? "▾" : "▸"} {related.length} RELATED
                </div>

                {isOpen && related.map((r) => (
                  <div key={r.id} style={{ paddingLeft: 12, borderLeft: "2px solid var(--bdr)", marginLeft: 4 }}>
                    <AlertCard
                      alert={r}
                      token={token}
                      isSelected={selected?.id === r.id}
                      onClick={() => onSelect?.(r)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
