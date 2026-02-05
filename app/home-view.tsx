"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ArenaResource, CalEvent } from "@/lib/types";
import ScheduleTable from "@/components/schedule-table";
import SettingsDashboard from "@/components/settings-dashboard";
import { Loader, ChevronLeft, ChevronRight } from "lucide-react";
import UserBadge from "@/components/user-badge";

// Utility functions - defined outside component to avoid recreating on every render
const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const buildBookingsUrl = (startDate: Date, endDate: Date, arenaId: string) => {
  const base = `/api/bookings?start=${formatDate(startDate)}&end=${formatDate(endDate)}`;
  if (arenaId) {
    return `${base}&arenaIds=${encodeURIComponent(arenaId)}`;
  }
  return base;
};

export default function HomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams?.get("view") || "schedule";
  const STORAGE_KEY = "arenaAdmin.selectedArenaId";
  const [resources, setResources] = useState<ArenaResource[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selectedArenaId, setSelectedArenaId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    formatDate(new Date())
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [arenasLoading, setArenasLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openSettings = () => router.push("/?view=settings");

  useEffect(() => {
    const loadArenas = async () => {
      try {
        setArenasLoading(true);
        setError(null);
        console.log("[home-view] Loading arenas...");
        const arenasRes = await fetch("/api/arenas");
        console.log("[home-view] Arenas response status:", arenasRes.status);
        
        if (!arenasRes.ok) {
          const errData = await arenasRes.json().catch(() => ({ error: "Unknown error" }));
          console.error("[home-view] Arenas error:", errData);
          if (arenasRes.status === 401) {
            console.log("[home-view] Unauthorized, redirecting to login");
            router.push("/login");
            return;
          }
          throw new Error(errData.error || errData.details || `HTTP ${arenasRes.status}`);
        }
        
        const arenas = await arenasRes.json();
        console.log("[home-view] Arenas loaded:", arenas.length);
        setResources(Array.isArray(arenas) ? arenas : []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load arenas";
        console.error("[home-view] Failed to load arenas:", err);
        setError(message);
        setResources([]);
      } finally {
        setArenasLoading(false);
      }
    };

    loadArenas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize selected arena only once when arenas are loaded
  useEffect(() => {
    if (arenasLoading) return;
    if (!resources.length) return;
    // Only set if no arena is selected yet
    if (selectedArenaId) return;
    
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    const exists = stored && resources.some((arena) => arena.id === stored);
    const nextId = exists ? stored! : resources[0].id;
    if (nextId) {
      setSelectedArenaId(nextId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenasLoading, resources]);

  useEffect(() => {
    if (!selectedArenaId) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedArenaId);
    } catch {
      // ignore storage errors
    }
  }, [selectedArenaId]);

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
    const loadEvents = async () => {
      if (!selectedArenaId) {
        setEventsLoading(false);
        return;
      }
      try {
        setEventsLoading(true);
        setError(null);

        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        endDate.setHours(23, 59, 59, 999);

        const bookingsRes = await fetch(
          buildBookingsUrl(startDate, endDate, selectedArenaId)
        );
        if (!bookingsRes.ok) throw new Error("Failed to load bookings");
        const bookings = await bookingsRes.json();
        const bookingsArray = Array.isArray(bookings) ? bookings : (bookings?.bookings ?? []);
        setEvents(bookingsArray);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Failed to load bookings:", err);
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, [selectedArenaId]);

  // Mini Calendar Helper Functions
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    // Switch back to schedule view when selecting a date
    router.push("/");
  };

  const refreshEvents = async () => {
    try {
      if (!selectedArenaId) return;
      const today = new Date();
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);
      endDate.setHours(23, 59, 59, 999);

      const bookingsRes = await fetch(
        buildBookingsUrl(startDate, endDate, selectedArenaId)
      );
      if (!bookingsRes.ok) throw new Error("Failed to load bookings");
      const bookings = await bookingsRes.json();
      const bookingsArray = Array.isArray(bookings) ? bookings : (bookings?.bookings ?? []);
      setEvents(bookingsArray);
    } catch (err) {
      console.error("Failed to refresh events:", err);
    }
  };

  const filteredResources =
    selectedArenaId
      ? resources.filter((arena) => arena.id === selectedArenaId)
      : resources;

  const { occupancyByDay } = useMemo(() => {
    const usedSlots: Record<number, number> = {};
    const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
    const slotsPerDay = 16; // 07:00 - 22:00 (16 слотов по часу)
    const arenasCount = Math.max(filteredResources.length, 0);
    const capacity = arenasCount * slotsPerDay;

    for (const event of events) {
      const dateStr = event.start?.split("T")[0];
      if (!dateStr || !dateStr.startsWith(monthKey)) continue;
      const day = Number(dateStr.split("-")[2]);
      if (!Number.isFinite(day)) continue;

      const start = event.start ? new Date(event.start) : null;
      const end = event.end ? new Date(event.end) : null;
      const minutes =
        start && end
          ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
          : 60;
      const slotUnits = Math.max(1, Math.ceil(minutes / 60));

      usedSlots[day] = (usedSlots[day] || 0) + slotUnits;
    }

    const occupancy: Record<number, number> = {};
    Object.keys(usedSlots).forEach((dayKey) => {
      const day = Number(dayKey);
      if (!Number.isFinite(day)) return;
      occupancy[day] = capacity > 0 ? Math.min(1, usedSlots[day] / capacity) : 0;
    });

    return { occupancyByDay: occupancy };
  }, [events, currentMonth, filteredResources.length]);

  const getDayRingClass = (ratio: number) => {
    if (!ratio || ratio <= 0) return "";
    if (ratio <= 0.2) return "ring-2 ring-emerald-400/70";
    if (ratio <= 0.5) return "ring-2 ring-yellow-400/70";
    if (ratio <= 0.8) return "ring-2 ring-orange-400/70";
    return "ring-2 ring-red-500/70";
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Left Sidebar */}
      <div className="w-72 border-r border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Arena Admin</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Управление</p>
          <div className="mt-4">
            <label className="block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Филиал / Арена
            </label>
            <select
              value={selectedArenaId}
              onChange={(event) => setSelectedArenaId(event.target.value)}
              disabled={arenasLoading || resources.length === 0}
              className="w-full rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              {arenasLoading && <option value="">Загрузка...</option>}
              {!arenasLoading && resources.length === 0 && (
                <option value="">Филиалов нет</option>
              )}
              {!arenasLoading &&
                resources.map((arena) => (
                  <option key={arena.id} value={arena.id}>
                    {arena.name || arena.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <button onClick={goToPreviousMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button onClick={goToNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            
            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-xs font-semibold text-center text-slate-600 dark:text-slate-400 h-6">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((day, idx) => {
                const ratio = day ? occupancyByDay[day] || 0 : 0;
                const ringClass = getDayRingClass(ratio);
                const isSelected =
                  day &&
                  selectedDate ===
                    `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                return (
                  <button
                    key={idx}
                    onClick={() => day && handleDateSelect(day)}
                    className={`h-6 text-xs rounded transition-all ${ringClass} ring-offset-1 ring-offset-white dark:ring-offset-slate-800 ${
                      day
                        ? isSelected
                          ? "bg-blue-600 text-white font-semibold"
                          : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        : ""
                    }`}
                    disabled={!day}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Settings Button */}
          <button
            onClick={openSettings}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow-md mb-6"
          >
            Настройки
          </button>

        </div>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
          <UserBadge />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === "settings" ? (
            <SettingsDashboard />
          ) : (
            <>
              {/* Schedule/Timeline for selected date */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {new Date(selectedDate).toLocaleDateString("ru-RU", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {filteredResources.length} арен • {events.filter((e) => e.start?.startsWith(selectedDate)).length} бронирован
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                  Ошибка загрузки бронирований: {error}
                </div>
              )}

              {eventsLoading ? (
                <div className="flex flex-col items-center justify-center min-h-96 gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-75 animate-pulse"></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-full p-8">
                      <Loader className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-auto">
                  <ScheduleTable
                    selectedDate={selectedDate}
                    resources={filteredResources}
                    events={events}
                    onRefreshBookings={refreshEvents}
                    canDelete={canDelete}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
