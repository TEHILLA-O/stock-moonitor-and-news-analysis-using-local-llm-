import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCompanyNews } from "@/lib/data/news-data";
import { createCompanySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const companies = await db.getCompanies();
  return NextResponse.json(companies, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limit = checkRateLimit(`companies-post-${ip}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: limit.retryAfter },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createCompanySchema.parse(body);
    const company = await db.createCompany({
      name: parsed.name,
      ticker: parsed.ticker.toUpperCase(),
      exchange: parsed.exchange ?? "",
      sector: parsed.sector ?? "",
      country: parsed.country ?? "",
      notes: parsed.notes ?? "",
      status: parsed.status ?? "watching",
    });

    void getCompanyNews(company, { force: true }).catch(() => {});

    return NextResponse.json(company, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
