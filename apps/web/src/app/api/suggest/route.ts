import { NextResponse } from "next/server";
import { rateLimit } from "@wiki/shared";
import { clientIp } from "@/lib/viewer";
import { searchSuggest } from "@/lib/search";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);
  if (!(await rateLimit(`suggest:${await clientIp()}`, 120, 60)).ok) return NextResponse.json([], { status: 429 });
  try {
    const hits = await searchSuggest(q, 6);
    return NextResponse.json(hits, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json([]);
  }
}
