import { NextResponse } from "next/server";
import { meili, INDEX_ARTICLES, rateLimit } from "@wiki/shared";
import { clientIp } from "@/lib/viewer";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);
  if (!(await rateLimit(`suggest:${await clientIp()}`, 120, 60)).ok) return NextResponse.json([], { status: 429 });
  try {
    const r = await meili().index(INDEX_ARTICLES).search(q, {
      limit: 6, attributesToRetrieve: ["title", "slug", "excerpt"], attributesToSearchOn: ["title", "categories"],
      filter: 'namespace = "main"',
    });
    return NextResponse.json(r.hits, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json([]);
  }
}
