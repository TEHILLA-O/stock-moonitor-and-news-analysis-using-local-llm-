import type { SecFiling } from "@/lib/types";
import { CACHE_TTL, getCached, setCached } from "./cache";

const SEC_HEADERS = {
  "User-Agent": "PrivateMarketResearchAssistant invest-app/1.0",
  Accept: "application/json",
};

type TickerEntry = {
  cik_str: number;
  ticker: string;
  title: string;
};

async function resolveCik(ticker: string): Promise<string | null> {
  const cacheKey = `sec:cik:${ticker}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: SEC_HEADERS,
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Record<string, TickerEntry>;
  const match = Object.values(data).find(
    (e) => e.ticker.toUpperCase() === ticker.toUpperCase()
  );
  if (!match) return null;

  const cik = String(match.cik_str).padStart(10, "0");
  setCached(cacheKey, cik, CACHE_TTL.filings);
  return cik;
}

export async function fetchSecFilings(ticker: string): Promise<SecFiling[]> {
  const cacheKey = `sec:filings:${ticker}`;
  const cached = getCached<SecFiling[]>(cacheKey);
  if (cached) return cached;

  const cik = await resolveCik(ticker);
  if (!cik) return [];

  const res = await fetch(
    `https://data.sec.gov/submissions/CIK${cik}.json`,
    { headers: SEC_HEADERS, next: { revalidate: 43200 } }
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    name?: string;
    filings?: {
      recent?: {
        accessionNumber?: string[];
        form?: string[];
        filingDate?: string[];
        reportDate?: string[];
        primaryDocument?: string[];
      };
    };
  };

  const recent = data.filings?.recent;
  if (!recent) return [];

  const forms = new Set(["10-K", "10-Q", "8-K", "10-K/A", "10-Q/A", "6-K"]);
  const filings: SecFiling[] = [];

  for (let i = 0; i < (recent.form?.length ?? 0); i++) {
    const form = recent.form?.[i] ?? "";
    if (!forms.has(form)) continue;

    const accession = recent.accessionNumber?.[i] ?? "";
    const accessionPath = accession.replace(/-/g, "");
    const primary = recent.primaryDocument?.[i] ?? "";
    const cikNum = cik.replace(/^0+/, "");

    filings.push({
      accessionNumber: accession,
      form,
      filingDate: recent.filingDate?.[i] ?? "",
      reportDate: recent.reportDate?.[i] ?? "",
      primaryDocument: primary,
      url: `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accessionPath}/${primary}`,
      description: `${form} — ${data.name ?? ticker}`,
    });

    if (filings.length >= 24) break;
  }

  setCached(cacheKey, filings, CACHE_TTL.filings);
  return filings;
}
