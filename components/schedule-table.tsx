"use client";

import { useEffect, useState } from "react";
import type { ArenaResource, CalEvent, GameOption, NewSessionDraft, SelectedEvent } from "@/lib/types";
import { getStatusMeta } from "@/lib/types";
import NewSessionModal from "./new-session-modal";
import SessionModal from "./session-modal";

type ScheduleTableProps = {
  selectedDate: string;
  resources: ArenaResource[];
  events: CalEvent[];
  onRefreshBookings?: () => Promise<void>;
  canDelete?: boolean;
};

export default function ScheduleTable({ 
  selectedDate,
  resources,
  events,
  onRefreshBookings,
  canDelete = false,
}: ScheduleTableProps) {
  const [games, setGames] = useState<GameOption[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    arenaId: string;
    time: string;
  } | null>(null);
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

  const [draft, setDraft] = useState<NewSessionDraft>(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SelectedEvent | null>(null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionPosition, setSessionPosition] = useState<{ x: number; y: number } | null>(null);

  const formatTime = (value?: Date | null) => {
    if (!value) return "--:--";
    const hh = String(value.getHours()).padStart(2, "0");
    const mm = String(value.getMinutes()).padStart(2, "0");
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

  // Generate time slots (7:00 to 22:00 hourly)
  const timeSlots: string[] = [];
  for (let hour = 7; hour < 23; hour++) {
    const timeStr = `${String(hour).padStart(2, "0")}:00`;
    timeSlots.push(timeStr);
  }

  // Helper: round time to nearest hour slot (e.g., 15:05 -> 15:00)
  const roundToHourSlot = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    // If minutes >= 30, round up to next hour, else round down
    if (minutes >= 30) {
      const nextHour = hours + 1;
      if (nextHour >= 24) return "23:59";
      return `${String(nextHour).padStart(2, '0')}:00`;
    }
    return `${String(hours).padStart(2, '0')}:00`;
  };

  // Get events for selected date and arena
  const getEventsForSlot = (arenaId: string, startTime: string) => {
    return events.filter((event) => {
      if (!event.start) return false;
      const eventDate = event.start.split("T")[0];
      if (eventDate !== selectedDate) return false;

      const eventTime = event.start.split("T")[1]?.substring(0, 5);
      // Round event time to nearest hour slot for matching
      const roundedEventTime = roundToHourSlot(eventTime || "00:00");
      const matches = roundedEventTime === startTime && (event.resourceId === arenaId || event.arenaId === arenaId);
      
      // Debug logging
      if (eventDate === selectedDate && matches) {
        console.log(`[getEventsForSlot] Match! Event: ${event.title}, raw time: ${eventTime}, rounded: ${roundedEventTime}, slot: ${startTime}`);
      }
      
      return matches;
    });
  };

  const handleAddClick = (arenaId: string, time: string, preferOpen = false) => {
    setSelectedSlot({ arenaId, time });
    setDraft({
      ...DEFAULT_DRAFT,
      open: true,
      arenaId,
      startTime: time,
      mode: preferOpen ? "open" : DEFAULT_DRAFT.mode,
    });
    setModalOpen(true);
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

      const payload: Record<string, unknown> = {
        date: selectedDate,
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
        let details = "";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
          if (data?.details) details = data.details;
        } catch {
          // ignore
        }
        if (res.status === 409) {
          alert("Конфликт времени. Выберите другой слот или используйте режим открытой записи.");
        } else {
          alert(message + (details ? `\n\n${details}` : "") + ` (код: ${res.status})`);
        }
        return;
      }

      if (res.ok) {
        setModalOpen(false);
        setSelectedSlot(null);
        setDraft(DEFAULT_DRAFT);
        // Refresh events without full page reload
        if (onRefreshBookings) {
          await onRefreshBookings();
        }
      }
    } catch (err) {
      console.error("Error creating booking:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setDraft(DEFAULT_DRAFT);
  };

  const handleEventClick = (event: CalEvent, clientX?: number, clientY?: number) => {
    if (typeof clientX === "number" && typeof clientY === "number") {
      setSessionPosition({ x: clientX, y: clientY });
    } else {
      setSessionPosition(null);
    }
    const status = (event.extendedProps?.status ?? event.status ?? "new") as string;
    setSelectedSession({
      id: String(event.id),
      title: event.title,
      status,
      start: event.start ? new Date(event.start) : null,
      end: event.end ? new Date(event.end) : null,
      arenaId: (event.resourceId ?? event.arenaId ?? null) as string | null,
      gameName: event.extendedProps?.gameName ?? null,
      clientName: event.extendedProps?.clientName ?? null,
      clientId: event.extendedProps?.clientId ?? null,
      duration: event.extendedProps?.duration ?? null,
      dateOnly: event.extendedProps?.date ?? undefined,
      startTime: event.extendedProps?.startTime ?? undefined,
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
      if (onRefreshBookings) {
        await onRefreshBookings();
      }
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
      if (onRefreshBookings) {
        await onRefreshBookings();
      }
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

  return (
    <>
      <div className="relative">
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
              onCancel={() => handleUpdateStatus("cancelled")}
              onDelete={canDelete ? handleDeleteSession : undefined}
              busy={sessionBusy}
            />
          </div>
        )}
        <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white dark:bg-slate-900">
          <thead>
            <tr className="border-b-2 border-slate-300 dark:border-slate-700">
              <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 p-3 text-left font-semibold text-slate-900 dark:text-white w-32">
                Время
              </th>
              {resources.map((arena) => (
                <th
                  key={arena.id}
                  className="bg-slate-100 dark:bg-slate-800 p-3 text-left font-semibold text-slate-900 dark:text-white min-w-48 border-l border-slate-300 dark:border-slate-700"
                >
                  {arena.name || arena.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot, idx) => (
              <tr
                key={timeSlot}
                className={`border-b border-slate-200 dark:border-slate-800 ${
                  idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-900/50"
                }`}
              >
                <td className="sticky left-0 z-10 bg-inherit p-3 font-semibold text-slate-700 dark:text-slate-300 text-sm w-32">
                  {timeSlot}
                </td>
                {resources.map((arena) => {
                  const slotEvents = getEventsForSlot(arena.id, timeSlot);
                  return (
                    <td
                      key={`${arena.id}-${timeSlot}`}
                      className="p-2 border-l border-slate-300 dark:border-slate-700 min-w-48 align-top"
                    >
                      {slotEvents.length > 0 ? (
                        <div className="space-y-1">
                          {slotEvents.map((event) => {
                            const status = (event.extendedProps?.status ?? event.status ?? "new") as string;
                            const meta = getStatusMeta(status);

                            return (
                              <div
                                key={event.id}
                                className="p-2 rounded text-xs border cursor-pointer hover:brightness-110"
                                style={{
                                  background: meta.bg,
                                  borderColor: meta.border,
                                  color: meta.text,
                                }}
                                onClick={(evt) => handleEventClick(event, evt.clientX, evt.clientY)}
                              >
                                <div className="flex items-center gap-2 font-semibold">
                                  <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ background: meta.dot }}
                                  />
                                  <span>{event.title}</span>
                                </div>
                                <div className="text-xs opacity-75">
                                  {event.start?.split("T")[1]?.substring(0, 5)} - {event.end?.split("T")[1]?.substring(0, 5)}
                                </div>
                                {event.extendedProps?.clientId && (
                                  <div className="text-[10px] uppercase tracking-wide opacity-80 mt-1">
                                    Синхронизирован
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <button
                            onClick={() => handleAddClick(arena.id, timeSlot, true)}
                            className="w-full text-center text-slate-400 dark:text-slate-500 text-xs py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors font-semibold hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            + Добавить ещё
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddClick(arena.id, timeSlot)}
                          className="w-full text-center text-slate-400 dark:text-slate-500 text-sm py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors font-semibold hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          + Добавить
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSlot && (
        <NewSessionModal
          open={modalOpen}
          arenaLabel={getArenaLabel(selectedSlot.arenaId)}
          dateLabel={selectedDate}
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
    </>
  );
}
