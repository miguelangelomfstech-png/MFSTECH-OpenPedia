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

function isRecipeQuery(q: string): boolean {
  return /receita|ingrediente|como fazer|preparo|modo de preparo|bolo|torta|pão|doce|sobremesa|salgado|culin[aá]ria|recipe|cook|bake|receta|recette|ricetta/i.test(
    q
  );
}

function cleanRecipeSearchTerm(q: string): string {
  let s = q.trim().replace(/[?.,!;:]/g, "");
  s = s.replace(
    /^(qual\s+a\s+receita\s+de\s+(fazer\s+)?|como\s+(fazer|preparar)\s+(um|uma)?\s*|receita\s+(de\s+)?|passo\s+a\s+passo\s+(de\s+)?)/i,
    ""
  );
  s = s.replace(/^(what\s+is\s+the\s+recipe\s+for\s+|how\s+to\s+(make|bake|cook)\s+|recipe\s+for\s+)/i, "");
  s = s.replace(/^(cu[aá]l\s+es\s+la\s+receta\s+de\s+|c[oó]mo\s+hacer\s+|receta\s+de\s+)/i, "");
  return s.trim();
}

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

async function fetchWikibooksRecipe(query: string, lang = "pt", mode: "article" | "summary" | "bullet" = "article") {
  const clean = cleanRecipeSearchTerm(query);
  const searchTerms = [clean, `Livro de receitas/${clean}`, `Receita de ${clean}`];

  for (const term of searchTerms) {
    try {
      const searchUrl = `https://${lang}.wikibooks.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&utf8=1&format=json`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "MFSTECH-OpenPedia/1.0" },
        signal: AbortSignal.timeout(3500),
      }).then((r) => r.json());

      const results = res?.query?.search || [];
      if (results.length > 0) {
        const best =
          results.find(
            (r: { title: string }) =>
              r.title.toLowerCase().includes("receita") || r.title.toLowerCase().includes(clean.toLowerCase())
          ) || results[0];

        const extUrl = `https://${lang}.wikibooks.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(best.title)}&format=json`;
        const extRes = await fetch(extUrl, {
          headers: { "User-Agent": "MFSTECH-OpenPedia/1.0" },
          signal: AbortSignal.timeout(3500),
        }).then((r) => r.json());

        const pages = extRes?.query?.pages || {};
        const pageId = Object.keys(pages)[0];
        const fullText = pages[pageId]?.extract as string | undefined;

        if (fullText && fullText.length > 50) {
          const displayTitle = best.title.replace(/^Livro de receitas\//i, "").trim();

          if (mode === "summary") {
            const shortText = fullText.slice(0, 600).trim();
            return `## Receita de ${displayTitle}\n\n${shortText}`;
          }

          if (mode === "bullet") {
            const lines = fullText
              .split("\n")
              .map((l: string) => l.trim())
              .filter((l: string) => l.length > 5 && !l.startsWith("=="))
              .slice(0, 10);
            return `## Receita de ${displayTitle}\n\n` + lines.map((l: string) => `- ${l}`).join("\n");
          }

          let formatted = `## Receita de ${displayTitle}\n\n`;
          formatted += fullText
            .replace(/==+/g, "###")
            .replace(/\n\s*\n\s*\n/g, "\n\n")
            .trim();
          formatted += `\n\n*Fonte verificada: [Wikilivros - ${best.title}](https://${lang}.wikibooks.org/wiki/${encodeURIComponent(best.title)})*`;
          return formatted;
        }
      }
    } catch {
      // Continue
    }
  }
  return null;
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
    const recipeQuery = isRecipeQuery(query);

    let instruction = "";
    if (recipeQuery) {
      instruction = `Você é um assistente culinário prático e direto.
Responda diretamente e com máxima precisão no idioma ${targetLang} ao pedido de receita: "${query}".
Forneça os Ingredientes completos com medidas claras e o Modo de Preparo passo a passo numerado em Markdown.
NÃO conte histórias sobre a origem ou história do prato. Vá direto aos ingredientes e ao modo de fazer.`;
    } else if (mode === "article") {
      instruction = `Você é um assistente enciclopédico factual e claro.
Responda diretamente e com precisão no idioma ${targetLang} sobre: "${query}".
Apresente os factos essenciais, contexto e detalhes explicados com títulos ## em Markdown. Não adicione saudações.`;
    } else if (mode === "summary") {
      instruction = `Responda de forma factual, concisa e direta em 2 a 3 parágrafos em ${targetLang} sobre: "${query}".`;
    } else {
      instruction = `Liste em tópicos (bullet points) os principais factos, informações ou passos essenciais em ${targetLang} sobre: "${query}".`;
    }

    let generatedText = "";

    // Strategy 1: Pollinations generative tier with tailored intent prompt (strict 4s timeout)
    try {
      const getUrl = `https://text.pollinations.ai/${encodeURIComponent(instruction)}?model=openai-fast`;
      const res = await fetch(getUrl, {
        headers: { "User-Agent": "MFSTECH-OpenPedia/1.0" },
        signal: AbortSignal.timeout(4000),
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
      // Continue to next tier
    }

    // Strategy 2: If query is a recipe/culinary instruction, fetch from Wikibooks Recipes
    if (!generatedText && recipeQuery) {
      try {
        const recipeResult = await fetchWikibooksRecipe(query, language, mode);
        if (recipeResult && recipeResult.trim().length > 50) {
          generatedText = recipeResult.trim();
        }
      } catch {
        // Continue
      }
    }

    // Strategy 3: Factual Encyclopedic Resolver from Wikipedia
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

    // Strategy 4: DuckDuckGo Instant Answer API fallback
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

    // Safe fallback if all online sources fail
    if (!generatedText || generatedText.trim().length === 0) {
      generatedText = `Não foi possível obter uma resposta imediata para "${query}". Utilize os links abaixo do Perplexity ou DuckDuckGo AI para obter a resposta completa com um clique.`;
    }

    const finalTitle = deriveArticleTitle(query, generatedText, language);

    const encodedQuery = encodeURIComponent(query);
    const perplexityUrl = `https://www.perplexity.ai/search?q=${encodedQuery}`;
    const duckduckgoUrl = `https://duckduckgo.com/?q=${encodedQuery}&ia=chat`;

    return NextResponse.json({
      text: generatedText.trim(),
      title: finalTitle,
      query,
      perplexityUrl,
      duckduckgoUrl,
    });
  } catch (e) {
    console.error("AI research API error:", e);
    return NextResponse.json({ error: "Falha ao processar a pesquisa." }, { status: 500 });
  }
}

