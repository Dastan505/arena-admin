import { NextResponse } from "next/server";

const DIRECTUS_URL = process.env.DIRECTUS_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
    }
    if (!DIRECTUS_URL) {
      return NextResponse.json({ error: "DIRECTUS_URL не настроен" }, { status: 500 });
    }

    const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Неверный логин или пароль", details: text }, { status: 401 });
    }

    const data = await res.json();
    const accessToken = data?.data?.access_token;
    const refreshToken = data?.data?.refresh_token;
    const expires = Number(data?.data?.expires ?? 3600);

    if (!accessToken) {
      return NextResponse.json({ error: "Не удалось получить токен" }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("da_access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: expires,
    });
    if (refreshToken) {
      response.cookies.set("da_refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/auth/login error:", message);
    return NextResponse.json({ error: "Ошибка входа" }, { status: 500 });
  }
}
