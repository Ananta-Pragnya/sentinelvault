const SEV: Record<string, { color: string; bg: string }> = {
  critical: { color: "#ff4444", bg: "#1a0000" },
  high:     { color: "#ff8c42", bg: "#1a0800" },
  medium:   { color: "#e6c340", bg: "#1a1500" },
  low:      { color: "#00e676", bg: "#00331a" },
};

export default function SeverityBadge({ severity }: { severity: string }) {
  const s = SEV[severity] ?? { color: "#444444", bg: "#111111" };
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "1px 6px", fontSize: 9, letterSpacing: "1.5px",
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
        textTransform: "uppercase", color: s.color, background: s.bg,
        border: `1px solid ${s.color}22`,
      }}
    >
      <span style={{ width: 5, height: 5, background: s.color, display: "inline-block" }} />
      {severity}
    </span>
  );
}
