// Server-side only: used by Route Handlers to forward requests to the FastAPI backend,
// so the browser only ever talks to this Next.js origin (no CORS).
import { NextResponse } from "next/server";

const BACKEND_API_URL = (process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function proxyPost(request: Request, path: string, timeoutMs = 90_000): Promise<Response> {
  const body = await request.text();
  try {
    const upstream = await fetch(`${BACKEND_API_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        error: {
          code: timedOut ? "backend_timeout" : "backend_unreachable",
          message: timedOut
            ? "The analysis service took too long to respond. Please try again."
            : "The analysis service is not reachable. Check that the backend is running.",
          details: null,
        },
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}
