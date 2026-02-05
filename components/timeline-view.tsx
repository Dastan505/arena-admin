"use client";

import { useMemo, useState } from "react";
import type { ArenaResource, CalEvent } from "@/lib/types";
import { getStatusMeta } from "@/lib/types";
import { Plus } from "lucide-react";

interface TimelineViewProps {
  selectedDate: string;
  resources: ArenaResource[];
  events: CalEvent[];
  onEventClick?: (event: CalEvent, clientX?: number, clientY?: number) => void;
  onSlotClick?: (arenaId: string, time: string) => void;
}

// Configuration
const START_HOUR = 7;
const END_HOUR = 23;
const PIXELS_PER_HOUR = 80;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

export default function TimelineView({
  selectedDate,
  resources,
  events,
  onEventClick,
  onSlotClick,
}: TimelineViewProps) {
  const [hoveredSlot, setHoveredSlot] = useState<{arenaId: string, time: string} | null>(null);

  // Generate time slots (every 30 minutes)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
      if (hour < END_HOUR) {
        slots.push(`${String(hour).padStart(2, "0")}:30`);
      }
    }
    return slots;
  }, []);

  const totalHeight = (END_HOUR - START_HOUR + 1) * PIXELS_PER_HOUR;

  const getArenaEvents = (arenaId: string) => {
    return events.filter((event) => {
      if (!event.start) return false;
      const eventDate = event.start.split("T")[0];
      if (eventDate !== selectedDate) return false;
      return event.resourceId === arenaId || event.arenaId === arenaId;
    });
  };

  const getEventStyle = (event: CalEvent) => {
    if (!event.start || !event.end) return { display: "none" };

    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
    const durationMinutes = endMinutes - startMinutes;

    const top = (startMinutes - START_HOUR * 60) * PIXELS_PER_MINUTE;
    const height = Math.max(durationMinutes * PIXELS_PER_MINUTE, 30); // Min height 30px

    return {
      top: `${top}px`,
      height: `${height}px`,
      position: "absolute" as const,
      left: "8px",
      right: "8px",
      zIndex: 10,
    };
  };

  const handleSlotClick = (arenaId: string, hour: number, minute: number = 0) => {
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onSlotClick?.(arenaId, time);
  };

  // Check if slot has an event
  const hasEventAtSlot = (arenaId: string, hour: number, minute: number) => {
    const slotTime = hour * 60 + minute;
    return getArenaEvents(arenaId).some(event => {
      if (!event.start || !event.end) return false;
      const start = new Date(event.start);
      const end = new Date(event.end);
      const eventStart = start.getHours() * 60 + start.getMinutes();
      const eventEnd = end.getHours() * 60 + end.getMinutes();
      return slotTime >= eventStart && slotTime < eventEnd;
    });
  };

  return (
    <div className="flex h-full overflow-auto bg-slate-900">
      {/* Time column */}
      <div className="sticky left-0 z-20 w-16 flex-shrink-0 bg-slate-800 border-r border-slate-700">
        {timeSlots.map((time) => (
          <div
            key={time}
            className="flex items-start justify-end pr-2 text-xs border-b border-slate-700/50"
            style={{ height: `${PIXELS_PER_HOUR / 2}px` }}
          >
            {time.endsWith(":00") ? (
              <span className="font-medium text-slate-300">{time}</span>
            ) : (
              <span className="text-slate-500 text-[10px]">{time.split(':')[1]}</span>
            )}
          </div>
        ))}
      </div>

      {/* Arena columns */}
      <div className="flex flex-1">
        {resources.map((arena) => (
          <div
            key={arena.id}
            className="flex-1 min-w-[280px] border-r border-slate-700 relative"
            style={{ height: `${totalHeight}px` }}
          >
            {/* Arena header */}
            <div className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700 p-3 text-sm font-semibold text-white text-center shadow-md">
              {arena.name || arena.title}
            </div>

            {/* Time grid lines with click handlers */}
            {timeSlots.map((time, index) => {
              const hour = Math.floor(START_HOUR + index / 2);
              const minute = (index % 2) * 30;
              const hasEvent = hasEventAtSlot(arena.id, hour, minute);
              const isHovered = hoveredSlot?.arenaId === arena.id && hoveredSlot?.time === `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
              
              return (
                <div
                  key={time}
                  className={`relative border-b transition-colors cursor-pointer group
                    ${time.endsWith(":00") ? "border-slate-600" : "border-slate-700/30"}
                    ${!hasEvent ? "hover:bg-slate-800/50" : ""}
                  `}
                  style={{ height: `${PIXELS_PER_HOUR / 2}px` }}
                  onClick={() => !hasEvent && handleSlotClick(arena.id, hour, minute)}
                  onMouseEnter={() => setHoveredSlot({arenaId: arena.id, time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`})}
                  onMouseLeave={() => setHoveredSlot(null)}
                >
                  {/* Add button on hover */}
                  {!hasEvent && isHovered && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-full shadow-lg transition-all">
                        <Plus size={14} />
                        <span>Добавить</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Small + indicator always visible on hover */}
                  {!hasEvent && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center">
                        <Plus size={12} className="text-blue-400" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Events */}
            {getArenaEvents(arena.id).map((event) => {
              const status = (event.extendedProps?.status ?? event.status ?? "new") as string;
              const meta = getStatusMeta(status);
              const eventStyle = getEventStyle(event);

              return (
                <div
                  key={event.id}
                  className="rounded-lg border-2 p-3 cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg overflow-hidden flex flex-col"
                  style={{
                    ...eventStyle,
                    background: meta.bg,
                    borderColor: meta.border,
                    color: meta.text,
                  }}
                  onClick={(e) => onEventClick?.(event, e.clientX, e.clientY)}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
                    <span className="truncate">{event.title || "Без названия"}</span>
                  </div>
                  
                  <div className="text-xs opacity-90 mt-1 font-medium">
                    {event.start?.split("T")[1]?.substring(0, 5)} - {event.end?.split("T")[1]?.substring(0, 5)}
                  </div>
                  
                  {event.extendedProps?.gameName && (
                    <div className="text-xs opacity-75 mt-auto pt-1 truncate">
                      {event.extendedProps.gameName}
                    </div>
                  )}
                  
                  {event.extendedProps?.clientName && (
                    <div className="text-[10px] opacity-60 truncate">
                      {event.extendedProps.clientName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
