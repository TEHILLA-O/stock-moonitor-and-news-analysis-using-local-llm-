export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { WatchlistClient } from "./watchlist-client";

export default async function WatchlistPage() {  const companies = await db.getCompanies();
  return <WatchlistClient initialCompanies={companies} />;
}
