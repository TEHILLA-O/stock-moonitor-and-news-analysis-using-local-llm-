export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { defaultAppSettings } from "@/lib/db/default-settings";
import { WatchlistClient } from "./watchlist-client";

export default async function WatchlistPage() {
  const companies = await db.getCompanies().catch(() => [] as Awaited<
    ReturnType<typeof db.getCompanies>
  >);
  return <WatchlistClient initialCompanies={companies} />;
}
