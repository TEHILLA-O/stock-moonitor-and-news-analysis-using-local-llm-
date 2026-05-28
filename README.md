# Private Market Research Assistant

A personal investment research dashboard for private use only. Track watchlist companies, view financial metrics and news, document research notes, and run DeepSeek AI analysis with transparent scoring.

**This app is not financial advice.** All outputs are for private research purposes only.

## Features (MVP)

- **Watchlist** — Add, edit, delete companies (ticker, exchange, sector, status)
- **Company dashboard** — Price chart, metrics, news, AI scores, trend snapshots
- **Mock data** — Demo financials and news for AAPL, MSFT, NVDA (easy to swap for real APIs)
- **DeepSeek AI** — News sentiment, financial scoring, buy/hold/watch/avoid decisions
- **Research journal** — Thesis, notes, tags, decisions per company
- **Score breakdown** — Weighted transparent scoring with Recharts visualization
- **Trend tracking** — Snapshots recorded on each AI analysis run

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn-style UI components
- Recharts
- PostgreSQL schema (Drizzle) + local JSON store fallback
- DeepSeek API (OpenAI-compatible SDK)
- Server-side API routes only for secrets

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DEEPSEEK_API_KEY=your_deepseek_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
NEXT_PUBLIC_APP_NAME=Private Market Research Assistant
DATABASE_URL=your_database_url_here
FINANCIAL_API_KEY=optional_later
NEWS_API_KEY=optional_later
NEWS_PROVIDER=free
```

> **Without `DATABASE_URL`:** The app uses a local JSON file at `.data/store.json` (seeded with AAPL, MSFT, NVDA).

> **Without `DEEPSEEK_API_KEY`:** Mock deterministic analysis is used so you can explore the UI.

> **News (no key required):** Default provider `free` uses [The Hear API](https://www.thehear.org/api) for US/UK/China headlines plus regional RSS and Google News RSS for all regions including Nigeria. Optional `NEWS_API_KEY` merges in when set.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Setup (Optional)

For PostgreSQL (Neon, Supabase, or local):

1. Set `DATABASE_URL` in `.env.local`
2. Run the schema:

```bash
psql $DATABASE_URL -f sql/schema.sql
```

The app currently uses the in-memory/JSON store by default. Drizzle schema is in `src/lib/db/schema.ts` for future PostgreSQL integration.

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview of watchlist |
| `/watchlist` | Manage companies |
| `/company/[ticker]` | Company overview + AI analysis |
| `/company/[ticker]/financials` | Financial metrics |
| `/company/[ticker]/news` | News with AI classification |
| `/company/[ticker]/research` | Research journal + AI |
| `/settings` | Provider config & status |

## API Routes (Server-side)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/companies` | GET, POST | List / create companies |
| `/api/companies/[id]` | GET, PATCH, DELETE | Company CRUD |
| `/api/analysis` | POST | Run DeepSeek analysis |
| `/api/news?companyId=` | GET | Fetch & store news |
| `/api/financials?ticker=` | GET | Fetch financials |
| `/api/research` | GET, POST | Research notes |
| `/api/trends?companyId=` | GET | Trend snapshots |
| `/api/settings` | GET, PATCH | App settings |

## Scoring System

| Factor | Weight |
|--------|--------|
| Financial health | 25% |
| Growth | 20% |
| Valuation | 20% |
| News sentiment | 15% |
| Price momentum | 10% |
| Risk (inverted) | 10% |

## Market Data (free tiers)

| Source | Role | Key required |
|--------|------|----------------|
| **Yahoo Finance** (`yahoo-finance2`) | OHLCV, quotes, fundamentals | No |
| **Alpha Vantage** | Fundamentals overlay, backup OHLCV | `FINANCIAL_API_KEY` |
| **NGX Pulse** | NGX stocks, indices, ETFs, ticker tape | `NGX_PULSE_API_KEY` ([free tier](https://www.ngxpulse.ng/api)) |
| **Finnhub** | Quote metrics, company news | `FINNHUB_API_KEY` (optional) |
| **SEC EDGAR** | 10-K, 10-Q, 8-K filings | No |

Default `FINANCIAL_PROVIDER=auto` merges Yahoo + your Alpha Vantage key + Finnhub if set.

**Technical tab:** candlesticks, daily/weekly/monthly, SMA 20/50/200, RSI, MACD, volume.

**SEC tab:** official filings with links to sec.gov.

Free data is delayed and rate-limited — suitable for private research, not live trading.

```env
FINANCIAL_PROVIDER=auto
FINANCIAL_API_KEY=your_alphavantage_key
FINNHUB_API_KEY=optional
NEWS_PROVIDER=free
```

- `src/lib/market/` — Yahoo, Alpha Vantage, Finnhub, SEC providers
- `src/lib/services/financialDataService.ts` — unified fetch + cache
- `src/lib/services/newsService.ts` — free news + NewsAPI + Finnhub news
- `src/lib/services/deepseekService.ts` — AI buy/watch/avoid scoring

## DeepSeek Configuration

Uses OpenAI-compatible SDK:

```typescript
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
});
// Model: deepseek-v4-flash
```

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Pages with sidebar layout
│   └── api/             # Server API routes
├── components/
│   ├── charts/          # Recharts
│   ├── company/         # Company UI
│   ├── layout/          # Shell, sidebar, disclaimer
│   ├── research/        # Research journal
│   ├── ui/              # shadcn-style primitives
│   └── watchlist/
└── lib/
    ├── db/              # Schema + data store
    ├── mock/            # Mock financial/news data
    ├── services/        # Provider abstractions
    ├── scoring/         # Weighted score calculator
    └── types/
sql/schema.sql           # PostgreSQL DDL
```

## Disclaimer

This application is for **private investment research only**. All data, scores, and AI outputs are informational and do **not** constitute financial advice, investment recommendations, or solicitation to buy or sell securities.

## License

Private use.
