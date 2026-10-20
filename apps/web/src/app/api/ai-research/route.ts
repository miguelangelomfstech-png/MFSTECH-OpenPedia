import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

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
      instruction = `Escreva um artigo enciclopédico factual, neutro e bem estruturado em Markdown (usando títulos ##, parágrafos limpos e secções) no idioma ${targetLang} sobre: "${query}". Evite saudações ou metadiscurso, forneça diretamente o conteúdo pronto para publicação.`;
    } else if (mode === "summary") {
      instruction = `Escreva um resumo conciso, informativo e factual de 2 a 3 parágrafos em Markdown no idioma ${targetLang} sobre: "${query}". Forneça diretamente o texto pronto para colar.`;
    } else {
      instruction = `Liste em tópicos (bullet points Markdown) os principais factos, datas, realizações e pontos-chave no idioma ${targetLang} sobre: "${query}". Forneça diretamente os tópicos.`;
    }

    const ctl = new AbortController();
    const timeout = setTimeout(() => ctl.abort(), 12000);

    let generatedText = "";
    try {
      const aiRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Você é um assistente enciclopédico de alta precisão para a plataforma MFSTECH-OpenPedia. Forneça texto limpo em Markdown, factual, sem opiniões, sem saudações e sem introduções supérfluas.",
            },
            { role: "user", content: instruction },
          ],
          model: "openai",
          seed: 42,
        }),
        signal: ctl.signal,
      });

      if (aiRes.ok) {
        generatedText = await aiRes.text();
      }
    } catch (err) {
      console.warn("Pollinations fetch failed or timed out:", err);
    } finally {
      clearTimeout(timeout);
    }

    // Fallback if network issue
    if (!generatedText || generatedText.trim().length === 0) {
      generatedText = `## ${query}\n\nInformação sobre "${query}". Utilize os links abaixo para consulta complementar e aprofundamento.`;
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
    return NextResponse.json({ error: "Falha temporária ao consultar a IA." }, { status: 500 });
  }
}
