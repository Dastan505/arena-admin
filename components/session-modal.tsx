"use client";

import type { SelectedEvent } from "@/lib/types";
import { getStatusMeta } from "@/lib/types";
import SessionCard from "@/components/session-card";

type SessionModalProps = {
  session: SelectedEvent | null;
  arenaLabel: string;
  timeRange: string;
  durationLabel: string;
  onClear: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  busy?: boolean;
};

export default function SessionModal({
  session,
  arenaLabel,
  timeRange,
  durationLabel,
  onClear,
  onConfirm,
  onCancel,
  onDelete,
  busy = false,
}: SessionModalProps) {
  if (!session) return null;

  const status = getStatusMeta(session.status);

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(15,23,42,0.7)",
        borderRadius: 18,
        padding: 14,
        boxShadow: "0 20px 35px rgba(2,6,23,0.4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Детали сессии</div>
        <button
          type="button"
          onClick={onClear}
          style={{
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Сбросить
        </button>
      </div>

      <SessionCard
        title={session.title}
        timeRange={timeRange}
        statusLabel={status.label}
        statusDot={status.dot}
      />

      <div style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 13 }}>
        <div>
          Статус: <b>{status.label}</b>
        </div>
        <div>
          Арена: <b>{arenaLabel}</b>
        </div>
        <div>
          Сеанс: <b>{session.gameName ?? "-"}</b>
        </div>
        <div>
          Клиент: <b>{session.clientName ?? "-"}</b>
        </div>
        <div>
          Синхронизация: <b>{session.clientId ? "Да" : "Нет"}</b>
        </div>
        <div>
          Длительность: <b>{durationLabel}</b>
        </div>
      </div>

      {(onConfirm || onCancel || onDelete) && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              style={{
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                color: "white",
                padding: "8px 12px",
                borderRadius: 10,
                cursor: busy ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: busy ? 0.6 : 1,
              }}
            >
              Подтвердить
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(2,6,23,0.4)",
                color: "white",
                padding: "8px 12px",
                borderRadius: 10,
                cursor: busy ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: busy ? 0.6 : 1,
              }}
            >
              Отменить
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              style={{
                border: "1px solid rgba(248,113,113,0.6)",
                background: "rgba(248,113,113,0.18)",
                color: "#fee2e2",
                padding: "8px 12px",
                borderRadius: 10,
                cursor: busy ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: busy ? 0.6 : 1,
              }}
            >
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
