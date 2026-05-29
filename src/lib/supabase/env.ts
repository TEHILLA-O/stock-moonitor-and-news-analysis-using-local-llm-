/** Supabase project URL + publishable (anon) key — safe for client bundles. */

/** Strip quotes and use the first JWT if the value was pasted multiple times. */
export function getSupabasePublishableKey(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!raw) return undefined;

  const cleaned = raw.replace(/^["']|["']$/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  const jwt = parts.find(
    (part) => part.startsWith("eyJ") && part.split(".").length === 3
  );
  if (jwt) return jwt;

  return parts[0];
}

export function getSupabaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;

  const cleaned = raw.replace(/^["']|["']$/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const url = parts.find((part) => part.startsWith("https://"));
  return url ?? parts[0];
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
