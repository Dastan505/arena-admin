import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DIRECTUS_URL = process.env.DIRECTUS_URL;

export async function GET() {
  const token = cookies().get("da_access_token")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  if (!DIRECTUS_URL) {
    return NextResponse.json({ error: "DIRECTUS_URL не настроен" }, { status: 500 });
  }

  const res = await fetch(
    `${DIRECTUS_URL}/users/me?fields=id,first_name,last_name,email,role.id,role.name`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const data = await res.json();
  return NextResponse.json({ authenticated: true, user: data?.data ?? null });
}
