import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createResearchNoteSchema } from "@/lib/validations";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await db.deleteResearchNote(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = createResearchNoteSchema.partial().parse(body);
    const notes = await db.getResearchNotes(parsed.companyId ?? "");
    const existing = notes.find((n) => n.id === id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.upsertResearchNote({
      ...existing,
      ...parsed,
      id,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
