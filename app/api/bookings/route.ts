import { NextResponse } from "next/server";
import { directusFetchWithToken, directusFetch, DIRECTUS_TOKEN } from "@/lib/directus";
import { getValidToken } from "@/lib/auth";

const BOOKINGS_COLLECTION = "bookings";

// Field mapping (adjust to your Directus schema)
const FIELD_ID = "id";
const FIELD_DATE = "date"; // YYYY-MM-DD
const FIELD_START_TIME = "start_time"; // HH:mm or HH:mm:ss
const FIELD_END_TIME = ""; // optional, leave empty if not used
const FIELD_DURATION = "duration"; // hours or minutes
const FIELD_ARENA = "arena";
const FIELD_STATUS = "status";
const FIELD_GAME_NAME = "game.name";
const FIELD_CLIENT_NAME = "client.name";
const FIELD_GAME = "game";
const FIELD_CLIENT = "client";
const FIELD_MODE = "mode";
const FIELD_PLAYERS = "players";
const FIELD_COMMENT = "comment";
const FIELD_PRICE_TOTAL = "price_total";
const CLIENTS_COLLECTION = "clients";
const FIELD_CLIENT_PHONE = "phone";
const FIELD_CLIENT_NAME_VALUE = "name";
const FIELD_CLIENT_ARENA = "arena";

const DEFAULT_STATUS_VALUE = "new";

const DEFAULT_DURATION_MINUTES = 60;
// Set to match your Directus field type: "minutes" (recommended) or "hours".
const DURATION_UNIT: "minutes" | "hours" = "minutes";

function toStorageDuration(minutes: number) {
  return DURATION_UNIT === "hours" ? minutes / 60 : minutes;
}

const BOOKING_FIELDS = [
  FIELD_ID,
  FIELD_DATE,
  FIELD_START_TIME,
  FIELD_END_TIME,
  FIELD_DURATION,
  FIELD_STATUS,
  FIELD_ARENA,
  FIELD_CLIENT,
  FIELD_GAME_NAME,
  FIELD_CLIENT_NAME,
].filter(Boolean);

function getByPath(record: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc == null) return undefined;
    if (typeof acc === "object" && acc !== null) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, record);
}

function normalizeArenaId(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("id" in obj) {
      const id = obj.id;
      return typeof id === "string" || typeof id === "number" ? id : null;
    }
    return null;
  }
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function normalizePhone(value: unknown): string {
  if (!value) return "";
  const str = String(value).trim();
  if (!str) return "";
  return str;
}

async function findClientIdByPhone(token: string, phone: string): Promise<string | null> {
  const raw = normalizePhone(phone);
  if (!raw) return null;
  const normalized = raw.replace(/\D/g, "");
  const params = new URLSearchParams();
  if (normalized && normalized !== raw) {
    params.set(`filter[_or][0][${FIELD_CLIENT_PHONE}][_eq]`, raw);
    params.set(`filter[_or][1][${FIELD_CLIENT_PHONE}][_eq]`, normalized);
  } else {
    params.set(`filter[${FIELD_CLIENT_PHONE}][_eq]`, raw);
  }
  params.set("limit", "1");
  const fields = encodeURIComponent("id");
  const url = `/items/${CLIENTS_COLLECTION}?fields=${fields}&${params.toString()}`;
  type ClientResponse = { data?: Array<{ id?: string | number }> };
  try {
    const data = await directusFetchWithToken<ClientResponse>(token, url);
    const idValue = data?.data?.[0]?.id;
    return idValue != null ? String(idValue) : null;
  } catch (error) {
    console.log("[findClientIdByPhone] User token error:", error);
    // Fallback to service token on 403
    if (error && typeof error === 'object' && 'status' in error && error.status === 403 && DIRECTUS_TOKEN) {
      console.log("[findClientIdByPhone] Using service token fallback");
      const data = await directusFetch<ClientResponse>(url);
      const idValue = data?.data?.[0]?.id;
      return idValue != null ? String(idValue) : null;
    }
    throw error;
  }
}

