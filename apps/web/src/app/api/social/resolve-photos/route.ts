import { NextResponse } from "next/server";
import { resolveGooglePhotosMedia } from "@/lib/google-photos";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ success: false, error: "URL é obrigatória" }, { status: 400 });
    }

    const resolved = await resolveGooglePhotosMedia(url);

    return NextResponse.json({
      success: true,
      data: resolved,
    });
  } catch (error) {
    console.error("GET /api/social/resolve-photos error:", error);
    return NextResponse.json({ success: false, error: "Erro ao resolver mídia" }, { status: 500 });
  }
}
