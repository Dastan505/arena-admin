"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ArenaResource, CalEvent } from "@/lib/types";
import ScheduleTable from "@/components/schedule-table";
import SettingsDashboard from "@/components/settings-dashboard";
import { Loader, ChevronLeft, ChevronRight } from "lucide-react";

export default function HomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams?.get("view") || "schedule";
  const [resources, setResources] = useState<ArenaResource[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openSettings = () => router.push("/?view=settings");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load arenas
        const arenasRes = await fetch("/api/arenas");
        if (!arenasRes.ok) throw new Error("Failed to load arenas");
        const arenas = await arenasRes.json();
        setResources(arenas);

        // Load bookings with date range
        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        endDate.setHours(23, 59, 59, 999);

        const formatDate = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };

        const bookingsRes = await fetch(
          `/api/bookings?start=${formatDate(startDate)}&end=${formatDate(endDate)}`
        );
        if (!bookingsRes.ok) throw new Error("Failed to load bookings");
        const bookings = await bookingsRes.json();
        const bookingsArray = Array.isArray(bookings) ? bookings : (bookings?.bookings ?? []);
        setEvents(bookingsArray);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Failed to load data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
      const today = new Date();
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);
      endDate.setHours(23, 59, 59, 999);

      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const bookingsRes = await fetch(
        `/api/bookings?start=${formatDate(startDate)}&end=${formatDate(endDate)}`
      );
      if (!bookingsRes.ok) throw new Error("Failed to load bookings");
      const bookings = await bookingsRes.json();
      const bookingsArray = Array.isArray(bookings) ? bookings : (bookings?.bookings ?? []);
      setEvents(bookingsArray);
    } catch (err) {
      console.error("Failed to refresh events:", err);
    }
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
              {generateCalendarDays().map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => day && handleDateSelect(day)}
                  className={`h-6 text-xs rounded transition-all ${
                    day ? (
                      selectedDate === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        ? "bg-blue-600 text-white font-semibold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    ) : ""
                  }`}
                  disabled={!day}
                >
                  {day}
                </button>
              ))}
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

          {/* Arenas Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Арены
              </h3>
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                {resources.length}
              </span>
            </div>
            
            {isLoading ? (
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
                  {resources.length} арен • {events.filter((e) => e.start?.startsWith(selectedDate)).length} бронирован
                </p>
              </div>

              {isLoading ? (
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
                    resources={resources}
                    events={events}
                    onRefreshBookings={refreshEvents}
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
