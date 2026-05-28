import { NextRequest, NextResponse } from "next/server";
import { fetchCompanyFilings } from "@/lib/services/financialDataService";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  const filings = await fetchCompanyFilings(ticker);
  return NextResponse.json({ filings });
}
