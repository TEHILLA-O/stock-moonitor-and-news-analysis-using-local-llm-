import { createClient } from "@supabase/supabase-js";

const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log("URL:", base);
console.log("Key:", key?.startsWith("eyJ") ? "anon JWT" : "other");

const supabase = createClient(base, key);

const { data, error, count } = await supabase
  .from("companies")
  .select("id,ticker", { count: "exact", head: false })
  .limit(3);

if (error) {
  console.log("REST FAIL:", error.message, error.code);
  process.exit(1);
}

console.log("REST OK — companies table reachable");
console.log("Rows sample:", data);
console.log("Count:", count ?? data?.length);

const testId = crypto.randomUUID();
const ins = await supabase.from("companies").insert({
  id: testId,
  name: "Connection Test",
  ticker: `TST${Date.now() % 100000}`,
  exchange: "NGX",
  sector: "",
  country: "",
  notes: "",
  status: "watching",
});
if (ins.error) {
  console.log("INSERT FAIL:", ins.error.message);
  console.log("Hint: enable RLS policies in Supabase (see sql/supabase-rls.sql)");
} else {
  console.log("INSERT OK");
  await supabase.from("companies").delete().eq("id", testId);
}
