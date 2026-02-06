export type ArenaResource = {
  id: string;
  title: string;
  name?: string;
  address?: string | null;
  capacity?: number | null;
};

export type GameOption = { id: string; name: string; category?: string | null; price_per_player?: number | null };

export type CalEventExtended = {
  status?: string;
  clientName?: string | null;
  clientId?: string | null;
  gameName?: string | null;
  date?: string | null;
  startTime?: string | null;
  duration?: number | string | null;
  mode?: "private" | "open";
  playersCount?: string | null;
  playersCurrent?: string | null;
  playersCapacity?: string | null;
  phone?: string | null;
  comment?: string | null;
  price?: string | null;
  prepaid?: string | null; // предоплата
};

export type CalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  resourceId?: string;
  arenaId?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  extendedProps?: CalEventExtended;
};

export type StatusMeta = {
  label: string;
  dot: string;
  bg: string;
  border: string;
  text: string;
};

export type SelectedEvent = {
  id: string;
  title: string;
  status: string;
  start: Date | null;
  end: Date | null;
  arenaId: string | null;
  gameName: string | null;
  clientName: string | null;
  clientId?: string | null;
  duration: number | string | null;
  dateOnly?: string;
  startTime?: string;
  notes?: string;
  gameId?: string;
  current?: unknown;
};

export type NewSessionDraft = {
  open: boolean;
  start: Date | null;
  arenaId: string | null;
  title?: string;
  gameName: string;
  gameId?: string;
  startTime?: string;
  duration?: number;
  durationMinutes: number;
  mode: "private" | "open";
  playersCount: string;
  playersCurrent: string;
  playersCapacity: string;
  clientName: string;
  phone: string;
  comment: string;
  price: string;
  prepaid: string; // предоплата
  status: string;
};

export type BookingCreate = {
  arena: number | string;
  date: string;
  start_time: string;
  durationMinutes?: number;
  duration?: number;
  status?: string;
  mode?: "private" | "open";
  playersCount?: string;
  playersCurrent?: string;
  playersCapacity?: string;
  players?: number;
  game?: number;
  client?: number;
  gameName?: string;
  clientName?: string;
  phone?: string;
  comment?: string;
  price?: number | string;
  prepaid?: number | string; // предоплата
};

export type BookingUpdate = Partial<BookingCreate> & { id: string | number };

export const STATUS_META: Record<string, StatusMeta> = {
  planned: {
    label: "Запланировано",
    dot: "#60a5fa",
    bg: "rgba(59,130,246,0.22)",
    border: "rgba(59,130,246,0.5)",
    text: "#dbeafe",
  },
  confirmed: {
    label: "Подтверждено",
    dot: "#34d399",
    bg: "rgba(16,185,129,0.22)",
    border: "rgba(16,185,129,0.5)",
    text: "#d1fae5",
  },
  arrived: {
    label: "Прибыли",
    dot: "#34d399",
    bg: "rgba(16,185,129,0.22)",
    border: "rgba(16,185,129,0.5)",
    text: "#d1fae5",
  },
  completed: {
    label: "Завершено",
    dot: "#a1a1aa",
    bg: "rgba(113,113,122,0.22)",
    border: "rgba(113,113,122,0.5)",
    text: "#e4e4e7",
  },
  cancelled: {
    label: "Отменено",
    dot: "#f87171",
    bg: "rgba(239,68,68,0.22)",
    border: "rgba(239,68,68,0.5)",
    text: "#fee2e2",
  },
  new: {
    label: "Новая",
    dot: "#fbbf24",
    bg: "rgba(234,179,8,0.2)",
    border: "rgba(234,179,8,0.45)",
    text: "#fef3c7",
  },
};

export const DEFAULT_STATUS: StatusMeta = {
  label: "Неизвестно",
  dot: "#94a3b8",
  bg: "rgba(148,163,184,0.2)",
  border: "rgba(148,163,184,0.45)",
  text: "#e2e8f0",
};

export function getStatusMeta(value?: string | null) {
  const key = String(value ?? "unknown").toLowerCase();
  return STATUS_META[key] ?? DEFAULT_STATUS;
}
