import { NextResponse } from "next/server";
import { directusFetch, directusFetchWithToken, DIRECTUS_TOKEN } from "@/lib/directus";
import { getValidToken } from "@/lib/auth";

const COLLECTION = "games";

// Service token operations (for public GET)
async function getGamesWithServiceToken() {
  try {
    return await directusFetch(`/items/${COLLECTION}?fields=id,name,category,price_per_player&sort=name`);
  } catch (err) {
    console.warn("[games] Service token failed:", err);
    throw err;
  }
}

// User token operations
async function getUserToken(): Promise<string | null> {
  return getValidToken();
}

interface GamesResponse {
  data?: unknown[];
}

export async function GET() {
  try {
    let data: GamesResponse | null = null;
    
    // Try user token first (it's more reliable)
    const userToken = await getUserToken();
    if (userToken) {
      try {
        data = await directusFetchWithToken(userToken, `/items/${COLLECTION}?fields=id,name,category,price_per_player&sort=name`) as GamesResponse;
      } catch (userErr) {
        console.warn("[games] User token failed:", userErr);
        // Try without price_per_player
        try {
          data = await directusFetchWithToken(userToken, `/items/${COLLECTION}?fields=id,name,category&sort=name`) as GamesResponse;
        } catch (e) {
          // Try basic fields only
          data = await directusFetchWithToken(userToken, `/items/${COLLECTION}?fields=id,name&sort=name`) as GamesResponse;
        }
      }
    }
    
    // Fallback to service token if user token not available or failed
    if (!data && DIRECTUS_TOKEN) {
      try {
        data = await getGamesWithServiceToken() as GamesResponse;
      } catch (serviceErr) {
        console.warn("[games] Service token also failed:", serviceErr);
      }
    }
    
    if (!data) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    interface GameItem {
      id: string | number;
      name: string;
      category?: string | null;
      price_per_player?: number | null;
    }
    
    const items = (data?.data ?? []).map((it: unknown) => {
      const game = it as GameItem;
      return {
        id: String(game.id),
        name: game.name,
        category: game.category ?? null,
        price_per_player: game.price_per_player ?? null,
      };
    });

    console.log(`[games GET] Returning ${items.length} games with prices:`, 
      items.map(g => `${g.name}=${g.price_per_player}`).join(', '));

    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[games GET] Error:", message);
    return NextResponse.json({ error: "Failed to load games", details: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const payload: Record<string, unknown> = {
      name: body.name?.trim(),
    };

    if (body?.category !== undefined) {
      payload.category = body.category.trim();
    }
    if (body?.price_per_player !== undefined) {
      payload.price_per_player = Number(body.price_per_player) || null;
    }

    // Try user token first, fallback to service token on 403
    let created;
    try {
      created = await directusFetchWithToken(token, `/items/${COLLECTION}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 403 && DIRECTUS_TOKEN) {
        console.log("[games POST] User token 403, using service token");
        created = await directusFetch(`/items/${COLLECTION}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[games POST] Error:", message);
    return NextResponse.json({ error: "Failed to create game", details: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {};
    if (body?.name !== undefined) payload.name = body.name.trim();
    if (body?.category !== undefined) payload.category = body.category?.trim() || null;
    if (body?.price_per_player !== undefined) {
      payload.price_per_player = body.price_per_player ? Number(body.price_per_player) : null;
    }

    // Try user token first, fallback to service token on 403
    let result;
    try {
      result = await directusFetchWithToken(token, `/items/${COLLECTION}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 403 && DIRECTUS_TOKEN) {
        console.log("[games PATCH] User token 403, using service token");
        result = await directusFetch(`/items/${COLLECTION}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[games PATCH] Error:", message);
    return NextResponse.json({ error: "Failed to update game", details: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const token = await getUserToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Try user token first, fallback to service token on 403
    try {
      await directusFetchWithToken(token, `/items/${COLLECTION}/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 403 && DIRECTUS_TOKEN) {
        console.log("[games DELETE] User token 403, using service token");
        await directusFetch(`/items/${COLLECTION}/${id}`, {
          method: "DELETE",
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[games DELETE] Error:", message);
    return NextResponse.json({ error: "Failed to delete game", details: message }, { status: 500 });
  }
}
