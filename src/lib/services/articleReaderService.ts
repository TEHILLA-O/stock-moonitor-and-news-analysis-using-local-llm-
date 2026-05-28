export interface ParsedArticle {
  title?: string;
  content: string;
  paragraphs: string[];
}

function stripTags(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | undefined {
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (ogTitle?.[1]) return stripTags(ogTitle[1]);

  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title?.[1]) return stripTags(title[1]);
  return undefined;
}

function extractMainHtml(html: string): string {
  const article = html.match(/<article[\s\S]*?<\/article>/i);
  if (article?.[0]) return article[0];

  const main = html.match(/<main[\s\S]*?<\/main>/i);
  if (main?.[0]) return main[0];

  const body = html.match(/<body[\s\S]*?<\/body>/i);
  return body?.[0] ?? html;
}

function toParagraphs(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 60)
    .slice(0, 30);
}

export async function fetchAndParseArticle(url: string): Promise<ParsedArticle> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "PrivateMarketResearchAssistant/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch article (${res.status})`);
  }

  const html = await res.text();
  const title = extractTitle(html);
  const main = extractMainHtml(html);
  const content = stripTags(main);
  const paragraphs = toParagraphs(content);

  return {
    title,
    content,
    paragraphs,
  };
}

export function validateHttpUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
