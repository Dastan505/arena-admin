import { cookies } from "next/headers";

const DIRECTUS_URL = process.env.DIRECTUS_URL;

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires: number;
}

export async function getValidToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("da_access_token")?.value;
  const refreshToken = cookieStore.get("da_refresh_token")?.value;

  if (!accessToken) {
    console.log("[getValidToken] No access token");
    return null;
  }

  // Try to use current token
  try {
    const testRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (testRes.ok) {
      return accessToken;
    }
    
    // Token expired, try to refresh
    if (testRes.status === 401 && refreshToken) {
      console.log("[getValidToken] Access token expired, trying refresh...");
      const newTokens = await refreshAccessToken(refreshToken);
      if (newTokens) {
        await setAuthCookies(newTokens);
        return newTokens.access_token;
      }
    }
  } catch (err) {
    console.error("[getValidToken] Error:", err);
  }

  return null;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenData | null> {
  try {
    console.log("[refreshAccessToken] Sending refresh request...");
    const res = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[refreshAccessToken] Failed:", res.status, errorText);
      return null;
    }

    const data = await res.json();
    console.log("[refreshAccessToken] Success, new tokens received");
    return {
      access_token: data.data.access_token,
      refresh_token: data.data.refresh_token,
      expires: data.data.expires,
    };
  } catch (err) {
    console.error("[refreshAccessToken] Error:", err);
    return null;
  }
}

async function setAuthCookies(tokens: TokenData) {
  const cookieStore = await cookies();
  
  cookieStore.set("da_access_token", tokens.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: tokens.expires,
  });
  
  cookieStore.set("da_refresh_token", tokens.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  
  console.log("[setAuthCookies] Tokens refreshed");
}
