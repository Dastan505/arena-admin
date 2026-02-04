import "server-only";

export const DIRECTUS_URL = process.env.DIRECTUS_URL!;
export const DIRECTUS_TOKEN = process.env.DIRECTUS_SERVICE_TOKEN!;

function buildHeaders(init: RequestInit) {
  return {
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };
}

function buildHeadersWithToken(token: string, init: RequestInit) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };
}

export async function directusRequest(path: string, init: RequestInit = {}) {
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
    throw new Error("Missing DIRECTUS_URL or DIRECTUS_SERVICE_TOKEN in .env.local");
  }
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...init,
    headers: buildHeaders(init),
    cache: "no-store",
  });
  return res;
}

export async function directusFetch(path: string, init: RequestInit = {}) {
  const res = await directusRequest(path, init);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Directus error ${res.status}: ${text}`);
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function directusRequestWithToken(
  token: string,
  path: string,
  init: RequestInit = {}
) {
  if (!DIRECTUS_URL || !token) {
    throw new Error("Missing DIRECTUS_URL or user token");
  }
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...init,
    headers: buildHeadersWithToken(token, init),
    cache: "no-store",
  });
  return res;
}

export async function directusFetchWithToken(
  token: string,
  path: string,
  init: RequestInit = {}
) {
  const res = await directusRequestWithToken(token, path, init);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Directus error ${res.status}: ${text}`);
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
