import { NextRequest, NextResponse } from "next/server";
import { searchCompanyDirectory } from "@/lib/data/company-directory";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(24, Math.max(1, Number(limitParam))) : 12;

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = searchCompanyDirectory(q, limit);
  return NextResponse.json({ results, count: results.length });
}
