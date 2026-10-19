import { MeiliSearch } from "meilisearch";
import { env } from "./env";

export const INDEX_ARTICLES = "articles";
export const INDEX_MEDIA = "media";

export type ArticleDoc = {
  id: string;
  title: string;
  slug: string;
  namespace: string;
  excerpt: string;
  body: string;
  categories: string[];
  featured: boolean;
  updatedAt: number;
};

export type MediaDoc = {
  id: string;
  title: string;
  slug: string;
  kind: "image" | "video";
  description: string;
  license: string;
  thumbKey: string | null;
  createdAt: number;
};

let client: MeiliSearch | undefined;
export const meili = () =>
  (client ??= new MeiliSearch({ host: env().MEILI_HOST, apiKey: env().MEILI_MASTER_KEY || undefined }));

/** Idempotent index configuration; called by the worker on boot. */
export async function ensureIndexes() {
  const m = meili();
  await m.createIndex(INDEX_ARTICLES, { primaryKey: "id" }).catch(() => {});
  await m.createIndex(INDEX_MEDIA, { primaryKey: "id" }).catch(() => {});
  await m.index(INDEX_ARTICLES).updateSettings({
    searchableAttributes: ["title", "categories", "excerpt", "body"],
    filterableAttributes: ["namespace", "categories", "featured"],
    sortableAttributes: ["updatedAt"],
    displayedAttributes: ["id", "title", "slug", "namespace", "excerpt", "categories", "featured"],
    typoTolerance: { minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
  });
  await m.index(INDEX_MEDIA).updateSettings({
    searchableAttributes: ["title", "description"],
    filterableAttributes: ["kind", "license"],
    sortableAttributes: ["createdAt"],
  });
}

/** Strip markdown/html to plain text for indexing. */
export function toPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\[(?:File|Category):[^\]]*\]\]/gi, " ")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[\^[^\]]+\]/g, "")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
