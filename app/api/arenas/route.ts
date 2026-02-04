import { NextResponse } from "next/server";
import { directusFetch } from "@/lib/directus";

const ARENAS_COLLECTION = "arenas";
const ARENA_ID_FIELD = "id";
const ARENA_TITLE_FIELD = "name";
const ARENA_SORT_FIELD = ARENA_TITLE_FIELD;

export async function GET() {
  try {
    const fields = [ARENA_ID_FIELD, ARENA_TITLE_FIELD].join(",");
    const data = await directusFetch(
      `/items/${ARENAS_COLLECTION}?fields=${fields}&sort=${ARENA_SORT_FIELD}`
    );

    const arenas = (data?.data ?? []).map((arena: any) => ({
      id: String(arena?.[ARENA_ID_FIELD]),
      title: arena?.[ARENA_TITLE_FIELD] ?? `Arena ${arena?.[ARENA_ID_FIELD]}`,
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
