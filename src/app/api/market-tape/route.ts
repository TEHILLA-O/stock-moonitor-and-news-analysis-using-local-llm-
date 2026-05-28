import { NextResponse } from "next/server";
import { getMarketTape } from "@/lib/data/market-tape";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tape = await getMarketTape();
    return NextResponse.json(tape, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load market tape";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
