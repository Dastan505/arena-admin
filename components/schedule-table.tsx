"use client";

import { useEffect, useState } from "react";
import type { ArenaResource, CalEvent, GameOption, NewSessionDraft } from "@/lib/types";
import { getStatusMeta } from "@/lib/types";
import NewSessionModal from "./new-session-modal";

type ScheduleTableProps = {
  selectedDate: string;
  resources: ArenaResource[];
  events: CalEvent[];
  onRefreshBookings?: () => Promise<void>;
};

export default function ScheduleTable({ 
  selectedDate,
  resources,
  events,
  onRefreshBookings,
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

  // Get events for selected date and arena
  const getEventsForSlot = (arenaId: string, startTime: string) => {
    return events.filter((event) => {
      if (!event.start) return false;
      const eventDate = event.start.split("T")[0];
      if (eventDate !== selectedDate) return false;

      const eventTime = event.start.split("T")[1]?.substring(0, 5);
      return eventTime === startTime && (event.resourceId === arenaId || event.arenaId === arenaId);
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

      const payload: Record<string, any> = {
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

  const getArenaLabel = () => {
    const arena = resources.find((r) => r.id === selectedSlot?.arenaId);
    return arena?.name || arena?.title || "";
  };

  return (
    <>
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
                <td className="sticky left-0 z-9 bg-inherit p-3 font-semibold text-slate-700 dark:text-slate-300 text-sm w-32">
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
                                className="p-2 rounded text-xs border"
                                style={{
                                  background: meta.bg,
                                  borderColor: meta.border,
                                  color: meta.text,
                                }}
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

      {/* Booking Modal */}
      {selectedSlot && (
        <NewSessionModal
          open={modalOpen}
          arenaLabel={getArenaLabel()}
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
