"use client";



import Link from "next/link";

import { useState } from "react";

import { RefreshCw } from "lucide-react";

import type { NewsArticle, NewsIngestionMode, NewsRegion } from "@/lib/types";

import { formatFeedRefreshedAt } from "@/lib/news/age";

import { NewsAgeLabel } from "@/components/news/news-age-label";

import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Label } from "@/components/ui/label";

import { Select } from "@/components/ui/select";



export function NewsClient({

  companyId,

  initialNews,

  initialLastFetchedAt,

}: {

  companyId: string;

  initialNews: NewsArticle[];

  initialLastFetchedAt: string | null;

}) {

  const [news, setNews] = useState(initialNews);

  const [lastFetchedAt, setLastFetchedAt] = useState(initialLastFetchedAt);

  const [loading, setLoading] = useState(false);

  const [region, setRegion] = useState<NewsRegion>("usa");

  const [mode, setMode] = useState<NewsIngestionMode>("auto");



  async function refreshNews() {

    setLoading(true);

    try {

      const res = await fetch(

        `/api/news?companyId=${companyId}&region=${region}&mode=${mode}&force=true`

      );

      const data = await res.json();

      if (res.ok) {

        setNews(data.articles ?? data);

        if (data.lastFetchedAt) setLastFetchedAt(data.lastFetchedAt);

      }

    } finally {

      setLoading(false);

    }

  }



  const classificationColor: Record<string, string> = {

    positive: "success",

    negative: "danger",

    neutral: "secondary",

    risk: "danger",

    catalyst: "success",

    hype: "warning",

    legal: "danger",

    earnings: "info",

    macro: "secondary",

    product: "success",

    leadership: "info",

  };



  return (

    <div className="space-y-4">

      <p className="text-xs text-slate-500">

        Auto-refreshes daily ·{" "}

        {formatFeedRefreshedAt(

          lastFetchedAt ? new Date(lastFetchedAt) : null

        )}

      </p>



      <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:grid-cols-2">

        <div className="space-y-1.5">

          <Label>Region</Label>

          <Select value={region} onChange={(e) => setRegion(e.target.value as NewsRegion)}>

            <option value="usa">USA</option>

            <option value="uk">UK</option>

            <option value="china">China</option>

            <option value="nigeria">Nigeria</option>

          </Select>

        </div>

        <div className="space-y-1.5">

          <Label>Source Mode</Label>

          <Select value={mode} onChange={(e) => setMode(e.target.value as NewsIngestionMode)}>

            <option value="auto">Auto</option>

            <option value="api">API only</option>

            <option value="scrape">Scrape free sources</option>


          </Select>

        </div>

      </div>

      <Button variant="secondary" onClick={refreshNews} disabled={loading}>

        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />

        Refresh now

      </Button>



      {news.map((article) => (

        <Card key={article.id}>

          <CardContent className="space-y-2 p-5">

            <div className="flex flex-wrap items-start justify-between gap-2">

              <Link

                href={`/news/read?url=${encodeURIComponent(

                  article.url

                )}&title=${encodeURIComponent(article.title)}&source=${encodeURIComponent(

                  article.source

                )}&summary=${encodeURIComponent(article.summary || "")}`}

                className="text-base font-medium text-slate-100 hover:text-cyan-400"

              >

                {article.title}

              </Link>

              <div className="flex flex-wrap items-center gap-2">

                <NewsAgeLabel publishedAt={article.publishedAt} />

                {article.classification && (

                  <Badge

                    variant={

                      (classificationColor[article.classification] as

                        | "success"

                        | "danger"

                        | "secondary"

                        | "warning"

                        | "info") ?? "secondary"

                    }

                  >

                    {article.classification}

                  </Badge>

                )}

              </div>

            </div>

            <p className="text-sm text-slate-400">{article.summary}</p>

            <div className="flex flex-wrap gap-3 text-xs text-slate-500">

              <span>{article.source}</span>

              {article.sentimentScore !== undefined && (

                <span

                  className={

                    article.sentimentScore >= 0 ? "text-cyan-400" : "text-fuchsia-400"

                  }

                >

                  Sentiment: {article.sentimentScore > 0 ? "+" : ""}

                  {article.sentimentScore}

                </span>

              )}

            </div>

            {article.aiExplanation && (

              <p className="rounded-lg bg-white/5 p-3 text-xs text-slate-400">

                <span className="font-medium text-slate-300">AI: </span>

                {article.aiExplanation}

              </p>

            )}

          </CardContent>

        </Card>

      ))}

    </div>

  );

}

