/**
 * Curated directory of common listed companies for watchlist auto-fill.
 * Extend this list as needed — no external API required.
 */

export interface CompanyDirectoryEntry {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  country: string;
}

export const COMPANY_DIRECTORY: CompanyDirectoryEntry[] = [
  // US — Mega cap tech
  { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", country: "USA" },
  { ticker: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", country: "USA" },
  { ticker: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "ORCL", name: "Oracle Corporation", exchange: "NYSE", sector: "Technology", country: "USA" },
  { ticker: "CRM", name: "Salesforce Inc.", exchange: "NYSE", sector: "Technology", country: "USA" },
  { ticker: "AMD", name: "Advanced Micro Devices Inc.", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "INTC", name: "Intel Corporation", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "NFLX", name: "Netflix Inc.", exchange: "NASDAQ", sector: "Communication Services", country: "USA" },
  { ticker: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "CSCO", name: "Cisco Systems Inc.", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "QCOM", name: "QUALCOMM Incorporated", exchange: "NASDAQ", sector: "Technology", country: "USA" },
  { ticker: "IBM", name: "International Business Machines", exchange: "NYSE", sector: "Technology", country: "USA" },
  { ticker: "UBER", name: "Uber Technologies Inc.", exchange: "NYSE", sector: "Technology", country: "USA" },
  { ticker: "PLTR", name: "Palantir Technologies Inc.", exchange: "NYSE", sector: "Technology", country: "USA" },
  { ticker: "SNOW", name: "Snowflake Inc.", exchange: "NYSE", sector: "Technology", country: "USA" },
  // US — Finance
  { ticker: "BRK-B", name: "Berkshire Hathaway Inc.", exchange: "NYSE", sector: "Financial Services", country: "USA" },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", sector: "Financial Services", country: "USA" },
  { ticker: "V", name: "Visa Inc.", exchange: "NYSE", sector: "Financial Services", country: "USA" },
  { ticker: "MA", name: "Mastercard Incorporated", exchange: "NYSE", sector: "Financial Services", country: "USA" },
  { ticker: "BAC", name: "Bank of America Corporation", exchange: "NYSE", sector: "Financial Services", country: "USA" },
  { ticker: "WFC", name: "Wells Fargo & Company", exchange: "NYSE", sector: "Financial Services", country: "USA" },
  { ticker: "GS", name: "The Goldman Sachs Group Inc.", exchange: "NYSE", sector: "Financial Services", country: "USA" },
  { ticker: "MS", name: "Morgan Stanley", exchange: "NYSE", sector: "Financial Services", country: "USA" },
  { ticker: "BLK", name: "BlackRock Inc.", exchange: "NYSE", sector: "Financial Services", country: "USA" },
  // US — Healthcare
  { ticker: "LLY", name: "Eli Lilly and Company", exchange: "NYSE", sector: "Healthcare", country: "USA" },
  { ticker: "UNH", name: "UnitedHealth Group Incorporated", exchange: "NYSE", sector: "Healthcare", country: "USA" },
  { ticker: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", sector: "Healthcare", country: "USA" },
  { ticker: "PFE", name: "Pfizer Inc.", exchange: "NYSE", sector: "Healthcare", country: "USA" },
  { ticker: "ABBV", name: "AbbVie Inc.", exchange: "NYSE", sector: "Healthcare", country: "USA" },
  { ticker: "MRK", name: "Merck & Co. Inc.", exchange: "NYSE", sector: "Healthcare", country: "USA" },
  // US — Consumer & industrial
  { ticker: "WMT", name: "Walmart Inc.", exchange: "NYSE", sector: "Consumer Defensive", country: "USA" },
  { ticker: "COST", name: "Costco Wholesale Corporation", exchange: "NASDAQ", sector: "Consumer Defensive", country: "USA" },
  { ticker: "KO", name: "The Coca-Cola Company", exchange: "NYSE", sector: "Consumer Defensive", country: "USA" },
  { ticker: "PEP", name: "PepsiCo Inc.", exchange: "NASDAQ", sector: "Consumer Defensive", country: "USA" },
  { ticker: "PG", name: "The Procter & Gamble Company", exchange: "NYSE", sector: "Consumer Defensive", country: "USA" },
  { ticker: "HD", name: "The Home Depot Inc.", exchange: "NYSE", sector: "Consumer Cyclical", country: "USA" },
  { ticker: "MCD", name: "McDonald's Corporation", exchange: "NYSE", sector: "Consumer Cyclical", country: "USA" },
  { ticker: "NKE", name: "NIKE Inc.", exchange: "NYSE", sector: "Consumer Cyclical", country: "USA" },
  { ticker: "DIS", name: "The Walt Disney Company", exchange: "NYSE", sector: "Communication Services", country: "USA" },
  { ticker: "BA", name: "The Boeing Company", exchange: "NYSE", sector: "Industrials", country: "USA" },
  { ticker: "CAT", name: "Caterpillar Inc.", exchange: "NYSE", sector: "Industrials", country: "USA" },
  { ticker: "XOM", name: "Exxon Mobil Corporation", exchange: "NYSE", sector: "Energy", country: "USA" },
  { ticker: "CVX", name: "Chevron Corporation", exchange: "NYSE", sector: "Energy", country: "USA" },
  // US — ETFs (common research proxies)
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE", sector: "ETF", country: "USA" },
  { ticker: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ", sector: "ETF", country: "USA" },
  { ticker: "VTI", name: "Vanguard Total Stock Market ETF", exchange: "NYSE", sector: "ETF", country: "USA" },
  // UK
  { ticker: "SHEL", name: "Shell plc", exchange: "LSE", sector: "Energy", country: "UK" },
  { ticker: "AZN", name: "AstraZeneca PLC", exchange: "LSE", sector: "Healthcare", country: "UK" },
  { ticker: "HSBA", name: "HSBC Holdings plc", exchange: "LSE", sector: "Financial Services", country: "UK" },
  { ticker: "ULVR", name: "Unilever PLC", exchange: "LSE", sector: "Consumer Defensive", country: "UK" },
  { ticker: "BP", name: "BP p.l.c.", exchange: "LSE", sector: "Energy", country: "UK" },
  { ticker: "GSK", name: "GSK plc", exchange: "LSE", sector: "Healthcare", country: "UK" },
  { ticker: "RIO", name: "Rio Tinto Group", exchange: "LSE", sector: "Basic Materials", country: "UK" },
  { ticker: "BARC", name: "Barclays PLC", exchange: "LSE", sector: "Financial Services", country: "UK" },
  { ticker: "LLOY", name: "Lloyds Banking Group plc", exchange: "LSE", sector: "Financial Services", country: "UK" },
  { ticker: "VOD", name: "Vodafone Group Plc", exchange: "LSE", sector: "Communication Services", country: "UK" },
  // China / HK ADRs & listings
  { ticker: "BABA", name: "Alibaba Group Holding Limited", exchange: "NYSE", sector: "Consumer Cyclical", country: "China" },
  { ticker: "PDD", name: "PDD Holdings Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", country: "China" },
  { ticker: "JD", name: "JD.com Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", country: "China" },
  { ticker: "BIDU", name: "Baidu Inc.", exchange: "NASDAQ", sector: "Technology", country: "China" },
  { ticker: "NIO", name: "NIO Inc.", exchange: "NYSE", sector: "Consumer Cyclical", country: "China" },
  { ticker: "LI", name: "Li Auto Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", country: "China" },
  { ticker: "XPEV", name: "XPeng Inc.", exchange: "NYSE", sector: "Consumer Cyclical", country: "China" },
  { ticker: "TCEHY", name: "Tencent Holdings Ltd.", exchange: "OTC", sector: "Technology", country: "China" },
  { ticker: "0700.HK", name: "Tencent Holdings Limited", exchange: "HKEX", sector: "Technology", country: "China" },
  { ticker: "9988.HK", name: "Alibaba Group Holding Limited", exchange: "HKEX", sector: "Consumer Cyclical", country: "China" },
  // Nigeria
  { ticker: "DANGCEM", name: "Dangote Cement Plc", exchange: "NGX", sector: "Basic Materials", country: "Nigeria" },
  { ticker: "DANGSUGAR", name: "Dangote Sugar Refinery Plc", exchange: "NGX", sector: "Consumer Defensive", country: "Nigeria" },
  { ticker: "GTCO", name: "Guaranty Trust Holding Company", exchange: "NGX", sector: "Financial Services", country: "Nigeria" },
  { ticker: "ZENITHBANK", name: "Zenith Bank Plc", exchange: "NGX", sector: "Financial Services", country: "Nigeria" },
  { ticker: "MTNN", name: "MTN Nigeria Communications Plc", exchange: "NGX", sector: "Communication Services", country: "Nigeria" },
  { ticker: "BUACEMENT", name: "BUA Cement Plc", exchange: "NGX", sector: "Basic Materials", country: "Nigeria" },
  { ticker: "SEPLAT", name: "Seplat Energy PLC", exchange: "NGX", sector: "Energy", country: "Nigeria" },
  { ticker: "ACCESSCORP", name: "Access Holdings Plc", exchange: "NGX", sector: "Financial Services", country: "Nigeria" },
  { ticker: "UBA", name: "United Bank for Africa Plc", exchange: "NGX", sector: "Financial Services", country: "Nigeria" },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function searchCompanyDirectory(
  query: string,
  limit = 12
): CompanyDirectoryEntry[] {
  const q = query.trim();
  if (!q) return [];

  const qLower = q.toLowerCase();
  const qNorm = normalize(q);

  const scored = COMPANY_DIRECTORY.map((entry) => {
    const tickerLower = entry.ticker.toLowerCase();
    const nameLower = entry.name.toLowerCase();
    const tickerNorm = normalize(entry.ticker);
    const nameNorm = normalize(entry.name);

    let score = 0;
    if (tickerLower === qLower) score = 100;
    else if (tickerLower.startsWith(qLower)) score = 80;
    else if (tickerNorm.startsWith(qNorm)) score = 75;
    else if (nameLower.startsWith(qLower)) score = 60;
    else if (nameLower.includes(qLower)) score = 40;
    else if (nameNorm.includes(qNorm)) score = 35;
    else if (tickerLower.includes(qLower)) score = 30;

    return { entry, score };
  }).filter((r) => r.score > 0);

  scored.sort((a, b) => b.score - a.score || a.entry.ticker.localeCompare(b.entry.ticker));

  return scored.slice(0, limit).map((r) => r.entry);
}
