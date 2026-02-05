import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  return NextResponse.json({
    cookies: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + "..." })),
    hasAccessToken: !!cookieStore.get("da_access_token")?.value,
    hasRefreshToken: !!cookieStore.get("da_refresh_token")?.value,
  });
}
