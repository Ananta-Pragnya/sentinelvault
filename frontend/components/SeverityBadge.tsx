const COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/40",
  high:     "bg-orange-500/20 text-orange-400 border-orange-500/40",
  medium:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  low:      "bg-green-500/20 text-green-400 border-green-500/40",
};

export default function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border uppercase tracking-wide ${COLORS[severity] ?? "bg-slate-500/20 text-slate-400 border-slate-500/40"}`}>
      {severity}
    </span>
  );
}
