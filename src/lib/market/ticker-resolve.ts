/** Build Yahoo symbol candidates from exchange / country. */
export function resolveYahooSymbols(
  ticker: string,
  exchange?: string,
  country?: string
): string[] {
  const base = ticker.toUpperCase().replace(/\.(LG|NG|LAG|L)$/i, "");
  const ex = (exchange ?? "").toUpperCase();
  const c = (country ?? "").toLowerCase();

  const symbols = new Set<string>([base]);

  if (ex === "NGX" || c === "nigeria") {
    symbols.add(`${base}.LG`);
    symbols.add(`${base}.NG`);
    symbols.add(`${base}.LAG`);
  }
  if (ex === "LSE" || c === "uk" || c === "united kingdom") {
    symbols.add(`${base}.L`);
  }
  if (ex === "HKEX" || ex === "HKG" || c === "china" || c === "hong kong") {
    symbols.add(`${base}.HK`);
  }
  if (ex === "TSE" || c === "japan") {
    symbols.add(`${base}.T`);
  }

  return [...symbols];
}

export function isNgxListing(exchange?: string, country?: string): boolean {
  const ex = (exchange ?? "").toUpperCase();
  const c = (country ?? "").toLowerCase();
  return ex === "NGX" || c === "nigeria";
}
