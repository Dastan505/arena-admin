import { NextResponse } from "next/server";
import { directusFetch } from "@/lib/directus";

const COLLECTION = "games";

export async function GET() {
  try {
    let data: any = null;
    try {
      data = await directusFetch(`/items/${COLLECTION}?fields=id,name,category&sort=name`);
    } catch (err) {
      console.warn("/api/games GET fallback to id,name:", err);
      data = await directusFetch(`/items/${COLLECTION}?fields=id,name&sort=name`);
    }
    const items = (data?.data ?? []).map((it: any) => ({
      id: String(it.id),
      name: it.name,
      category: it.category ?? null,
    }));
    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/games GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }
    const payload: Record<string, any> = { name: body.name };
    if (body?.category) payload.category = body.category;
    const res = await directusFetch(`/items/${COLLECTION}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/games POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body?.id || !body?.name) {
      return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
    }
    const payload: Record<string, any> = { name: body.name };
    if (body?.category !== undefined) payload.category = body.category;
    const res = await directusFetch(`/items/${COLLECTION}/${body.id}`, {
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
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const res = await directusFetch(`/items/${COLLECTION}/${id}`, { method: "DELETE" });
    return NextResponse.json(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/games DELETE error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
