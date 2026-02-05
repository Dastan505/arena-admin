import "server-only";

export const DIRECTUS_URL = process.env.DIRECTUS_URL;
export const DIRECTUS_TOKEN = process.env.DIRECTUS_SERVICE_TOKEN;

export class DirectusError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "DirectusError";
    this.status = status;
  }
}

function buildHeaders(init: RequestInit): Record<string, string> {
  if (!DIRECTUS_TOKEN) {
    throw new DirectusError("DIRECTUS_SERVICE_TOKEN not configured", 500);
  }
  return {
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> ?? {}),
  };
}

function buildHeadersWithToken(token: string, init: RequestInit): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> ?? {}),
  };
}

export async function directusRequest(path: string, init: RequestInit = {}): Promise<Response> {
  if (!DIRECTUS_URL) {
    throw new DirectusError("DIRECTUS_URL not configured", 500);
  }
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...init,
    headers: buildHeaders(init),
    cache: "no-store",
  });
  return res;
}

export async function directusFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await directusRequest(path, init);

  if (!res.ok) {
    const text = await res.text();
    throw new DirectusError(`Directus error ${res.status}: ${text}`, res.status);
  }
  const text = await res.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export async function directusRequestWithToken(
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  if (!DIRECTUS_URL) {
    throw new DirectusError("DIRECTUS_URL not configured", 500);
  }
  if (!token) {
    throw new DirectusError("User token required", 401);
  }
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...init,
    headers: buildHeadersWithToken(token, init),
    cache: "no-store",
  });
  return res;
}

export async function directusFetchWithToken<T = unknown>(
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await directusRequestWithToken(token, path, init);

  if (!res.ok) {
    const text = await res.text();
    throw new DirectusError(`Directus error ${res.status}: ${text}`, res.status);
  }
  const text = await res.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

// Type-safe Directus response wrapper
export interface DirectusListResponse<T> {
  data: T[];
  meta?: {
    total_count?: number;
    filter_count?: number;
  };
}

export interface DirectusItemResponse<T> {
  data: T;
}
