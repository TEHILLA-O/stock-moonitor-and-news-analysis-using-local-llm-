export const dynamic = "force-dynamic";

import Link from "next/link";

import { Newspaper, RefreshCcw } from "lucide-react";

import { db } from "@/lib/db";

import { getCompanyNews } from "@/lib/data/news-data";
import { getRegionalNews } from "@/lib/data/regional-news";

import { formatFeedRefreshedAt } from "@/lib/news/age";
import { getLatestFetchedAt } from "@/lib/news/refresh";

import { GlassHeader } from "@/components/layout/glass-header";

import { NewsAgeLabel } from "@/components/news/news-age-label";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";



export default async function NewsHubPage() {

  const [companies, settings] = await Promise.all([db.getCompanies(), db.getSettings()]);



  const [companyNews, regionalNews] = await Promise.all([
    Promise.all(
      companies.map(async (company) => {
        const articles = await getCompanyNews(company, { limit: 4 });
        return articles.map((article) => ({
          ...article,
          ticker: company.ticker,
          companyName: company.name,
          isRegional: false as const,
        }));
      })
    ),
    getRegionalNews(settings.newsRegion, 24),
  ]);

  const watchlistNews = companyNews.flat();
  const regionalItems = regionalNews.map((article) => ({
    ...article,
    ticker: settings.newsRegion.toUpperCase(),
    companyName: "Regional feed",
    isRegional: true as const,
  }));

  const latestNews = [...watchlistNews, ...regionalItems]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, 40);

  const allFetchedAt = getLatestFetchedAt([...watchlistNews, ...regionalNews]);



  return (

    <div className="space-y-8">

      <GlassHeader

        title="News"

        subtitle={`${settings.newsRegion.toUpperCase()} · refreshes daily · ${formatFeedRefreshedAt(allFetchedAt)}`}

        icon="news"

        action={

          <Link href="/settings">

            <Button variant="secondary">

              <RefreshCcw className="h-4 w-4" />

              Configure Sources

            </Button>

          </Link>

        }

      />



      {latestNews.length === 0 ? (

        <Card>

          <CardContent className="py-16 text-center">

            <Newspaper className="mx-auto mb-3 h-8 w-8 text-slate-600" />

            <p className="text-slate-400">Could not load regional news right now.</p>

            <p className="mt-1 text-xs text-slate-500">

              Check Settings (news region / provider) or add companies to your watchlist for ticker-specific headlines.

            </p>

          </CardContent>

        </Card>

      ) : (

        <div className="grid gap-4 lg:grid-cols-2">

          {latestNews.map((article) => (

            <Card key={article.id}>

              <CardContent className="space-y-2 p-5">

                <div className="flex items-center justify-between gap-2">

                  <div className="flex flex-wrap items-center gap-2">

                    <Badge variant="info">{article.ticker}</Badge>

                    <span className="text-xs text-slate-500">{article.source}</span>

                  </div>

                  <NewsAgeLabel publishedAt={article.publishedAt} />

                </div>

                <Link

                  href={`/news/read?url=${encodeURIComponent(article.url)}&title=${encodeURIComponent(

                    article.title

                  )}&source=${encodeURIComponent(article.source)}&ticker=${encodeURIComponent(

                    article.ticker

                  )}&summary=${encodeURIComponent(article.summary || "")}`}

                  className="line-clamp-2 text-sm font-medium text-slate-100 hover:text-cyan-400"

                >

                  {article.title}

                </Link>

                <p className="line-clamp-2 text-xs text-slate-500">

                  {article.summary || article.companyName}

                </p>

                {"isRegional" in article && article.isRegional ? (
                  <span className="inline-block pt-1 text-xs text-slate-500">
                    Regional headline
                  </span>
                ) : (
                  <Link
                    href={`/company/${article.ticker}/news`}
                    className="inline-block pt-1 text-xs text-cyan-400 hover:underline"
                  >
                    Open {article.ticker} news
                  </Link>
                )}

              </CardContent>

            </Card>

          ))}

        </div>

      )}

    </div>

  );

}

