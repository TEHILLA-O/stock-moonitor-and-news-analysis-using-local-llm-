export function formatNewsAge(isoDate: string, now = Date.now()): string {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return "Unknown";

  const diffMs = now - then;
  if (diffMs < 0) return "Just now";

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function formatFeedRefreshedAt(fetchedAt: Date | null): string {
  if (!fetchedAt) return "Not loaded yet";
  const age = formatNewsAge(fetchedAt.toISOString());
  return age === "Just now" ? "Updated just now" : `Updated ${age}`;
}
