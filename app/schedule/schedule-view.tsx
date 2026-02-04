"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NewSessionModal from "@/components/new-session-modal";
import SessionModal from "@/components/session-modal";
import SettingsDashboard from "@/components/settings-dashboard";
import TimelineView from "@/components/timeline-view";
import UserBadge from "@/components/user-badge";
import type FullCalendar from "@fullcalendar/react";
import type { ArenaResource, CalEvent, GameOption, NewSessionDraft, SelectedEvent } from "@/lib/types";

const DEFAULT_DRAFT: NewSessionDraft = {
  open: false,
  start: null,
  arenaId: null,
  title: "",
  gameName: "",
  gameId: undefined,
  startTime: undefined,
  duration: undefined,
  durationMinutes: 60,
  mode: "private",
  playersCount: "",
  playersCurrent: "",
  playersCapacity: "",
  clientName: "",
  phone: "",
  comment: "",
  price: "",
  status: "new",
};

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatTime = (date?: Date | null) => {
  if (!date) return "--:--";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatTimeRange = (start?: Date | null, end?: Date | null) => {
  if (!start && !end) return "--:--";
  if (start && !end) return `${formatTime(start)} - --:--`;
  if (!start && end) return `--:-- - ${formatTime(end)}`;
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const formatDurationLabel = (session: SelectedEvent | null) => {
  if (!session) return "--";
  if (session.start && session.end) {
    const minutes = Math.max(0, Math.round((session.end.getTime() - session.start.getTime()) / 60000));
    if (minutes) return `${minutes} мин`;
  }
  if (session.duration != null) {
    return typeof session.duration === "number" ? `${session.duration} мин` : String(session.duration);
  }
  return "--";
};

export default function ScheduleView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams?.get("view") || "calendar";
  const calendarRef = useRef<FullCalendar>(null!);
  const [mounted, setMounted] = useState(false);
  const [resources, setResources] = useState<ArenaResource[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [games, setGames] = useState<GameOption[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    arenaId: string;
    time: string;
    date: string;
  } | null>(null);
  const [draft, setDraft] = useState<NewSessionDraft>(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SelectedEvent | null>(null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionPosition, setSessionPosition] = useState<{ x: number; y: number } | null>(null);
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return formatDate(today);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        const roleName = data?.user?.role?.name ?? null;
        if (active) setUserRole(roleName);
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    };
    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const canDelete = (() => {
    if (!userRole) return false;
    const role = userRole.toLowerCase();
    return (
      role.includes("admin") ||
      role.includes("director") ||
      role.includes("owner") ||
      role.includes("директор") ||
      role.includes("управля")
    );
  })();

  useEffect(() => {
    let active = true;
    const loadGames = async () => {
      setGamesLoading(true);
      try {
        const res = await fetch("/api/games");
        if (!res.ok) throw new Error("Failed to load games");
        const data = await res.json();
        if (active) setGames(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading games:", err);
        if (active) setGames([]);
      } finally {
        if (active) setGamesLoading(false);
      }
    };

    loadGames();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const loadArenas = async () => {
      try {
        const res = await fetch("/api/arenas", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load arenas");
        const data = await res.json();
        const arenasArray = Array.isArray(data) ? data : (data?.arenas ?? []);
        setResources(arenasArray);
      } catch (err) {
        console.error("Error loading arenas:", err);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    loadArenas();
  }, []);

  const loadEvents = async (startDate: Date, endDate: Date) => {
    try {
      setEventsLoading(true);
      const res = await fetch(
        `/api/bookings?start=${formatDate(startDate)}&end=${formatDate(endDate)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed to load events");
      const data = await res.json();
      const eventsArray = Array.isArray(data) ? data : (data?.bookings ?? []);
      setEvents(eventsArray);
      setRange({ start: startDate, end: endDate });
    } catch (err) {
      console.error("Error loading events:", err);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    loadEvents(startDate, endDate);
  }, []);

  const openSettings = () => router.push("/schedule?view=settings");
  const openCalendar = () => router.push("/schedule");

  const refreshBookings = async () => {
    if (range) {
      await loadEvents(range.start, range.end);
      return;
    }
    const today = new Date();
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    await loadEvents(startDate, endDate);
  };

  const handleDatesSet = (start: Date, end: Date) => {
    setSelectedDate(formatDate(start));
    loadEvents(start, end);
  };

  const handleSelectSlot = (payload: {
    start: Date | null;
    end: Date | null;
    resourceId: string | null;
    durationMinutes?: number;
  }) => {
    if (!payload.start || !payload.resourceId) return;
    const date = formatDate(payload.start);
    const time = formatTime(payload.start);
    setSelectedDate(date);
    setSelectedSlot({ arenaId: payload.resourceId, time, date });
    setDraft({
      ...DEFAULT_DRAFT,
      open: true,
      arenaId: payload.resourceId,
      start: payload.start,
      startTime: time,
      durationMinutes: payload.durationMinutes ?? DEFAULT_DRAFT.durationMinutes,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setDraft(DEFAULT_DRAFT);
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot) return;

    setSaving(true);
    try {
      const durationMinutes =
        Number.isFinite(draft.durationMinutes) && draft.durationMinutes > 0
          ? draft.durationMinutes
          : DEFAULT_DRAFT.durationMinutes;
      const playersValue =
        draft.mode === "open" ? draft.playersCurrent || draft.playersCapacity : draft.playersCount;
      const commentParts: string[] = [];
      if (draft.comment?.trim()) commentParts.push(draft.comment.trim());
      if (draft.clientName?.trim()) commentParts.push(`Клиент: ${draft.clientName.trim()}`);
      if (draft.phone?.trim()) commentParts.push(`Телефон: ${draft.phone.trim()}`);
      const mergedComment = commentParts.join(" | ");

      const payload: Record<string, any> = {
        date: selectedSlot.date,
        start_time: selectedSlot.time,
        arena: selectedSlot.arenaId,
        durationMinutes,
        status: "new",
        mode: draft.mode,
      };

      if (draft.gameId && Number.isFinite(Number(draft.gameId))) {
        payload.game = Number(draft.gameId);
      }
      if (playersValue) payload.players = playersValue;
      if (draft.price.trim() !== "") payload.price = draft.price;
      if (mergedComment) payload.comment = mergedComment;
      if (draft.clientName.trim()) payload.clientName = draft.clientName.trim();
      if (draft.phone.trim()) payload.phone = draft.phone.trim();

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Ошибка создания брони";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore
        }
        if (res.status === 409) {
          alert("Конфликт времени. Выберите другой слот или используйте режим открытой записи.");
        } else {
          alert(message);
        }
        return;
      }

      handleCloseModal();
      await refreshBookings();
    } catch (err) {
      console.error("Error creating booking:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEventClick = (payload: {
    id: string;
    title: string;
    start: Date | null;
    end: Date | null;
    resourceId: string | null;
    extendedProps: {
      status?: string;
      clientName?: string | null;
      gameName?: string | null;
      date?: string | null;
      startTime?: string | null;
      duration?: number | string | null;
      clientId?: string | null;
    };
    clientX?: number;
    clientY?: number;
  }) => {
    if (typeof payload.clientX === "number" && typeof payload.clientY === "number") {
      setSessionPosition({ x: payload.clientX, y: payload.clientY });
    } else {
      setSessionPosition(null);
    }
    setSelectedSession({
      id: payload.id,
      title: payload.title,
      status: payload.extendedProps?.status ?? "new",
      start: payload.start,
      end: payload.end,
      arenaId: payload.resourceId,
      gameName: payload.extendedProps?.gameName ?? null,
      clientName: payload.extendedProps?.clientName ?? null,
      clientId: payload.extendedProps?.clientId ?? null,
      duration: payload.extendedProps?.duration ?? null,
      dateOnly: payload.extendedProps?.date ?? undefined,
      startTime: payload.extendedProps?.startTime ?? undefined,
    });
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedSession) return;
    setSessionBusy(true);
    try {
      const res = await fetch(`/api/bookings/${selectedSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Failed to update status (${res.status})`);
      setSelectedSession((prev) => (prev ? { ...prev, status } : prev));
      await refreshBookings();
    } catch (err) {
      console.error("Error updating booking:", err);
    } finally {
      setSessionBusy(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    setSessionBusy(true);
    try {
      const res = await fetch(`/api/bookings/${selectedSession.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete booking (${res.status})`);
      setSelectedSession(null);
      await refreshBookings();
    } catch (err) {
      console.error("Error deleting booking:", err);
    } finally {
      setSessionBusy(false);
    }
  };

  const getArenaLabel = (arenaId?: string | null) => {
    const arena = resources.find((r) => r.id === arenaId);
    return arena?.name || arena?.title || "";
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">График</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Управление бронированиями</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Arenas Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Арены
              </h3>
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                {resources.length}
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            ) : resources.length > 0 ? (
              <div className="space-y-2">
                {resources.map((arena) => (
                  <div
                    key={arena.id}
                    className="p-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 hover:from-blue-50 hover:to-blue-50/50 dark:hover:from-blue-900/30 dark:hover:to-blue-900/20 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 transition-all cursor-default border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    {arena.name || arena.title}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                Арены недоступны
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Бронирования</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{events.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-50/50 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800/50">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">На этой неделе</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">--</p>
            </div>
          </div>
        </div>

        {/* Settings Button - Footer */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
          <button
            onClick={openSettings}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            ⚙️ Settings
          </button>
          <div className="mt-3">
            <UserBadge />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="flex-1 flex flex-col">
            <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <button
                  onClick={openSettings}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg transition-colors"
                >
                  Настройки 
                </button>
              </div>
            </div>

          <div className="flex-1 overflow-hidden relative">
            {selectedSession && (
              <div
                className="z-20 w-80"
                style={
                  sessionPosition && typeof window !== "undefined"
                    ? {
                        position: "fixed",
                        left: Math.min(sessionPosition.x + 12, window.innerWidth - 340),
                        top: Math.min(sessionPosition.y + 12, window.innerHeight - 280),
                      }
                    : { position: "absolute", right: 16, top: 16 }
                }
              >
                <SessionModal
                  session={selectedSession}
                  arenaLabel={getArenaLabel(selectedSession.arenaId)}
                  timeRange={formatTimeRange(selectedSession.start, selectedSession.end)}
                  durationLabel={formatDurationLabel(selectedSession)}
                  onClear={() => {
                    setSelectedSession(null);
                    setSessionPosition(null);
                  }}
                  onConfirm={() => handleUpdateStatus("confirmed")}
                  onCancel={() => handleUpdateStatus("cancelled")}
                  onDelete={canDelete ? handleDeleteSession : undefined}
                  busy={sessionBusy}
                  />
                </div>
              )}
              {eventsLoading && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-white/70 dark:bg-slate-950/60">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Обновляем бронирования…
                  </div>
                </div>
              )}
              <TimelineView
                calendarRef={calendarRef}
                resources={resources}
                events={events}
                selectedDate={selectedDate}
                viewName="resourceTimeGridDay"
                onDatesSet={handleDatesSet}
                onSelectSlot={handleSelectSlot}
                onEventClick={handleEventClick}
              />
            </div>

            {selectedSlot && (
              <NewSessionModal
                open={modalOpen}
                arenaLabel={getArenaLabel(selectedSlot.arenaId)}
                dateLabel={selectedSlot.date}
                timeLabel={selectedSlot.time}
                timeInputValue={selectedSlot.time}
                games={games}
                gamesLoading={gamesLoading}
                durations={[30, 60, 90, 120]}
                draft={draft}
                saving={saving}
                onClose={handleCloseModal}
                onCreate={handleCreateBooking}
                onChange={(patch) => setDraft({ ...draft, ...patch })}
                onChangeTime={(time) => {
                  setSelectedSlot((slot) => (slot ? { ...slot, time } : slot));
                  setDraft((prev) => ({ ...prev, startTime: time }));
                }}
              />
            )}
          </div>
        )}

        {/* Settings View */}
        {viewMode === "settings" && (
          <div className="flex-1 flex flex-col">
            <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 p-4">
              <button
                onClick={openCalendar}
                className="text-blue-600 hover:text-blue-700 font-semibold mb-4 flex items-center gap-2"
              >
                 Вернуться к графику
              </button>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Настройки</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SettingsDashboard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
