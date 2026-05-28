import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createResearchNoteSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }
  const notes = await db.getResearchNotes(companyId);
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createResearchNoteSchema.parse(body);
    const note = await db.createResearchNote({
      companyId: parsed.companyId,
      title: parsed.title,
      thesis: parsed.thesis,
      notes: parsed.notes,
      aiSummary: parsed.aiSummary,
      decision: parsed.decision ?? null,
      confidence: parsed.confidence ?? null,
      tags: parsed.tags,
      metricsSnapshot: parsed.metricsSnapshot ?? null,
    });
    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
