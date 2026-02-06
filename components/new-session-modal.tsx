"use client";

import { useEffect, useMemo } from "react";
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

const categoryOrder = [
  "Квест игры",
  "Детские игры", 
  "Командные игры",
  "Мероприятия",
  "Дополнительно",
];

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
  // Auto-calculate price based on game and player count
  const selectedGame = useMemo(() => 
    games.find(g => String(g.id) === draft.gameId),
    [games, draft.gameId]
  );

  const calculatedPrice = useMemo(() => {
    if (!selectedGame?.price_per_player) return null;
    const playerCount = draft.mode === "open" 
      ? (parseInt(draft.playersCurrent) || 0)
      : (parseInt(draft.playersCount) || 0);
    if (playerCount <= 0) return null;
    return selectedGame.price_per_player * playerCount;
  }, [selectedGame, draft.playersCount, draft.playersCurrent, draft.mode]);

  // Auto-update price field when calculated price changes
  useEffect(() => {
    if (calculatedPrice !== null && calculatedPrice > 0) {
      onChange({ price: String(calculatedPrice) });
    }
  }, [calculatedPrice, onChange]);

  const categorizedGames = useMemo(() => {
    if (!games.length) return [];
    const buckets = new Map<string, GameOption[]>();
    games.forEach((game) => {
      const key = (game.category ?? "").trim() || "Без категории";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(game);
    });
    const sorted = Array.from(buckets.entries()).map(([category, list]) => ({
      category,
      games: list.sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return sorted.sort((a, b) => {
      const ai = categoryOrder.indexOf(a.category);
      const bi = categoryOrder.indexOf(b.category);
      if (ai === -1 && bi === -1) return a.category.localeCompare(b.category);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [games]);

  const inputClass = "w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-600/50 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[40px]";
  const labelClass = "text-xs font-medium text-slate-400 uppercase tracking-wide";

  // Debug
  console.log("[NewSessionModal] games:", games.length, "categorizedGames:", categorizedGames.length, "open:", open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-700 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-white">Новая запись</h2>
            <p className="text-xs text-slate-400">{dateLabel} · {timeLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="text-slate-400 text-xl">×</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <label className={labelClass}>Сеанс</label>
            <select
              className={inputClass}
              value={draft.gameId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                const game = games.find(g => String(g.id) === id);
                onChange({ 
                  gameId: id || undefined, 
                  gameName: game?.name ?? "" 
                });
              }}
            >
              <option value="">
                {gamesLoading ? "Загрузка..." : games.length === 0 ? "Нет сеансов" : "Выберите сеанс"}
              </option>
              {categorizedGames.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.games.map((game) => (
                    <option key={game.id} value={String(game.id)}>
                      {game.name} {game.price_per_player ? `(${game.price_per_player.toLocaleString()} ₸)` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Время</label>
              <input
                type="time"
                step={900}
                value={timeInputValue}
                onChange={(e) => onChangeTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Длительность</label>
              <select
                className={inputClass}
                value={String(draft.durationMinutes)}
                onChange={(e) => onChange({ durationMinutes: Number(e.target.value) })}
              >
                {durations.map((d) => (
                  <option key={d} value={d}>{d} мин</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="space-y-1">
            <label className={labelClass}>Режим</label>
            <div className="flex gap-2">
              {(["private", "open"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChange({ mode })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    draft.mode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {mode === "private" ? "Приватная" : "Открытая"}
                </button>
              ))}
            </div>
          </div>

          {/* Players & Price Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>
                {draft.mode === "private" ? "Игроки" : "Текущие"}
              </label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={draft.mode === "private" ? draft.playersCount : draft.playersCurrent}
                onChange={(e) => onChange({ 
                  [draft.mode === "private" ? "playersCount" : "playersCurrent"]: e.target.value 
                })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Итого (₸)</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={draft.price}
                onChange={(e) => onChange({ price: e.target.value })}
                className={`${inputClass} ${calculatedPrice ? "text-emerald-400 font-medium" : ""}`}
              />
              {selectedGame?.price_per_player && (
                <p className="text-xs text-slate-500">
                  {selectedGame.price_per_player.toLocaleString()} ₸ × чел
                </p>
              )}
            </div>
          </div>

          {/* Payment row - Prepaid & Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Предоплата (₸)</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={draft.prepaid}
                onChange={(e) => onChange({ prepaid: e.target.value })}
                className={`${inputClass} ${Number(draft.prepaid) > 0 ? "text-amber-400 font-medium" : ""}`}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Остаток (₸)</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={Math.max(0, (Number(draft.price) || 0) - (Number(draft.prepaid) || 0))}
                readOnly
                className={`${inputClass} bg-slate-800/30 ${(Number(draft.price) || 0) - (Number(draft.prepaid) || 0) > 0 ? "text-rose-400 font-medium" : "text-emerald-400"}`}
              />
              {(Number(draft.price) || 0) - (Number(draft.prepaid) || 0) <= 0 && (
                <p className="text-xs text-emerald-500">✓ Полностью оплачено</p>
              )}
            </div>
          </div>

          {/* Open mode - max players */}
          {draft.mode === "open" && (
            <div className="space-y-1">
              <label className={labelClass}>Максимум игроков</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={draft.playersCapacity}
                onChange={(e) => onChange({ playersCapacity: e.target.value })}
                className={inputClass}
              />
            </div>
          )}

          {/* Client Info */}
          <div className="space-y-3 pt-2 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelClass}>Имя клиента</label>
                <input
                  type="text"
                  placeholder="Имя"
                  value={draft.clientName}
                  onChange={(e) => onChange({ clientName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Телефон</label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="+7"
                  value={draft.phone}
                  onChange={(e) => onChange({ phone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Комментарий</label>
              <textarea
                placeholder="Примечания..."
                value={draft.comment}
                onChange={(e) => onChange({ comment: e.target.value })}
                className={`${inputClass} resize-none`}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onCreate}
            disabled={saving || !draft.gameId}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? "Создание..." : "Записать"}
          </button>
        </div>
      </div>
    </div>
  );
}
