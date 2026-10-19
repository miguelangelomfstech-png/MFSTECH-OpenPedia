import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { toString } from "hast-util-to-string";
import { visit } from "unist-util-visit";
import { publicUrl, slugify } from "@wiki/shared";

export type MediaView = {
  slug: string;
  kind: "image" | "video";
  status: string;
  width: number | null;
  height: number | null;
  originalKey: string;
  altText: string;
  renditions: { label: string; key: string; width: number | null }[];
};
export type RenderCtx = { exists: Set<string>; media: Map<string, MediaView> };
export type TocItem = { id: string; text: string; depth: number };

/* eslint-disable @typescript-eslint/no-explicit-any */
type H = any;
const el = (tagName: string, properties: Record<string, unknown> = {}, children: H[] = []): H => ({
  type: "element", tagName, properties, children,
});
const txt = (value: string): H => ({ type: "text", value });

const FILE = /^\[\[\s*file\s*:\s*([^\]|]+?)\s*(?:\|([^\]]*))?\]\]$/i;
const CAT = /\[\[\s*category\s*:[^\]]*\]\]/gi;
const LINK = /\[\[([^\[\]|]+?)(?:\|([^\[\]]*))?\]\]/g;

function figure(name: string, opts: string[], ctx: RenderCtx): H {
  const slug = slugify(name);
  const m = ctx.media.get(slug);
  const alt = opts.find((o) => /^alt=/i.test(o))?.replace(/^alt=/i, "").trim();
  const caption = opts.filter((o) => !/^(alt=|thumb|thumbnail|right|left|frame)/i.test(o.trim())).pop()?.trim();
  if (!m || m.status !== "ready") {
    const note = m ? "is still being processed" : "does not exist";
    return el("p", {}, [el("a", { href: `/file/${slug}`, className: ["redlink"] }, [txt(`File:${name}`)]), txt(` ${note}.`)]);
  }
  const r = (label: string) => m.renditions.find((x) => x.label === label);
  const body: H[] = [];
  if (m.kind === "image") {
    const web = [r("thumb-400"), r("webp-800"), r("webp-1600")].filter(Boolean) as MediaView["renditions"];
    const fallback = r("webp-800") ?? r("thumb-400");
    const useOriginal = !fallback;
    body.push(el("a", { href: `/file/${slug}` }, [
      el("img", {
        src: publicUrl(fallback?.key ?? m.originalKey),
        ...(web.length > 1 && {
          srcSet: web.map((x) => `${publicUrl(x.key)} ${x.width}w`).join(", "),
          sizes: "(min-width: 768px) 22rem, 100vw",
        }),
        alt: alt ?? (m.altText || caption || name),
        loading: "lazy", decoding: "async",
        ...(!useOriginal && m.width && m.height ? { width: m.width, height: m.height } : {}),
      }),
    ]));
  } else {
    const sources = ["360p", "720p", "1080p"].map(r).filter(Boolean) as MediaView["renditions"];
    const preferred = r("720p") ?? sources[sources.length - 1];
    body.push(el("video", {
      controls: true, preload: "none", playsInline: true,
      poster: r("poster") ? publicUrl(r("poster")!.key) : undefined,
      "aria-label": alt ?? (m.altText || caption || name),
    }, preferred ? [el("source", { src: publicUrl(preferred.key), type: "video/mp4" })] : []));
  }
  if (caption) body.push(el("figcaption", {}, [txt(caption)]));
  return el("figure", { className: ["wiki-figure"] }, body);
}

/** remark plugin: [[links]], [[File:...]] figures, [[Category:...]] stripping. */
function remarkWiki(ctx: RenderCtx) {
  return (tree: H) => {
    visit(tree, "paragraph", (node: H, index: number | undefined, parent: H) => {
      if (index === undefined || !parent) return;
      const only = node.children.length === 1 && node.children[0].type === "text" ? node.children[0].value.trim() : null;
      if (only !== null) {
        const stripped = only.replace(CAT, "").trim();
        if (!stripped && only) { parent.children.splice(index, 1); return ["skip", index]; }
        const m = FILE.exec(stripped);
        if (m) {
          const opts = (m[2] ?? "").split("|").map((s) => s.trim()).filter(Boolean);
          parent.children[index] = { type: "wikiMedia", data: { hName: "div", hChildren: [figure(m[1], opts, ctx)] } };
          return ["skip", index + 1];
        }
      }
    });

    visit(tree, "text", (node: H, index: number | undefined, parent: H) => {
      if (index === undefined || !parent || !node.value.includes("[[")) return;
      const value: string = node.value.replace(CAT, "");
      const out: H[] = [];
      let last = 0;
      for (const m of value.matchAll(LINK)) {
        const target = m[1].trim();
        if (/^file\s*:/i.test(target)) continue;
        const forced = target.startsWith(":");
        const [page, anchor] = (forced ? target.slice(1) : target).split("#");
        const slug = slugify(page);
        const label = (m[2] ?? "").trim() || page.trim();
        const missing = !ctx.exists.has(slug);
        if (m.index! > last) out.push({ type: "text", value: value.slice(last, m.index) });
        out.push({
          type: "link",
          url: missing ? `/wiki/${slug}/edit` : `/wiki/${slug}${anchor ? "#" + slugify(anchor) : ""}`,
          title: missing ? `${page.trim()} (page does not exist)` : null,
          data: { hProperties: missing ? { className: ["redlink"] } : {} },
          children: [{ type: "text", value: label }],
        });
        last = m.index! + m[0].length;
      }
      if (last === 0) { node.value = value; return; }
      if (last < value.length) out.push({ type: "text", value: value.slice(last) });
      parent.children.splice(index, 1, ...out);
      return ["skip", index + out.length];
    });
  };
}

const defaultA = ((defaultSchema.attributes?.a ?? []) as (string | [string, ...string[]])[])
  .filter((x) => !Array.isArray(x) || x[0] !== "className");

const schema: H = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "figure", "figcaption", "video", "source", "details", "summary", "mark", "kbd"],
  attributes: {
    ...defaultSchema.attributes,
    a: [...defaultA, ["className", "data-footnote-backref", "redlink", "external"]],
    figure: [["className", "wiki-figure"]],
    img: ["src", "srcSet", "sizes", "alt", "loading", "decoding", "width", "height", "title"],
    video: ["controls", "preload", "poster", "playsInline", "width", "height", "ariaLabel"],
    source: ["src", "type"],
  },
};

function externalLinks() {
  return (tree: H) => {
    visit(tree, "element", (n: H) => {
      if (n.tagName === "a" && typeof n.properties?.href === "string" && /^https?:\/\//i.test(n.properties.href)) {
        n.properties.rel = ["nofollow", "ugc", "noopener", "noreferrer"];
        n.properties.className = [...(n.properties.className ?? []), "external"];
      }
    });
  };
}

function collectToc(into: TocItem[]) {
  return (tree: H) => {
    visit(tree, "element", (n: H) => {
      const d = /^h([2-4])$/.exec(n.tagName);
      if (d && n.properties?.id) into.push({ id: String(n.properties.id), text: toString(n), depth: Number(d[1]) });
    });
  };
}

export async function renderMarkdown(source: string, ctx: RenderCtx): Promise<{ html: string; toc: TocItem[] }> {
  const toc: TocItem[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWiki, ctx)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeSlug)
    .use(externalLinks)
    .use(collectToc, toc)
    .use(rehypeStringify)
    .process(source);
  return { html: String(file), toc };
}
