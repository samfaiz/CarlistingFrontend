/**
 * Typed fetch wrapper for the Carsens backend API — task P0-05.
 *
 * - Base URL: NEXT_PUBLIC_API_URL in the browser; API_URL (server-side
 *   equivalent, e.g. inside the NextAuth route) wins on the server.
 * - Backend error envelope is `{statusCode, error, message, ...}` (message may
 *   be a string or, for DTO validation failures, an array of strings). Errors
 *   surface as `ApiError` carrying the backend `message` so UI can show it.
 */

export const API_BASE_URL =
  (typeof window === "undefined" ? process.env.API_URL : undefined) ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

export class ApiError extends Error {
  /** HTTP status from the backend envelope (0 for network failures). */
  readonly statusCode: number;
  /** Backend `error` field, e.g. "Unauthorized" / "Conflict". */
  readonly error?: string;

  constructor(statusCode: number, message: string, error?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
  }
}

interface ErrorEnvelope {
  statusCode?: number;
  error?: string;
  message?: string | string[];
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const envelope = (body ?? {}) as ErrorEnvelope;
    const message = Array.isArray(envelope.message)
      ? envelope.message.join(" ")
      : (envelope.message ?? res.statusText);
    throw new ApiError(envelope.statusCode ?? res.status, message, envelope.error);
  }

  return body as T;
}

export function apiGet<T>(path: string, opts?: { token?: string }): Promise<T> {
  return request<T>(path, { method: "GET", token: opts?.token });
}

export function apiPost<T>(
  path: string,
  body: unknown,
  opts?: { token?: string },
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    token: opts?.token,
  });
}
