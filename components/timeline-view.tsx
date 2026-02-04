"use client";

import "@fullcalendar/core/index.css";
import "@fullcalendar/timegrid/index.css";
import "@fullcalendar/resource-timegrid/index.css";

import "../styles/fullcalendar/core.css";
import "../styles/fullcalendar/timegrid.css";
import "../styles/fullcalendar/resource-timegrid.css";

import FullCalendar from "@fullcalendar/react";
import type { RefObject } from "react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import type { CalEvent, CalEventExtended, ArenaResource } from "@/lib/types";
import { getStatusMeta } from "@/lib/types";

type TimelineViewProps = {
  calendarRef: RefObject<FullCalendar>;
  resources: ArenaResource[];
  events: CalEvent[];
  selectedDate: string;
  viewName: string;
  onDatesSet: (start: Date, end: Date) => void;
  onActiveDateChange?: (date: Date) => void;
  onSelectSlot: (payload: {
    start: Date | null;
    end: Date | null;
    resourceId: string | null;
    durationMinutes?: number;
  }) => void;
  onEventClick: (payload: {
    id: string;
    title: string;
    start: Date | null;
    end: Date | null;
    resourceId: string | null;
    extendedProps: CalEventExtended;
  }) => void;
};

function formatTime(value?: Date | null) {
  if (!value) return "--:--";
  const hh = String(value.getHours()).padStart(2, "0");
  const mm = String(value.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatTimeRange(start?: Date | null, end?: Date | null) {
  if (!start && !end) return "--:--";
  if (start && !end) return `${formatTime(start)} - --:--`;
  if (!start && end) return `--:-- - ${formatTime(end)}`;
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function deferTask(task: () => void) {
  if (typeof window === "undefined") {
    task();
    return;
  }
  if (typeof window.queueMicrotask === "function") {
    window.queueMicrotask(task);
  } else {
    window.setTimeout(task, 0);
  }
}

export default function TimelineView({
  calendarRef,
  resources,
  events,
  selectedDate,
  viewName,
  onDatesSet,
  onActiveDateChange,
  onSelectSlot,
  onEventClick,
}: TimelineViewProps) {
  const schedulerLicenseKey = process.env.NEXT_PUBLIC_FULLCALENDAR_LICENSE_KEY;

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[resourceTimeGridPlugin, interactionPlugin]}
      schedulerLicenseKey={schedulerLicenseKey || undefined}
      initialView={viewName}
      viewDidMount={(info) => {
        if (info.view?.calendar) {
          onActiveDateChange?.(info.view.calendar.getDate());
        }
      }}
      views={{
        resourceTimeGridThirty: { type: "resourceTimeGrid", duration: { days: 30 } },
      }}
      initialDate={selectedDate}
      height="100%"
      headerToolbar={false}
      nowIndicator={true}
      editable={true}
      selectable={true}
      allDaySlot={false}
      slotMinTime="10:00:00"
      slotMaxTime="23:00:00"
      slotDuration="00:15:00"
      slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
      eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
      resources={resources}
      events={events}
      resourceAreaWidth={140}
      resourceAreaHeaderContent="Арены"
      datesSet={(arg) => {
        deferTask(() => {
          onDatesSet(arg.start, arg.end);
          if (arg.view?.calendar) {
            onActiveDateChange?.(arg.view.calendar.getDate());
          }
        });
      }}
      select={(info) => {
        deferTask(() => {
          const start = info.start ?? null;
          const end = info.end ?? null;
          const minutes =
            start && end
              ? Math.max(10, Math.round((end.getTime() - start.getTime()) / 60000))
              : undefined;
          onSelectSlot({
            start,
            end,
            durationMinutes: minutes,
            resourceId: info.resource?.id ? String(info.resource.id) : null,
          });
        });
      }}
      eventClick={(info) => {
        const resourcesList = info.event.getResources?.() ?? [];
        const arenaId = resourcesList.length ? String(resourcesList[0].id) : null;
        deferTask(() => {
          onEventClick({
            id: String(info.event.id),
            title: info.event.title || "Без названия",
            start: info.event.start ?? null,
            end: info.event.end ?? null,
            resourceId: arenaId,
            extendedProps: info.event.extendedProps as CalEventExtended,
          });
        });
      }}
      eventDidMount={(info) => {
        const meta = getStatusMeta(info.event.extendedProps?.status as string);
        info.el.style.background = meta.bg;
        info.el.style.borderColor = meta.border;
        info.el.style.color = meta.text;
      }}
      eventContent={(arg) => {
        const meta = getStatusMeta(arg.event.extendedProps?.status as string);
        return (
          <div style={{ display: "grid", gap: 2, padding: "2px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: meta.dot,
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {arg.event.title}
              </span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              {formatTimeRange(arg.event.start, arg.event.end)}
            </div>
          </div>
        );
      }}
    />
  );
}
