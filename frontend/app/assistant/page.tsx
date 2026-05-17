"use client";
import { useRouter } from "next/navigation";
import AssistantChat from "@/components/AssistantChat";

export default function AssistantPage() {
  const router = useRouter();
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--txt)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
      <nav className="bb-nav">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="bb-brand">SENTINELVAULT</span>
          <div className="bb-live-badge"><span className="bb-live-dot" /><span>AI ANALYST</span></div>
        </div>
        <div className="bb-nav-right">
          <button onClick={() => router.back()} className="bb-nav-btn" style={{ border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>
            ← DASHBOARD
          </button>
        </div>
      </nav>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <AssistantChat />
      </div>
    </div>
  );
}
