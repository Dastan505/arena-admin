import { NextResponse } from "next/server";
import { directusFetch, directusRequest } from "@/lib/directus";

const BOOKINGS_COLLECTION = "bookings";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }
    const body = await req.json();
    const updated = await directusFetch(
      `/items/${BOOKINGS_COLLECTION}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    );
    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("bookings patch error:", message, error);
    const payload: Record<string, string> = { error: "Ошибка обновления" };
    if (process.env.NODE_ENV !== "production") {
      payload.details = message;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }
    const res = await directusRequest(`/items/${BOOKINGS_COLLECTION}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Directus error ${res.status}: ${text}`);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    console.error("bookings delete error:", message, error);
    const payload: Record<string, string> = { error: "Ошибка удаления" };
    if (process.env.NODE_ENV !== "production") {
      payload.details = message;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
