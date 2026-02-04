"use client";

type SessionCardProps = {
  title: string;
  timeRange: string;
  statusLabel: string;
  statusDot: string;
};

export default function SessionCard({
  title,
  timeRange,
  statusLabel,
  statusDot,
}: SessionCardProps) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{timeRange}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: statusDot,
            display: "inline-block",
          }}
        />
        <span style={{ opacity: 0.8 }}>{statusLabel}</span>
      </div>
    </div>
  );
}
