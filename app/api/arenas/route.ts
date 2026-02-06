import { NextResponse } from "next/server";
import { directusFetchWithToken, DIRECTUS_URL } from "@/lib/directus";
import { getValidToken } from "@/lib/auth";

const ARENAS_COLLECTION = "arenas";
const ARENA_ID_FIELD = "id";
const ARENA_TITLE_FIELD = "name";
const ARENA_ADDRESS_FIELD = "address";
const ARENA_CAPACITY_FIELD = "capacity";
const ARENA_SORT_FIELD = ARENA_TITLE_FIELD;

const ROLE_ALLOWLIST = ["admin", "director", "owner", "директор", "управля"];

function canManage(roleName: string | null | undefined) {
  if (!roleName) return false;
  const role = roleName.toLowerCase();
  return ROLE_ALLOWLIST.some((needle) => role.includes(needle));
}

// Use getValidToken from lib/auth for automatic refresh
async function getUserToken(): Promise<string | null> {
  return getValidToken();
}

async function getRoleNameFromToken(token: string | null) {
  if (!token || !DIRECTUS_URL) return null;
  const res = await fetch(`${DIRECTUS_URL}/users/me?fields=role.name`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.role?.name ?? null;
}

interface ArenaData {
  id?: string | number;
  name?: string;
  title?: string;
  address?: string | null;
  capacity?: number | null;
}

interface ArenasResponse {
  data?: ArenaData[];
}

export async function GET() {
  try {
    const token = await getUserToken();
    if (!token) {
      console.error("[arenas GET] No user token in cookies");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("[arenas GET] Token exists, DIRECTUS_URL:", DIRECTUS_URL ? "configured" : "MISSING");
    let data: ArenasResponse | null = null;
    try {
      const fields = [ARENA_ID_FIELD, ARENA_TITLE_FIELD, ARENA_ADDRESS_FIELD, ARENA_CAPACITY_FIELD].join(",");
      const url = `/items/${ARENAS_COLLECTION}?fields=${fields}&sort=${ARENA_SORT_FIELD}`;
      console.log("[arenas GET] Fetching from Directus:", url);
      data = await directusFetchWithToken<ArenasResponse>(token, url);
      console.log("[arenas GET] Data received, count:", data?.data?.length ?? 0);
    } catch (err) {
      console.warn("[arenas GET] Primary fetch failed, trying fallback:", err);
      const fields = [ARENA_ID_FIELD, ARENA_TITLE_FIELD, ARENA_CAPACITY_FIELD].join(",");
      const url = `/items/${ARENAS_COLLECTION}?fields=${fields}&sort=${ARENA_SORT_FIELD}`;
      data = await directusFetchWithToken<ArenasResponse>(token, url);
    }

    const arenas = (data?.data ?? []).map((arena: ArenaData) => ({
      id: String(arena?.[ARENA_ID_FIELD as keyof ArenaData]),
      title: arena?.[ARENA_TITLE_FIELD as keyof ArenaData] ?? `Arena ${arena?.[ARENA_ID_FIELD as keyof ArenaData]}`,
      name: arena?.[ARENA_TITLE_FIELD as keyof ArenaData] ?? null,
      address: arena?.[ARENA_ADDRESS_FIELD as keyof ArenaData] ?? null,
      capacity: (() => {
        const raw = arena?.[ARENA_CAPACITY_FIELD as keyof ArenaData];
        const numeric = typeof raw === "number" ? raw : Number(raw);
        return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : null;
      })(),
    }));

    return NextResponse.json(arenas);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    const stack = error instanceof Error ? error.stack : "";
    console.error("[arenas GET] Error:", message);
    console.error("[arenas GET] Stack:", stack);
    
    const payload: Record<string, string> = {
      error: "Failed to load arenas. Check Directus settings.",
      details: message,
    };
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roleName = await getRoleNameFromToken(token);
    if (!roleName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManage(roleName)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const bodyRecord = body as Record<string, unknown>;
    const name = String(bodyRecord?.name ?? "").trim();
    const address = String(bodyRecord?.address ?? "").trim();
    const capacityRaw = bodyRecord?.capacity;
    const capacityNum = typeof capacityRaw === "number" ? capacityRaw : Number(capacityRaw);
    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }
    const payload: Record<string, unknown> = {
      [ARENA_TITLE_FIELD]: name,
    };
    if (address) payload[ARENA_ADDRESS_FIELD] = address;
    if (Number.isFinite(capacityNum) && capacityNum > 0) {
      payload[ARENA_CAPACITY_FIELD] = Math.floor(capacityNum);
    }

    const created = await directusFetchWithToken(token, `/items/${ARENAS_COLLECTION}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("arenas route POST error:", message, error);
    return NextResponse.json({ error: "Failed to create arena" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roleName = await getRoleNameFromToken(token);
    if (!roleName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManage(roleName)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const bodyRecord = body as Record<string, unknown>;
    const id = bodyRecord?.id;
    const name = String(bodyRecord?.name ?? "").trim();
    const address = String(bodyRecord?.address ?? "").trim();
    const capacityRaw = bodyRecord?.capacity;
    const capacityNum = typeof capacityRaw === "number" ? capacityRaw : Number(capacityRaw);
    if (!id || !name) {
      return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      [ARENA_TITLE_FIELD]: name,
    };
    payload[ARENA_ADDRESS_FIELD] = address || null;
    if (Number.isFinite(capacityNum) && capacityNum > 0) {
      payload[ARENA_CAPACITY_FIELD] = Math.floor(capacityNum);
    } else {
      payload[ARENA_CAPACITY_FIELD] = null;
    }

    const updated = await directusFetchWithToken(token, `/items/${ARENAS_COLLECTION}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("arenas route PATCH error:", message, error);
    return NextResponse.json({ error: "Failed to update arena" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roleName = await getRoleNameFromToken(token);
    if (!roleName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManage(roleName)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const deleted = await directusFetchWithToken(token, `/items/${ARENAS_COLLECTION}/${id}`, {
      method: "DELETE",
    });
    return NextResponse.json(deleted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("arenas route DELETE error:", message, error);
    return NextResponse.json({ error: "Failed to delete arena" }, { status: 500 });
  }
}
