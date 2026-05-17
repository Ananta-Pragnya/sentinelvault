"use client";
import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string; }

const SUGGESTED = [
  "What is my biggest exposure right now?",
  "Explain the latest critical alert",
  "Am I exposed to APAC events?",
  "What assets are generating the most alerts?",
];

export default function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const api = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (msg: string) => {
    if (!msg.trim() || loading) return;
    const token = localStorage.getItem("sv_token") ?? "";
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${api}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, history: messages }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "CONNECTION ERROR. PLEASE RETRY." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", maxWidth: 800, margin: "0 auto", fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ paddingTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--txt3)", marginBottom: 16 }}>SENTINELVAULT AI ANALYST</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--txt)", letterSpacing: -0.5, marginBottom: 4 }}>Ask your data.</div>
            <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 24 }}>Real-time risk exposure · Alert reasoning · Portfolio context</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, width: "100%", maxWidth: 440, border: "1px solid var(--bdr)" }}>
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => send(s)}
                  style={{
                    textAlign: "left", padding: "10px 14px", background: "var(--bg2)",
                    color: "var(--txt2)", fontSize: 11,
                    cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                    border: "none", borderBottom: "1px solid var(--bdr)", transition: "color .1s, background .1s",
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = "var(--txt)"; (e.target as HTMLElement).style.background = "var(--bg3)"; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = "var(--txt2)"; (e.target as HTMLElement).style.background = "var(--bg2)"; }}
                >
                  <span style={{ color: "var(--live)", marginRight: 8 }}>›</span>{s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "bb-chat-user" : "bb-chat-ai"}>
            {msg.role === "assistant" && (
              <div style={{ fontSize: 9, letterSpacing: 1.5, color: "var(--live)", marginBottom: 6 }}>SV ANALYST</div>
            )}
            <div style={{ lineHeight: 1.7 }}>{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="bb-chat-ai">
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: "var(--live)", marginBottom: 6 }}>SV ANALYST</div>
            <div style={{ color: "var(--txt3)", letterSpacing: 2, fontSize: 10 }}>PROCESSING...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--bdr)", display: "flex" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask about your risk exposure..."
          className="bb-chat-input"
        />
        <button onClick={() => send(input)} disabled={!input.trim() || loading} className="bb-chat-send">
          SEND →
        </button>
      </div>
    </div>
  );
}
