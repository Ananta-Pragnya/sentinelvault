"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

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
    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
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
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-12">
            <div className="text-5xl mb-4">🛡️</div>
            <h3 className="text-lg font-semibold text-white mb-2">SentinelVault AI</h3>
            <p className="text-slate-400 text-sm mb-8">Ask anything about your risk exposure and alerts</p>
            <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-left px-4 py-3 rounded-xl border border-sentinel-border bg-sentinel-card text-sm text-slate-300 hover:border-sentinel-accent hover:text-sentinel-accent transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-sentinel-accent text-sentinel-bg font-medium"
                : "bg-sentinel-card border border-sentinel-border text-slate-200"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-sentinel-card border border-sentinel-border px-4 py-3 rounded-2xl">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-sentinel-accent rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-sentinel-border">
        <div className="flex gap-2">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
            placeholder="Ask about your risk exposure..."
            className="flex-1 bg-sentinel-card border border-sentinel-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sentinel-accent text-sm"
          />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl bg-sentinel-accent text-sentinel-bg font-bold disabled:opacity-40 hover:opacity-90 transition-opacity text-sm">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
