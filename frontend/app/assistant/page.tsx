"use client";
import { useRouter } from "next/navigation";
import AssistantChat from "@/components/AssistantChat";

export default function AssistantPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col bg-sentinel-bg">
      <header className="flex items-center justify-between px-6 py-4 border-b border-sentinel-border">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
        >
          ← Dashboard
        </button>
        <span className="text-xl font-bold text-sentinel-accent">AI Assistant</span>
        <div className="w-24" />
      </header>
      <div className="flex-1 overflow-hidden">
        <AssistantChat />
      </div>
    </div>
  );
}
