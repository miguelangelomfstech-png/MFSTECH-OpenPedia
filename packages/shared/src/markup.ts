import { slugify } from "./constants";

export type ParsedMeta = {
  redirect: string | null;
  links: string[];
  categories: { title: string; slug: string }[];
  media: string[];
};

const WIKILINK = /\[\[([^\[\]|]+?)(?:\|([^\[\]]*))?\]\]/g;
const REDIRECT = /^\s*#redirect\s*\[\[([^\]|#]+)/i;

/** Extract structural metadata from article source. Pure and side-effect free. */
export function parseMeta(content: string): ParsedMeta {
  const links = new Set<string>();
  const media = new Set<string>();
  const cats = new Map<string, string>();
  const redirectMatch = REDIRECT.exec(content);

  for (const m of content.matchAll(WIKILINK)) {
    const target = m[1].trim();
    if (target.startsWith(":")) {
      links.add(slugify(target.slice(1).replace(/^category:/i, "")));
      continue;
    }
    const prefixed = /^(file|category)\s*:\s*(.+)$/i.exec(target);
    if (prefixed) {
      const name = prefixed[2].trim();
      if (prefixed[1].toLowerCase() === "category") cats.set(slugify(name), name);
      else media.add(slugify(name));
    } else {
      links.add(slugify(target.split("#")[0]));
    }
  }
  links.delete("");
  return {
    redirect: redirectMatch ? slugify(redirectMatch[1]) : null,
    links: [...links],
    categories: [...cats].map(([slug, title]) => ({ slug, title })),
    media: [...media],
  };
}

export { WIKILINK };
