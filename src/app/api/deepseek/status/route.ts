import { NextResponse } from "next/server";
import { isDeepSeekConfigured } from "@/lib/services/deepseekService";

export async function GET() {
  const configured = isDeepSeekConfigured();
  return NextResponse.json({
    configured,
    model: "deepseek-v4-flash",
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    hint: configured
      ? "DeepSeek is active. Run analysis on any company page."
      : "Add DEEPSEEK_API_KEY to .env.local (not the placeholder) and restart npm run dev.",
  });
}
