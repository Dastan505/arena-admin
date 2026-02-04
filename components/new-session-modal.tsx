"use client";

import type { GameOption, NewSessionDraft } from "@/lib/types";

type NewSessionModalProps = {
  open: boolean;
  arenaLabel: string;
  dateLabel: string;
  timeLabel: string;
  timeInputValue: string;
  games: GameOption[];
  gamesLoading?: boolean;
  durations: number[];
  draft: NewSessionDraft;
  saving?: boolean;
  onClose: () => void;
  onCreate: () => void;
  onChange: (patch: Partial<NewSessionDraft>) => void;
  onChangeTime: (time: string) => void;
};

export default function NewSessionModal({
  open,
  arenaLabel,
  dateLabel,
  timeLabel,
  timeInputValue,
  games,
  gamesLoading = false,
  durations,
  draft,
  saving = false,
  onClose,
  onCreate,
  onChange,
  onChangeTime,
}: NewSessionModalProps) {
  if (!open) return null;

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(6,11,24,0.6)",
    border: "1px solid rgba(148,163,184,0.24)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
    color: "white",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle = {
    display: "grid",
    gap: 6,
    fontSize: 12,
    opacity: 0.9,
    fontWeight: 600,
  };
  const sectionTitleStyle = {
    fontSize: 12,
    opacity: 0.6,
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
  };
  const timeInputStyle = {
    ...inputStyle,
    paddingRight: 32,
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };
  const selectStyle = {
    ...inputStyle,
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(circle at top, rgba(99,102,241,0.18), rgba(2,6,23,0.85) 65%)",
        backdropFilter: "blur(8px)",
        display: "grid",
        placeItems: "center",
        zIndex: 60,
        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(540px, 100%)",
          background:
            "linear-gradient(180deg, rgba(18,24,41,0.98) 0%, rgba(10,15,30,0.98) 100%)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 20,
          boxShadow: "0 30px 60px rgba(2,6,23,0.65)",
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            height: 2,
            borderRadius: 999,
            background: "linear-gradient(90deg, rgba(99,102,241,0.9), rgba(34,211,238,0.9))",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>Новая сессия</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              {dateLabel} · {timeLabel}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              padding: "6px 9px",
              borderRadius: 999,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            fontSize: 12,
            opacity: 0.7,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            width: "fit-content",
          }}
        >
          Арена: {arenaLabel}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={labelStyle}>
            Игра
            <select
              value={draft.gameId ?? ""}
              onChange={(event) => {
                const id = event.target.value;
                const selected = games.find((game) => String(game.id) === id);
                onChange({
                  gameId: id || undefined,
                  gameName: selected?.name ?? "",
                });
              }}
              style={selectStyle}
            >
              <option value="">
                {gamesLoading
                  ? "Загрузка игр…"
                  : games.length === 0
                    ? "Нет доступных игр"
                    : "Выберите игру"}
              </option>
              {games.map((game) => (
                <option key={game.id} value={String(game.id)}>
                  {game.name}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={sectionTitleStyle}>Время</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Время начала
                <input
                  type="time"
                  step={900}
                  value={timeInputValue}
                  onChange={(event) => onChangeTime(event.target.value)}
                  style={timeInputStyle}
                />
              </label>
              <label style={labelStyle}>
                Длительность
                <select
                  value={String(draft.durationMinutes)}
                  onChange={(event) =>
                    onChange({
                      durationMinutes: Number(event.target.value) || draft.durationMinutes,
                    })
                  }
                  style={selectStyle}
                >
                  {durations.map((value) => (
                    <option key={value} value={value}>
                      {value} мин
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={sectionTitleStyle}>Режим</div>
            <div style={{ display: "flex", gap: 10 }}>
              {(["private", "open"] as const).map((mode) => {
                const active = draft.mode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChange({ mode })}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 12,
                      border: active
                        ? "1px solid rgba(99,102,241,0.9)"
                        : "1px solid rgba(148,163,184,0.3)",
                      background: active ? "rgba(99,102,241,0.2)" : "rgba(2,6,23,0.4)",
                      color: "white",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {mode === "private" ? "Приватная" : "Открытая"}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={sectionTitleStyle}>Игроки</div>
            {draft.mode === "private" ? (
              <label style={labelStyle}>
                Количество игроков
                <input
                  inputMode="numeric"
                  value={draft.playersCount}
                  onChange={(event) => onChange({ playersCount: event.target.value })}
                  style={inputStyle}
                />
              </label>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={labelStyle}>
                  Текущие
                  <input
                    inputMode="numeric"
                    value={draft.playersCurrent}
                    onChange={(event) => onChange({ playersCurrent: event.target.value })}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Максимум
                  <input
                    inputMode="numeric"
                    value={draft.playersCapacity}
                    onChange={(event) => onChange({ playersCapacity: event.target.value })}
                    style={inputStyle}
                  />
                </label>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={sectionTitleStyle}>Данные клиента</div>
            <label style={labelStyle}>
              Имя
              <input
                value={draft.clientName}
                onChange={(event) => onChange({ clientName: event.target.value })}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Телефон
              <input
                type="tel"
                inputMode="tel"
                value={draft.phone}
                onChange={(event) => onChange({ phone: event.target.value })}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Комментарий
              <textarea
                value={draft.comment}
                onChange={(event) => onChange({ comment: event.target.value })}
                style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
              />
            </label>
            <label style={labelStyle}>
              Цена (₸)
              <input
                inputMode="numeric"
                value={draft.price}
                onChange={(event) => onChange({ price: event.target.value })}
                style={inputStyle}
              />
            </label>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(2,6,23,0.4)",
              color: "white",
              padding: "10px 16px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #6366f1, #22d3ee)",
              border: "none",
              color: "white",
              padding: "10px 18px",
              borderRadius: 12,
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 700,
              boxShadow: "0 16px 26px rgba(59,130,246,0.35)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Создаем..." : "Создать сессию"}
          </button>
        </div>
      </div>
    </div>
  );
}
