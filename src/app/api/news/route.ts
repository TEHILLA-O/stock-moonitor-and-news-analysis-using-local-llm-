import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCompanyNews } from "@/lib/data/news-data";
import type { NewsIngestionMode, NewsRegion } from "@/lib/types";
import { getLatestFetchedAt } from "@/lib/news/refresh";

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId");
  const region = request.nextUrl.searchParams.get("region") as NewsRegion | null;
  const mode = request.nextUrl.searchParams.get("mode") as NewsIngestionMode | null;
  const force = request.nextUrl.searchParams.get("force") === "true";

  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  const company = await db.getCompanyById(companyId);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const articles = await getCompanyNews(company, {
    force,
    region: region ?? undefined,
    mode: mode ?? undefined,
  });

  return NextResponse.json({
    articles,
    lastFetchedAt: getLatestFetchedAt(articles)?.toISOString() ?? null,
  });
}
