const SEV: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)"   },
  high:     { color: "#F97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.3)"  },
  medium:   { color: "#EAB308", bg: "rgba(234,179,8,0.1)",   border: "rgba(234,179,8,0.3)"   },
  low:      { color: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)"   },
};

export default function SeverityBadge({ severity }: { severity: string }) {
  const s = SEV[severity] ?? { color: "#71717A", bg: "rgba(113,113,122,0.1)", border: "rgba(113,113,122,0.3)" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] mono font-semibold tracking-widest uppercase"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: s.color }} />
      {severity}
    </span>
  );
}
