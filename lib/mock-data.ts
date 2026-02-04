import type { NewSessionDraft } from "./types";

export const GAMES = [
  "Кернел: Бункер",
  "Кернел: Вороны",
  "Кернел: Сны",
  "Кернел: Святилище",
  "Кернел: Борей",
  "Шмутер: Небоскребы",
  "Шмутер: Осада Острова",
  "Шмутер: Кубики",
  "Шмутер: Космическая Битва",
  "Шмутер: Космическая Битва 2",
  "Шмутер: Форты",
  "Старбейз: Экспедиция",
  "Старбейз: Рой",
  "Ночь Живых Мертвецов",
  "Загадочная башня: Охота",
  "Загадочная башня: Призраки",
  "Загадочная башня: Танцы",
  "Загадочная башня: Рыбалка",
];

export const DURATIONS = [10, 15, 30, 45, 60, 90, 120];

export const MOCK_SESSIONS = [];

export const NEW_SESSION_BASE: Omit<NewSessionDraft, "open" | "start" | "arenaId"> = {
  gameName: "",
  mode: "private",
  playersCount: "",
  playersCurrent: "",
  playersCapacity: "",
  clientName: "",
  phone: "",
  comment: "",
  price: "",
  durationMinutes: 60,
  status: "planned",
};
