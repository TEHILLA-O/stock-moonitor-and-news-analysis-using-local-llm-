import postgres from "postgres";

const db = process.env.DATABASE_URL || "";
const issues = [];
if (!db) issues.push("DATABASE_URL empty");
if (db.includes("[")) issues.push("contains [ brackets");
if (db.includes("]")) issues.push("contains ] bracket");
if (!db.includes("postgres.")) issues.push("missing postgres. user prefix");
if (!db.includes(":6543")) issues.push("not using pooler port 6543");
if (!/:[^/@]+@/.test(db)) issues.push("missing password segment");

console.log("URL checks:", issues.length ? issues.join(", ") : "format OK");
console.log(
  "URL preview:",
  db ? db.replace(/:([^:@/]+)@/, ":***@").slice(0, 90) : "(empty)"
);

const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
console.log(
  "Anon key:",
  anon?.startsWith("eyJ") ? "OK (JWT)" : anon ? "unusual format" : "missing"
);

if (!db) process.exit(1);

if (issues.length) {
  console.log("\nFix DATABASE_URL — copy full URI from Supabase Dashboard.");
  process.exit(1);
}

const sql = postgres(db, {
  prepare: false,
  ssl: "require",
  connect_timeout: 12,
});

try {
  const rows = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  const tables = rows.map((r) => r.tablename);
  console.log("CONNECT: OK");
  console.log("TABLES:", tables.join(", ") || "(none)");
  const expected = [
    "companies",
    "settings",
    "ai_analyses",
    "news_articles",
    "research_notes",
  ];
  const missing = expected.filter((t) => !tables.includes(t));
  console.log(missing.length ? `MISSING: ${missing.join(", ")}` : "SCHEMA: OK");
} catch (e) {
  console.log("CONNECT: FAIL");
  console.log(e.message?.split("\n")[0]);
  process.exit(1);
} finally {
  await sql.end();
}
