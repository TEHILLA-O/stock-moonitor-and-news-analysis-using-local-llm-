import Link from "next/link";
import { ExternalLink, ArrowLeft, AlertTriangle } from "lucide-react";
import { GlassHeader } from "@/components/layout/glass-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  fetchAndParseArticle,
  validateHttpUrl,
} from "@/lib/services/articleReaderService";

export default async function NewsReadPage({
  searchParams,
}: {
  searchParams: Promise<{
    url?: string;
    title?: string;
    source?: string;
    ticker?: string;
    summary?: string;
  }>;
}) {
  const params = await searchParams;
  const safeUrl = params.url ? validateHttpUrl(params.url) : null;
  const fallbackTitle = params.title ?? "News article";
  const source = params.source ?? "External";
  const ticker = params.ticker;
  const summary = params.summary ? decodeURIComponent(params.summary) : "";

  if (!safeUrl) {
    return (
      <div className="space-y-8">
        <GlassHeader title="News Reader" subtitle="Invalid article URL" icon="news" />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
            <p className="text-slate-300">Could not open this article link.</p>
            <Link href="/news" className="mt-4 inline-block">
              <Button variant="secondary">Back to News</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  let parsed:
    | Awaited<ReturnType<typeof fetchAndParseArticle>>
    | null = null;
  let error: string | null = null;

  try {
    parsed = await fetchAndParseArticle(safeUrl);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load article";
  }

  const heading = parsed?.title || fallbackTitle;

  return (
    <div className="space-y-8">
      <GlassHeader
        title={heading}
        subtitle={`${source}${ticker ? ` · ${ticker}` : ""}`}
        icon="news"
        action={
          <div className="flex gap-2">
            <Link href="/news">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <a href={safeUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4" />
                Open Original
              </Button>
            </a>
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-300">
                Could not extract full text in-app ({error}).
              </p>
              {summary && (
                <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wider text-amber-300">
                    Preview Summary
                  </p>
                  <p className="text-sm text-slate-300">{summary}</p>
                </div>
              )}
              <p className="text-sm text-slate-400">
                Use <strong>Open Original</strong> to read on the source site.
              </p>
            </div>
          ) : parsed?.paragraphs.length ? (
            parsed.paragraphs.map((paragraph, index) => (
              <p key={index} className="leading-7 text-slate-200">
                {paragraph}
              </p>
            ))
          ) : (
            <div className="space-y-3">
              {summary ? (
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wider text-cyan-300">
                    Preview Summary
                  </p>
                  <p className="text-sm text-slate-200">{summary}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Preview unavailable.</p>
              )}
              <p className="text-sm text-slate-400">
                Use <strong>Open Original</strong> for full article.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
