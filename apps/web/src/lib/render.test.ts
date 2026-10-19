import { describe, it, expect } from "vitest";
import { renderMarkdown, type RenderCtx } from "./render";

const dummyCtx: RenderCtx = {
  exists: new Set(["earth", "solar-system"]),
  media: new Map([
    [
      "mars.jpg",
      {
        slug: "mars.jpg",
        kind: "image",
        status: "ready",
        width: 1200,
        height: 800,
        originalKey: "originals/1/mars.jpg",
        altText: "The red planet",
        renditions: [
          { label: "thumb-400", key: "derived/1/thumb-400.webp", width: 400 },
          { label: "webp-800", key: "derived/1/webp-800.webp", width: 800 },
        ],
      },
    ],
  ]),
};

describe("renderMarkdown", () => {
  it("renders basic markdown headings, bold, and lists", async () => {
    const md = "# Title\n\nSome **bold text** with a list:\n* Item A\n* Item B";
    const res = await renderMarkdown(md, dummyCtx);
    expect(res.html).toContain("<strong>bold text</strong>");
    expect(res.html).toContain("<li>Item A</li>");
  });

  it("links existing wiki pages with normal links and missing pages as redlinks", async () => {
    const md = "Visit [[Earth]] or explore [[Jupiter]].";
    const res = await renderMarkdown(md, dummyCtx);
    expect(res.html).toContain('<a href="/wiki/earth">Earth</a>');
    expect(res.html).toContain('<a href="/wiki/jupiter/edit"');
    expect(res.html).toContain('class="redlink"');
  });

  it("sanitizes dangerous XSS script tags and javascript: links", async () => {
    const attack = `<script>alert('pwned')</script>\n[click here](javascript:alert(1))`;
    const res = await renderMarkdown(attack, dummyCtx);
    expect(res.html).not.toContain("<script");
    expect(res.html).not.toContain("javascript:");
  });

  it("renders embedded media figures with lazy loading and captions", async () => {
    const md = "[[File:Mars.jpg|thumb|Photo of Mars|alt=A red sphere]]";
    const res = await renderMarkdown(md, dummyCtx);
    expect(res.html).toContain("<figure");
    expect(res.html).toContain('alt="A red sphere"');
    expect(res.html).toContain("<figcaption>Photo of Mars</figcaption>");
  });

  it("extracts table of contents items from headings", async () => {
    const md = "## Geology\n### Core\n## Atmosphere";
    const res = await renderMarkdown(md, dummyCtx);
    expect(res.toc).toHaveLength(3);
    expect(res.toc[0].text).toBe("Geology");
    expect(res.toc[1].text).toBe("Core");
    expect(res.toc[1].depth).toBe(3);
  });
});
