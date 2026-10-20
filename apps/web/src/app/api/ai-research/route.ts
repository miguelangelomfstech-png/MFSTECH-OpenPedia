import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const requestSchema = z.object({
  query: z.string().trim().min(2, "A pesquisa deve ter pelo menos 2 caracteres").max(500),
  mode: z.enum(["article", "summary", "bullet"]).default("article"),
  language: z.enum(["pt", "en", "es", "fr", "it"]).default("pt"),
});

const languageNames: Record<string, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
  it: "Italiano",
};

function normalizeSearchQueries(q: string, lang = "pt"): string[] {
  const clean = q.trim().replace(/[?.,!;:]/g, "");
  const list: string[] = [];

  if (lang === "pt") {
    const descMatch = clean.match(/^quem\s+(descobriu|achou)\s+(o|a|os|as)?\s*(.*)$/i);
    if (descMatch && descMatch[3]) {
      list.push(`descobrimento ${descMatch[3]}`, `descoberta ${descMatch[3]}`, descMatch[3]);
    }
    const quemMatch = clean.match(/^quem\s+(foi|é|era|são)\s+(o|a|os|as)?\s*(.*)$/i);
    if (quemMatch && quemMatch[3]) {
      list.push(quemMatch[3]);
    }
    const oqueMatch = clean.match(/^(o\s+que\s+é|que\s+é|o\s+que\s+são|o\s+que\s+foi)\s+(o|a|os|as)?\s*(.*)$/i);
    if (oqueMatch && oqueMatch[3]) {
      list.push(oqueMatch[3]);
    }
    const comoMatch = clean.match(/^(como\s+funciona|como\s+operam|como\s+agir)\s+(o|a|os|as)?\s*(.*)$/i);
    if (comoMatch && comoMatch[3]) {
      list.push(comoMatch[3]);
    }
  } else if (lang === "en") {
    const descMatch = clean.match(/^who\s+(discovered|found)\s*(the)?\s*(.*)$/i);
    if (descMatch && descMatch[3]) {
      list.push(`discovery of ${descMatch[3]}`, descMatch[3]);
    }
    const whoMatch = clean.match(/^who\s+(was|is|were|are)\s*(the|a)?\s*(.*)$/i);
    if (whoMatch && whoMatch[3]) {
      list.push(whoMatch[3]);
    }
    const whatMatch = clean.match(/^what\s+(is|are|was|were)\s*(the|a)?\s*(.*)$/i);
    if (whatMatch && whatMatch[3]) {
      list.push(whatMatch[3]);
    }
  } else if (lang === "es") {
    const descMatch = clean.match(/^qui[eé]n\s+(descubri[oó]|encontr[oó])\s*(el|la|los|las)?\s*(.*)$/i);
    if (descMatch && descMatch[3]) {
      list.push(`descubrimiento de ${descMatch[3]}`, descMatch[3]);
    }
    const whoMatch = clean.match(/^qui[eé]n\s+(fue|es|era)\s*(el|la)?\s*(.*)$/i);
    if (whoMatch && whoMatch[3]) {
      list.push(whoMatch[3]);
    }
    const whatMatch = clean.match(/^qu[eé]\s+(es|fue|son)\s*(el|la|los|las)?\s*(.*)$/i);
    if (whatMatch && whatMatch[3]) {
      list.push(whatMatch[3]);
    }
  } else if (lang === "fr") {
    const descMatch = clean.match(/^qui\s+(a\s+d[eé]couvert|a\s+trouv[eé])\s*(le|la|les|l')?\s*(.*)$/i);
    if (descMatch && descMatch[3]) {
      list.push(`découverte de ${descMatch[3]}`, descMatch[3]);
    }
    const quiMatch = clean.match(/^qui\s+(est|[eé]tait)\s*(le|la|l')?\s*(.*)$/i);
    if (quiMatch && quiMatch[3]) {
      list.push(quiMatch[3]);
    }
  } else if (lang === "it") {
    const descMatch = clean.match(/^chi\s+(ha\s+scoperto|ha\s+trovato)\s*(il|la|lo|i|gli|le)?\s*(.*)$/i);
    if (descMatch && descMatch[3]) {
      list.push(`scoperta di ${descMatch[3]}`, descMatch[3]);
    }
    const chiMatch = clean.match(/^chi\s+(era|[eè])\s*(il|la|lo)?\s*(.*)$/i);
    if (chiMatch && chiMatch[3]) {
      list.push(chiMatch[3]);
    }
  }

  if (!list.includes(clean)) {
    list.push(clean);
  }
  return list;
}

async function fetchWikiFactual(query: string, lang = "pt", mode: "article" | "summary" | "bullet" = "article") {
  const candidates = normalizeSearchQueries(query, lang);
  let bestTitle = "";

  for (const c of candidates) {
    try {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(c)}&utf8=1&format=json`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "MFSTECH-OpenPedia/1.0" },
        signal: AbortSignal.timeout(3500),
      }).then((r) => r.json());

      const results = res?.query?.search || [];
      for (const r of results) {
        const titleLower = (r.title as string).toLowerCase();
        const isMediaOrFiction =
          titleLower.includes("(álbum)") ||
          titleLower.includes("(livro)") ||
          titleLower.includes("(filme)") ||
          titleLower.includes("(canção)") ||
          titleLower.includes("romance");
        if (!isMediaOrFiction) {
          bestTitle = r.title;
          break;
        }
      }
      if (bestTitle) break;
    } catch {
      // Continue to next candidate
    }
  }

  if (!bestTitle) return null;

  try {
    const sumUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`;
    const sum = await fetch(sumUrl, {
      headers: { "User-Agent": "MFSTECH-OpenPedia/1.0" },
      signal: AbortSignal.timeout(3500),
    }).then((r) => r.json());

    const extractUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(bestTitle)}&format=json`;
    const extRes = await fetch(extractUrl, {
      headers: { "User-Agent": "MFSTECH-OpenPedia/1.0" },
      signal: AbortSignal.timeout(3500),
    }).then((r) => r.json());

    const pages = extRes?.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const fullText = (pages[pageId]?.extract as string) || sum?.extract || "";

    if (!fullText) return null;

    if (mode === "summary") {
      return `## ${sum.title || bestTitle}\n\n${sum.extract || fullText.slice(0, 600)}`;
    }

    if (mode === "bullet") {
      const sentences = (sum.extract || fullText)
        .split(/(?<=[.?!])\s+/)
        .filter((s: string) => s.trim().length > 20)
        .slice(0, 6);
      return `## ${sum.title || bestTitle}\n\n` + sentences.map((s: string) => `- ${s.trim()}`).join("\n");
    }

    // Article mode
    const paragraphs = fullText.split(/\n\s*\n/).filter((p: string) => p.trim().length > 40);
    const lead = sum.extract || paragraphs[0] || "";
    const body = paragraphs.slice(1, 5).join("\n\n");

    let article = `## ${sum.title || bestTitle}\n\n${lead}\n\n`;
    if (body) {
      article += `### Contexto e Detalhes Históricos\n\n${body}\n\n`;
    }
    article += `*Fonte enciclopédica verificada: [Wikipédia - ${bestTitle}](https://${lang}.wikipedia.org/wiki/${encodeURIComponent(bestTitle)})*`;
    return article;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { query, mode, language } = parsed.data;
    const targetLang = languageNames[language] ?? "Português";

    let instruction = "";
    if (mode === "article") {
      instruction = `Escreva um artigo enciclopédico factual, detalhado e neutro em Markdown no idioma ${targetLang} sobre: "${query}". Destaque nomes, datas e contexto histórico com títulos ##. Não adicione saudações.`;
    } else if (mode === "summary") {
      instruction = `Responda de forma factual, concisa e direta em 2 a 3 parágrafos em ${targetLang} sobre: "${query}".`;
    } else {
      instruction = `Liste em tópicos (bullet points) os principais factos, datas e informações essenciais em ${targetLang} sobre: "${query}".`;
    }

    let generatedText = "";

    // Strategy 1: Pollinations fast tier (with strict 3.5s timeout)
    try {
      const getUrl = `https://text.pollinations.ai/${encodeURIComponent(instruction)}?model=openai-fast`;
      const res = await fetch(getUrl, {
        headers: { "User-Agent": "MFSTECH-OpenPedia/1.0" },
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const text = await res.text();
        if (
          text &&
          !text.includes("Free limit reached") &&
          !text.includes("Rate limit exceeded") &&
          !text.includes("Payment Required") &&
          text.trim().length > 40
        ) {
          generatedText = text.trim();
        }
      }
    } catch {
      // Fast fallback to encyclopedic engine
    }

    // Strategy 2: 100% Reliable, Factual Real-Time Encyclopedic Resolver
    if (!generatedText) {
      try {
        const wikiResult = await fetchWikiFactual(query, language, mode);
        if (wikiResult && wikiResult.trim().length > 50) {
          generatedText = wikiResult.trim();
        }
      } catch {
        // Continue
      }
    }

    // Strategy 3: DuckDuckGo Instant Answer API fallback
    if (!generatedText) {
      try {
        const ddgRes = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
          { signal: AbortSignal.timeout(3000) }
        ).then((r) => r.json());

        if (ddgRes?.AbstractText) {
          generatedText = `## ${ddgRes.Heading || query}\n\n${ddgRes.AbstractText}`;
        }
      } catch {
        // Continue
      }
    }

    // Safe meaningful fallback if all online sources fail
    if (!generatedText || generatedText.trim().length === 0) {
      generatedText = `Não foi possível obter uma resposta imediata para "${query}". Utilize os links abaixo do Perplexity ou DuckDuckGo AI para obter a resposta completa com um clique.`;
    }

    const encodedQuery = encodeURIComponent(query);
    const perplexityUrl = `https://www.perplexity.ai/search?q=${encodedQuery}`;
    const duckduckgoUrl = `https://duckduckgo.com/?q=${encodedQuery}&ia=chat`;

    return NextResponse.json({
      text: generatedText.trim(),
      query,
      perplexityUrl,
      duckduckgoUrl,
    });
  } catch (e) {
    console.error("AI research API error:", e);
    return NextResponse.json({ error: "Falha ao processar a pesquisa." }, { status: 500 });
  }
}
