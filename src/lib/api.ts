// Client-side fetch helper. Components may only call the internal Next.js proxy routes.
import type { ApiErrorEnvelope } from "./types";

export type InternalRoute = "/api/chat" | "/api/simulate" | "/api/explain";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function postJson<T>(route: InternalRoute, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(route, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body; handled below.
  }
  if (!response.ok) {
    const envelope = data as Partial<ApiErrorEnvelope> | null;
    throw new ApiError(
      envelope?.error?.message ?? `Request failed with status ${response.status}.`,
      envelope?.error?.code ?? "http_error",
      response.status,
    );
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
