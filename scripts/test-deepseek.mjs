import { readFileSync, existsSync } from "fs";
import OpenAI from "openai";

function loadKey() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const match = readFileSync(file, "utf8").match(/^DEEPSEEK_API_KEY=(.+)$/m);
    const key = match?.[1]?.trim();
    if (key?.startsWith("sk-") && key !== "your_deepseek_key_here") return key;
  }
  return null;
}

const apiKey = loadKey();
if (!apiKey) {
  console.log("FAIL: no key");
  process.exit(1);
}

const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
const res = await client.chat.completions.create({
  model: "deepseek-v4-flash",
  messages: [{ role: "user", content: "Reply with exactly: connected" }],
  max_tokens: 10,
});
console.log("PASS:", res.choices[0]?.message?.content?.trim());
