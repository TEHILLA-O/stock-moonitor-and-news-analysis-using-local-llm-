"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Decision, Confidence, ResearchNote } from "@/lib/types";
import { decisionColor } from "@/lib/utils";

interface ResearchJournalProps {
  companyId: string;
  initialNotes: ResearchNote[];
}

export function ResearchJournal({ companyId, initialNotes }: ResearchJournalProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    thesis: "",
    notes: "",
    decision: "" as Decision | "",
    confidence: "" as Confidence | "",
    tags: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          title: form.title,
          thesis: form.thesis,
          notes: form.notes,
          decision: form.decision || null,
          confidence: form.confidence || null,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const note = await res.json();
      if (!res.ok) throw new Error(note.error);
      setNotes([note, ...notes]);
      setShowForm(false);
      setForm({ title: "", thesis: "", notes: "", decision: "", confidence: "", tags: "" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/research/${id}`, { method: "DELETE" });
    setNotes(notes.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Research Journal</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Research Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Investment Thesis</Label>
                <Textarea
                  rows={3}
                  value={form.thesis}
                  onChange={(e) => setForm({ ...form, thesis: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Decision</Label>
                  <Select
                    value={form.decision}
                    onChange={(e) =>
                      setForm({ ...form, decision: e.target.value as Decision })
                    }
                  >
                    <option value="">—</option>
                    <option value="buy">Buy</option>
                    <option value="hold">Hold</option>
                    <option value="watch">Watch</option>
                    <option value="avoid">Avoid</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Confidence</Label>
                  <Select
                    value={form.confidence}
                    onChange={(e) =>
                      setForm({ ...form, confidence: e.target.value as Confidence })
                    }
                  >
                    <option value="">—</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            No research entries yet.
          </CardContent>
        </Card>
      ) : (
        notes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{note.title}</CardTitle>
                <p className="text-xs text-slate-500">
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(note.id)}
              >
                <Trash2 className="h-4 w-4 text-slate-500" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {note.thesis && (
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-slate-400">Thesis: </span>
                  {note.thesis}
                </p>
              )}
              {note.notes && (
                <p className="text-sm text-slate-400 whitespace-pre-wrap">{note.notes}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {note.decision && (
                  <Badge className={decisionColor(note.decision)}>
                    {note.decision}
                  </Badge>
                )}
                {note.confidence && <Badge variant="secondary">{note.confidence}</Badge>}
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
