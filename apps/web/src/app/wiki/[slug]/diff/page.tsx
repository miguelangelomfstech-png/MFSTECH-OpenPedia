import { notFound } from "next/navigation";
import { diffLines } from "diff";
import { db, revisions, eq } from "@wiki/db";
import { slugify } from "@wiki/shared";
import { ArticleTabs } from "@/components/ArticleTabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compare revisions", robots: { index: false } };
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string; to?: string }> };

export default async function DiffPage({ params, searchParams }: Props) {
  const slug = slugify(decodeURIComponent((await params).slug));
  const { from, to } = await searchParams;
  if (!from || !to) notFound();
  const [a] = await db.select().from(revisions).where(eq(revisions.id, from));
  const [b] = await db.select().from(revisions).where(eq(revisions.id, to));
  if (!a || !b || a.articleId !== b.articleId) notFound();
  const parts = diffLines(a.content, b.content);

  return (
    <>
      <ArticleTabs slug={slug} active="history" />
      <h1 className="mb-2 font-serif text-3xl font-bold">Changes</h1>
      <p className="mb-6 text-sm text-muted">
        {a.createdAt.toISOString().slice(0, 16).replace("T", " ")} → {b.createdAt.toISOString().slice(0, 16).replace("T", " ")}
        {b.summary && ` — ${b.summary}`}
      </p>
      <div className="card overflow-x-auto font-mono text-sm" role="region" aria-label="Diff" tabIndex={0}>
        {parts.map((p, i) => (
          <pre key={i} className={`whitespace-pre-wrap px-4 py-1 ${p.added ? "diff-add" : p.removed ? "diff-del" : "text-muted"}`}>
            <span aria-hidden className="mr-2 select-none">{p.added ? "+" : p.removed ? "−" : " "}</span>
            <span className="sr-only">{p.added ? "Added: " : p.removed ? "Removed: " : "Unchanged: "}</span>
            {p.value}
          </pre>
        ))}
      </div>
    </>
  );
}
