"use client";
import { useEffect, useRef } from "react";
import AlertCard from "./AlertCard";
import type { Alert } from "@/app/dashboard/page";

interface Props {
  alerts: Alert[];
  token: string;
  onNewAlert: (alert: Alert) => void;
}

export default function AlertFeed({ alerts, token, onNewAlert }: Props) {
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
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <div className="text-4xl mb-3">📡</div>
        <p className="text-sm">Monitoring for alerts...</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} token={token} />
      ))}
    </div>
  );
}
