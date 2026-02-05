import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { directusFetch, DIRECTUS_URL, DIRECTUS_TOKEN } from "@/lib/directus";

export async function GET() {
  const checks: Record<string, { ok: boolean; error?: string; details?: unknown }> = {};

  // Check environment variables
  checks.env = {
    ok: !!DIRECTUS_URL && !!DIRECTUS_TOKEN,
    details: {
      DIRECTUS_URL: DIRECTUS_URL ? "configured" : "MISSING",
      DIRECTUS_TOKEN: DIRECTUS_TOKEN ? "configured" : "MISSING",
    },
  };

  // Check user token
  const cookieStore = await cookies();
  const userToken = cookieStore.get("da_access_token")?.value;
  checks.auth = {
    ok: !!userToken,
    details: { hasToken: !!userToken },
  };

  // Test Directus connection with service token
  try {
    const serverInfo = await directusFetch("/server/info");
    checks.directusService = {
      ok: true,
      details: serverInfo,
    };
  } catch (err) {
    checks.directusService = {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Test Directus connection with user token
  if (userToken) {
    try {
      const res = await fetch(`${DIRECTUS_URL}/users/me`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        checks.directusUser = {
          ok: true,
          details: data?.data,
        };
      } else {
        checks.directusUser = {
          ok: false,
          error: `HTTP ${res.status}`,
        };
      }
    } catch (err) {
      checks.directusUser = {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  } else {
    checks.directusUser = {
      ok: false,
      error: "No user token",
    };
  }

  // Test arenas collection access
  if (userToken) {
    try {
      const res = await fetch(`${DIRECTUS_URL}/items/arenas?limit=1&fields=id,name`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        checks.arenas = {
          ok: true,
          details: { count: data?.data?.length ?? 0 },
        };
      } else {
        const text = await res.text();
        checks.arenas = {
          ok: false,
          error: `HTTP ${res.status}: ${text}`,
        };
      }
    } catch (err) {
      checks.arenas = {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "unhealthy",
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
