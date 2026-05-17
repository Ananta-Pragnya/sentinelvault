"use client";
import { useEffect, useRef } from "react";
import AlertCard from "./AlertCard";
import type { Alert } from "@/app/dashboard/page";

interface Props {
  alerts: Alert[];
  token: string;
  onNewAlert: (alert: Alert) => void;
  onSelect?: (alert: Alert) => void;
  selected?: Alert | null;
}

export default function AlertFeed({ alerts, token, onNewAlert, onSelect, selected }: Props) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

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
        const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
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

  return (
    <div>
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          token={token}
          isSelected={selected?.id === alert.id}
          onClick={() => onSelect?.(alert)}
        />
      ))}
    </div>
  );
}
