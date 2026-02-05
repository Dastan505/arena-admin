import { NextResponse } from "next/server";
import { directusFetch, directusFetchWithToken } from "@/lib/directus";
import { getValidToken } from "@/lib/auth";

const COLLECTION = "games";

// Service token operations (for public GET)
// Пытаемся получить category, если поля нет - используем fallback
async function getGamesWithServiceToken() {
  try {
    return await directusFetch(`/items/${COLLECTION}?fields=id,name,category&sort=name`);
  } catch (err) {
    // Если 403 - поле category недоступно, запрашиваем без него
    console.warn("[games] Category field not available, fallback to id,name:", err);
    return await directusFetch(`/items/${COLLECTION}?fields=id,name&sort=name`);
  }
}

// User token operations (for protected operations)
async function getUserToken(): Promise<string | null> {
  return getValidToken();
}

interface GamesResponse {
  data?: unknown[];
}

export async function GET() {
  try {
    let data: GamesResponse | null = null;
    try {
      data = await getGamesWithServiceToken() as GamesResponse;
    } catch (err) {
      console.warn("/api/games GET fallback to id,name:", err);
      data = await directusFetch(`/items/${COLLECTION}?fields=id,name&sort=name`) as GamesResponse;
    }
    interface GameItem {
      id: string | number;
      name: string;
      category?: string | null;
    }
    
    const items = (data?.data ?? []).map((it: unknown) => {
      const game = it as GameItem;
      return {
        id: String(game.id),
        name: game.name,
        category: game.category ?? null,
      };
    });
    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/games GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body?.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid name" }, { status: 400 });
    }

    const payload: Record<string, unknown> = { name: body.name.trim() };
    if (body?.category && typeof body.category === "string") {
      payload.category = body.category.trim();
    }

    const res = await directusFetchWithToken(token, `/items/${COLLECTION}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(res, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/games POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body?.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    if (!body?.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid name" }, { status: 400 });
    }

    const payload: Record<string, unknown> = { name: body.name.trim() };
    if (body?.category !== undefined) {
      payload.category = body.category === null ? null : String(body.category).trim();
    }

    const res = await directusFetchWithToken(token, `/items/${COLLECTION}/${body.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/games PATCH error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await directusFetchWithToken(token, `/items/${COLLECTION}/${id}`, { method: "DELETE" });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/games DELETE error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