async function createClient(token: string, payload: Record<string, unknown>): Promise<string | null> {
  type ClientCreateResponse = { data?: { id?: string | number }; id?: string | number };
  try {
    console.log("[createClient] Creating client:", JSON.stringify(payload));
    const created = await directusFetchWithToken<ClientCreateResponse>(token, `/items/${CLIENTS_COLLECTION}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const idValue = created?.data?.id ?? created?.id;
    console.log("[createClient] Created with user token, id:", idValue);
    return idValue != null ? String(idValue) : null;
  } catch (error) {
    console.log("[createClient] User token error:", error);
    // Fallback to service token on 403
    if (error && typeof error === 'object' && 'status' in error && error.status === 403 && DIRECTUS_TOKEN) {
      console.log("[createClient] Using service token fallback");
      const created = await directusFetch<ClientCreateResponse>(`/items/${CLIENTS_COLLECTION}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const idValue = created?.data?.id ?? created?.id;
      console.log("[createClient] Created with service token, id:", idValue);
      return idValue != null ? String(idValue) : null;
    }
    throw error;
  }
}

async function getUserToken(): Promise<string | null> {
  return getValidToken();
}

function toDateOnly(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseTimeParts(value: unknown): { hours: number; minutes: number; seconds: number } {
  if (typeof value !== "string" || value.trim() === "") {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  const parts = value.split(":").map((part) => Number(part));
  const hours = Number.isFinite(parts[0]) ? parts[0] : 0;
  const minutes = Number.isFinite(parts[1]) ? parts[1] : 0;
  const seconds = Number.isFinite(parts[2]) ? parts[2] : 0;
  return { hours, minutes, seconds };
}

function buildLocalDateTime(dateValue: unknown, timeValue: unknown): Date | null {
  const dateStr = toDateOnly(dateValue);
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map((part) => Number(part));
  if (![year, month, day].every((num) => Number.isFinite(num))) return null;
  const { hours, minutes, seconds } = parseTimeParts(timeValue);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function parseDurationMinutes(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return DURATION_UNIT === "hours" ? value * 60 : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      return DURATION_UNIT === "hours" ? numeric * 60 : numeric;
    }
    if (trimmed.includes(":")) {
      const parts = trimmed.split(":").map((part) => Number(part));
      const hours = Number.isFinite(parts[0]) ? parts[0] : 0;
      const minutes = Number.isFinite(parts[1]) ? parts[1] : 0;
      const seconds = Number.isFinite(parts[2]) ? parts[2] : 0;
      return hours * 60 + minutes + seconds / 60;
    }
  }
  return null;
}

function formatLocalDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

function parseNumber(value: unknown): number | null {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

interface CheckConflictsPayload {
  arena: string | number;
  date: string;
  start_time: string;
  durationMinutes: number;
  mode?: string | null;
}

async function checkTimeConflicts(
  token: string,
  payload: CheckConflictsPayload
) {
  const newMode = String(payload.mode ?? "private").toLowerCase();
  if (newMode === "open") return [];

  const params = new URLSearchParams();
  params.set(`filter[${FIELD_ARENA}][_eq]`, String(payload.arena));
  params.set(`filter[${FIELD_DATE}][_eq]`, payload.date);
  
  // Try with mode field first, fallback to basic fields on 403
  type BookingResponse = { data?: Array<Record<string, unknown>> };
  let existing: Array<Record<string, unknown>> = [];
  
  try {
    const fields = encodeURIComponent(
      [FIELD_ID, FIELD_START_TIME, FIELD_DURATION, FIELD_MODE].filter(Boolean).join(",")
    );
    const url = `/items/${BOOKINGS_COLLECTION}?fields=${fields}&${params.toString()}`;
    const data = await directusFetchWithToken<BookingResponse>(token, url);
    existing = data?.data ?? [];
  } catch (error) {
    // If 403, try without mode field
    if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
      console.log("[checkTimeConflicts] No permission for 'mode' field, using basic fields");
      const basicFields = encodeURIComponent(
        [FIELD_ID, FIELD_START_TIME, FIELD_DURATION].filter(Boolean).join(",")
      );
      const url = `/items/${BOOKINGS_COLLECTION}?fields=${basicFields}&${params.toString()}`;
      const data = await directusFetchWithToken<BookingResponse>(token, url);
      existing = data?.data ?? [];
    } else {
      throw error;
    }
  }

  const newStart = buildLocalDateTime(payload.date, payload.start_time);
  if (!newStart) return [];
  const newEnd = new Date(
    newStart.getTime() + payload.durationMinutes * 60 * 1000
  );

  return existing.filter((booking: Record<string, unknown>) => {
    const existingStart = buildLocalDateTime(
      booking?.[FIELD_DATE] ?? payload.date,
      booking?.[FIELD_START_TIME]
    );
    const existingDurationMinutes =
      parseDurationMinutes(booking?.[FIELD_DURATION]) ??
      DEFAULT_DURATION_MINUTES;
    if (!existingStart) return false;
    const existingEnd = new Date(
      existingStart.getTime() + existingDurationMinutes * 60 * 1000
    );
    const overlaps = newStart < existingEnd && newEnd > existingStart;
    return overlaps;
  });
}

export async function GET(req: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const arenaIds = searchParams.get("arenaIds");

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end are required" },
        { status: 400 }
      );
    }

    const startDate = toDateOnly(start);
    const endDate = toDateOnly(end);
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start and end must be valid dates" },
        { status: 400 }
      );
    }

    const filters = new URLSearchParams();
    filters.set(`filter[${FIELD_DATE}][_gte]`, startDate);
    filters.set(`filter[${FIELD_DATE}][_lt]`, endDate);
    if (arenaIds) filters.set(`filter[${FIELD_ARENA}][_in]`, arenaIds);

    const fields = encodeURIComponent(BOOKING_FIELDS.join(","));
    const url = `/items/${BOOKINGS_COLLECTION}?fields=${fields}&${filters.toString()}`;
    
    interface BookingData {
      id?: string | number;
      date?: string;
      start_time?: string;
      end_time?: string;
      duration?: string | number;
      arena?: unknown;
      client?: unknown;
      clientName?: string;
      gameName?: string;
      status?: string;
    }
    
    interface BookingsResponse {
      data?: BookingData[];
    }
    
    const data = await directusFetchWithToken<BookingsResponse>(token, url);

    const events = (data?.data ?? [])
      .map((booking: BookingData) => {
      const idValue = getByPath(booking, FIELD_ID) ?? booking?.id;
      const dateValue = getByPath(booking, FIELD_DATE);
      const startTimeValue = getByPath(booking, FIELD_START_TIME);
      const endTimeValue = FIELD_END_TIME
        ? getByPath(booking, FIELD_END_TIME)
        : null;
      const durationValue = getByPath(booking, FIELD_DURATION);
      const arenaValue = normalizeArenaId(getByPath(booking, FIELD_ARENA)) as string | number | null;
      const clientValue = normalizeArenaId(getByPath(booking, FIELD_CLIENT)) as string | number | null;
      const clientName = getByPath(booking, FIELD_CLIENT_NAME) as string | undefined;
      const gameName = getByPath(booking, FIELD_GAME_NAME) as string | undefined;
      const statusValue = getByPath(booking, FIELD_STATUS) as string | undefined;

      const startDateTime = buildLocalDateTime(dateValue, startTimeValue);
      let endDateTime = endTimeValue
        ? buildLocalDateTime(dateValue, endTimeValue)
        : null;

      if (!endDateTime && startDateTime) {
        const durationMinutes =
          parseDurationMinutes(durationValue) ?? DEFAULT_DURATION_MINUTES;
        endDateTime = new Date(
          startDateTime.getTime() + durationMinutes * 60 * 1000
        );
      }

      const baseEvent = {
        id: String(idValue),
        title: clientName
          ? String(clientName)
          : (gameName ? String(gameName) : `Booking ${idValue}`),
        start: startDateTime ? formatLocalDateTime(startDateTime) : null,
        end: endDateTime ? formatLocalDateTime(endDateTime) : null,
        extendedProps: {
          status: statusValue ?? null,
          clientName: clientName ?? null,
          clientId: clientValue ? String(clientValue) : null,
          gameName: gameName ?? null,
          date: dateValue ?? null,
          startTime: startTimeValue ?? null,
          duration: durationValue ?? null,
        },
      };

      if (!baseEvent.start || !baseEvent.end) return null;
      if (arenaValue == null) return baseEvent;
      return { ...baseEvent, resourceId: String(arenaValue) };
    })
      .filter(Boolean);

    return NextResponse.json(events);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("bookings route error:", message, error);
    const payload: Record<string, string> = {
      error: "Failed to load bookings. Check Directus settings.",
    };
    if (process.env.NODE_ENV !== "production") {
      payload.details = message;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log("[bookings POST] Starting...");
    const token = await getUserToken();
    console.log("[bookings POST] Token:", token ? "present" : "missing");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    console.log("[bookings POST] Body:", JSON.stringify(body, null, 2));
    
    const arena = body?.arena;
    const date = body?.date;
    const start_time = body?.start_time;
    if (!arena || !date || !start_time) {
      console.log("[bookings POST] Missing required fields:", { arena, date, start_time });
      return NextResponse.json(
        { error: "Необходимые поля отсутствуют" },
        { status: 400 }
      );
    }

    const durationMinutes =
      parseNumber(body?.durationMinutes) ??
      parseDurationMinutes(body?.duration) ??
      DEFAULT_DURATION_MINUTES;
    console.log("[bookings POST] Duration:", durationMinutes);

    console.log("[bookings POST] Checking conflicts...");
    const conflicts = await checkTimeConflicts(token, {
      arena,
      date,
      start_time,
      durationMinutes,
      mode: body?.mode,
    });
    console.log("[bookings POST] Conflicts found:", conflicts.length);
    
    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: "Конфликт времени", conflicts },
        { status: 409 }
      );
    }

    const payload: Record<string, unknown> = {
      [FIELD_ARENA]: arena,
      [FIELD_DATE]: date,
      [FIELD_START_TIME]: start_time,
      [FIELD_DURATION]: toStorageDuration(durationMinutes),
      [FIELD_STATUS]: (body as Record<string, unknown>)?.status ?? DEFAULT_STATUS_VALUE,
    };

    const bodyRecord = body as Record<string, unknown>;
    
    if (bodyRecord?.mode) payload[FIELD_MODE] = bodyRecord.mode;

    const playersValue =
      parseNumber(bodyRecord?.players) ??
      parseNumber(bodyRecord?.playersCount) ??
      parseNumber(bodyRecord?.playersCurrent) ??
      null;
    if (playersValue != null) payload[FIELD_PLAYERS] = playersValue;

    const priceValue = parseNumber(bodyRecord?.price);
    if (priceValue != null) payload[FIELD_PRICE_TOTAL] = priceValue;

    if (bodyRecord?.comment) payload[FIELD_COMMENT] = bodyRecord.comment;

    const gameValue = parseNumber(bodyRecord?.game);
    if (gameValue != null) payload[FIELD_GAME] = gameValue;
    
    // Client handling
    console.log("[bookings POST] Handling client...");
    let clientValue: string | number | null = parseNumber(bodyRecord?.client);
    if (clientValue == null) {
      const phone = normalizePhone(bodyRecord?.phone);
      console.log("[bookings POST] Phone:", phone);
      if (phone) {
        console.log("[bookings POST] Looking for client by phone...");
        const foundId = await findClientIdByPhone(token, phone);
        console.log("[bookings POST] Found client:", foundId);
        if (foundId) clientValue = foundId;
        if (clientValue == null) {
          console.log("[bookings POST] Creating new client...");
          const clientPayload: Record<string, unknown> = {
            [FIELD_CLIENT_PHONE]: phone,
            [FIELD_CLIENT_ARENA]: arena,
          };
          if (bodyRecord?.clientName) clientPayload[FIELD_CLIENT_NAME_VALUE] = bodyRecord.clientName;
          const createdId = await createClient(token, clientPayload);
          console.log("[bookings POST] Created client:", createdId);
          if (createdId) clientValue = createdId;
        }
      }
    }
    if (clientValue != null) payload[FIELD_CLIENT] = clientValue;

    console.log("[bookings POST] Creating booking with payload:", JSON.stringify(payload, null, 2));
    
    // Try with user token first, fallback to service token on 403
    let created;
    try {
      created = await directusFetchWithToken(token, `/items/${BOOKINGS_COLLECTION}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("[bookings POST] Created with user token");
    } catch (error) {
      console.log("[bookings POST] User token error:", error);
      // If 403 and service token available, retry with service token
      if (error && typeof error === 'object' && 'status' in error && error.status === 403 && DIRECTUS_TOKEN) {
        console.log("[bookings POST] Falling back to service token for booking creation");
        try {
          created = await directusFetch(`/items/${BOOKINGS_COLLECTION}`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
          console.log("[bookings POST] Created with service token");
        } catch (serviceError) {
          console.error("[bookings POST] Service token also failed:", serviceError);
          throw serviceError;
        }
      } else {
        throw error;
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("[bookings POST] Error:", message, error);
    const payload: Record<string, string> = {
      error: "Ошибка создания брони",
    };
    // Always show details for debugging
    payload.details = message;
    return NextResponse.json(payload, { status: 500 });
  }
}

