import { proxyPost } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyPost(request, "/api/simulate/explain");
}