function cleanTitleCapitalization(str: string): string {
  if (!str) return "";
  const lowercaseWords = new Set([
    "de", "do", "da", "dos", "das", "e", "em", "para", "por", "com", "a", "o", "as", "os", "um", "uma",
    "of", "the", "in", "on", "at", "to", "for", "and", "an",
    "del", "y", "en", "di", "ed", "du", "des", "d'", "l'"
  ]);

  const words = str.trim().split(/\s+/);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && lowercaseWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function deriveArticleTitle(query: string, text?: string, lang = "pt"): string {
  // 1. Try to extract first prominent heading from markdown text
  if (text) {
    const headings = text.match(/^\s*#+\s*([^\n\r]+)/gm);
    if (headings) {
      const genericHeadingPatterns = [
        /^ingredientes?/i,
        /^modo de preparo/i,
        /^preparo/i,
        /^passo a passo/i,
        /^instruções/i,
        /^instrucoes/i,
        /^resumo/i,
        /^introdução/i,
        /^introducao/i,
        /^visão geral/i,
        /^visao geral/i,
        /^contexto/i,
        /^história e contexto/i,
        /^notas/i,
        /^referências/i,
        /^referencias/i,
        /^fontes/i,
        /^conclusão/i,
        /^conclusao/i,
        /^dicas?/i,
        /^ingredients?/i,
        /^instructions?/i,
        /^preparation/i,
        /^method/i,
        /^summary/i,
        /^introduction/i,
        /^overview/i,
        /^preparación/i,
        /^preparacion/i,
        /^resumen/i,
        /^introducción/i,
        /^introduccion/i,
        /^ingrédients/i,
        /^préparation/i,
        /^résumé/i,
        /^preparazione/i,
        /^riassunto/i,
      ];

      for (const rawHeading of headings) {
        const cleanH = rawHeading
          .replace(/^\s*#+\s*/, "")
          .replace(/[*_`\[\]]/g, "")
          .replace(/^[0-9.]+\s*/, "")
          .trim();

        const isGeneric = genericHeadingPatterns.some((pattern) => pattern.test(cleanH));
        if (!isGeneric && cleanH.length >= 3 && cleanH.length <= 100) {
          return cleanTitleCapitalization(cleanH);
        }
      }
    }
  }

  // 2. Derive from query
  let clean = query.trim().replace(/[?.,!;:]+$/g, "").trim();

  const prefixes = [
    // Portuguese
    /^qual\s+a\s+receita\s+(de\s+(fazer\s+)?)?/i,
    /^como\s+(fazer|preparar|cozinhar)\s+(um|uma)?\s*/i,
    /^passo\s+a\s+passo\s+(de\s+(fazer\s+)?)?/i,
    /^quem\s+(descobriu|achou)\s+(o|a|os|as)?\s*/i,
    /^quem\s+(foi|é|era|são)\s+(o|a|os|as)?\s*/i,
    /^o\s+que\s+(é|foi|são|era)\s+(o|a|os|as)?\s*/i,
    /^como\s+(funciona|operam|age)\s+(o|a|os|as)?\s*/i,
    /^me\s+fale\s+sobre\s+(o|a|os|as)?\s*/i,
    /^fale\s+sobre\s+(o|a|os|as)?\s*/i,
    /^conte\s+sobre\s+(o|a|os|as)?\s*/i,
    // English
    /^what\s+is\s+the\s+recipe\s+for\s+/i,
    /^how\s+to\s+(make|bake|cook|prepare)\s+/i,
    /^who\s+(discovered|found)\s*(the)?\s*/i,
    /^who\s+(was|is|were|are)\s*(the|a)?\s*/i,
    /^what\s+(is|was|are|were)\s*(the|a)?\s*/i,
    /^tell\s+me\s+about\s+/i,
    // Spanish
    /^cu[aá]l\s+es\s+la\s+receta\s+(de\s+)?/i,
    /^c[oó]mo\s+(hacer|preparar|cocinar)\s+(un|una)?\s*/i,
    /^qui[eé]n\s+(descubri[oó]|encontr[oó])\s*(el|la)?\s*/i,
    /^qui[eé]n\s+(fue|es|era)\s*(el|la)?\s*/i,
    /^qu[eé]\s+(es|fue|son)\s*(el|la|los|las)?\s*/i,
    // French
    /^quelle\s+est\s+la\s+recette\s+(de\s+)?/i,
    /^comment\s+(faire|préparer|cuisiner)\s+(un|une)?\s*/i,
    /^qui\s+(a\s+découvert|a\s+trouvé)\s*(le|la|les|l')?\s*/i,
    /^qui\s+(est|était)\s*(le|la|l')?\s*/i,
    /^qu'est-ce\s+que\s*/i,
    // Italian
    /^qual\s+[eè]\s+la\s+ricetta\s+(per|di)\s+/i,
    /^come\s+(fare|preparare|cucinare)\s+(un|una)?\s*/i,
    /^chi\s+(ha\s+scoperto|ha\s+trovato)\s*(il|la|lo)?\s*/i,
    /^chi\s+(era|[eè])\s*(il|la|lo)?\s*/i,
    /^che\s+cos'[eè]\s*/i,
    /^cos'[eè]\s*/i,
  ];

  for (const prefix of prefixes) {
    if (prefix.test(clean)) {
      clean = clean.replace(prefix, "").trim();
      break;
    }
  }

  // Handle discover queries
  if (/^quem\s+(descobriu|achou)/i.test(query)) {
    return cleanTitleCapitalization(lang === "pt" ? `Descobrimento do ${clean}` : clean);
  }
  if (/^who\s+(discovered|found)/i.test(query)) {
    return cleanTitleCapitalization(lang === "en" ? `Discovery of ${clean}` : clean);
  }
  if (/^qui[eé]n\s+(descubri[oó]|encontr[oó])/i.test(query)) {
    return cleanTitleCapitalization(lang === "es" ? `Descubrimiento de ${clean}` : clean);
  }

  // Handle recipe queries
  if (isRecipeQuery(query)) {
    const term = cleanRecipeSearchTerm(query);
    if (term) clean = term;
  }

  return cleanTitleCapitalization(clean || query.trim());
}
