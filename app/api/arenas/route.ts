import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { directusFetchWithToken, DIRECTUS_URL } from "@/lib/directus";

const ARENAS_COLLECTION = "arenas";
const ARENA_ID_FIELD = "id";
const ARENA_TITLE_FIELD = "name";
const ARENA_ADDRESS_FIELD = "address";
const ARENA_SORT_FIELD = ARENA_TITLE_FIELD;

const ROLE_ALLOWLIST = ["admin", "director", "owner", "директор", "управля"];

function canManage(roleName: string | null | undefined) {
  if (!roleName) return false;
  const role = roleName.toLowerCase();
  return ROLE_ALLOWLIST.some((needle) => role.includes(needle));
}

async function getUserToken() {
  const store = await cookies();
  return store.get("da_access_token")?.value ?? null;
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

export async function GET() {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let data: any = null;
    try {
      const fields = [ARENA_ID_FIELD, ARENA_TITLE_FIELD, ARENA_ADDRESS_FIELD].join(",");
      data = await directusFetchWithToken(
        token,
        `/items/${ARENAS_COLLECTION}?fields=${fields}&sort=${ARENA_SORT_FIELD}`
      );
    } catch (err) {
      console.warn("arenas GET fallback to id,name:", err);
      const fields = [ARENA_ID_FIELD, ARENA_TITLE_FIELD].join(",");
      data = await directusFetchWithToken(
        token,
        `/items/${ARENAS_COLLECTION}?fields=${fields}&sort=${ARENA_SORT_FIELD}`
      );
    }

    const arenas = (data?.data ?? []).map((arena: any) => ({
      id: String(arena?.[ARENA_ID_FIELD]),
      title: arena?.[ARENA_TITLE_FIELD] ?? `Arena ${arena?.[ARENA_ID_FIELD]}`,
      name: arena?.[ARENA_TITLE_FIELD] ?? null,
      address: arena?.[ARENA_ADDRESS_FIELD] ?? null,
    }));

    return NextResponse.json(arenas);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("arenas route error:", message, error);
    const payload: Record<string, string> = {
      error: "Failed to load arenas. Check Directus settings.",
    };
    if (process.env.NODE_ENV !== "production") {
      payload.details = message;
    }
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
    const name = String(body?.name ?? "").trim();
    const address = String(body?.address ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }
    const payload: Record<string, any> = {
      [ARENA_TITLE_FIELD]: name,
    };
    if (address) payload[ARENA_ADDRESS_FIELD] = address;

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
    const id = body?.id;
    const name = String(body?.name ?? "").trim();
    const address = String(body?.address ?? "").trim();
    if (!id || !name) {
      return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
    }

    const payload: Record<string, any> = {
      [ARENA_TITLE_FIELD]: name,
    };
    payload[ARENA_ADDRESS_FIELD] = address || null;

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
