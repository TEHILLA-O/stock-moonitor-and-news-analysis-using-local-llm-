# Supabase setup

Your app stores **watchlist, notes, AI analyses, news cache, and settings** in Postgres when `DATABASE_URL` is set.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → pick a name and password (save the password).
3. Wait until the project is ready.

## 2. Run the database schema

1. In Supabase: **SQL Editor** → **New query**.
2. Copy the full contents of `sql/schema.sql` from this repo.
3. Click **Run**.

You should see tables: `companies`, `news_articles`, `ai_analyses`, `settings`, etc.

## 3. Get your connection string

1. **Project Settings** → **Database**.
2. Under **Connection string**, choose **URI**.
3. Copy the **Transaction** pooler string (recommended for Vercel), e.g.:

   ```
   postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

4. Replace `[PASSWORD]` with your database password.

## 4. Add to environment variables

**Local** — `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

DATABASE_URL=postgresql://postgres.[ref]:YOUR_PASSWORD@....pooler.supabase.com:6543/postgres
```

Get **URL** and **publishable key** from Supabase → **Project Settings** → **API**.

**Vercel** — Project → **Settings** → **Environment Variables**:

| Name | Notes |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable / anon key (safe for client) |
| `DATABASE_URL` | Pooler connection string (port **6543**) |
| `DEEPSEEK_API_KEY`, `NGX_PULSE_API_KEY`, etc. | Your other app keys |

## 5. Restart and verify

```bash
npm run dev
```

Open **Settings** — you should see **Database: Connected** when `DATABASE_URL` is set.

On first load, the app seeds **AAPL, MSFT, NVDA** if the database is empty.

## Local dev without Supabase

Leave `DATABASE_URL` unset (or commented out). Data is stored in `.data/store.json` on your machine only.

## Notes

- Free tier is enough for personal use.
- Use the **pooler** connection on Vercel (not the direct `:5432` URL) to avoid connection limits.
- Never commit `.env.local` or your database password to git.
