export const revalidate = 60;

import { db } from "@/lib/db";
import { WatchlistClient } from "./watchlist-client";

export default async function WatchlistPage() {
  const companies = await db.getCompanies().catch(() => []);
  return <WatchlistClient initialCompanies={companies} />;
}
