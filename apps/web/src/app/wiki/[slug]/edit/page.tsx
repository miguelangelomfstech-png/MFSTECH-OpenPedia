import { notFound } from "next/navigation";
import Link from "next/link";
import { canEdit, db, articles, eq, and } from "@wiki/db";
import { slugify, NAMESPACES, type Namespace } from "@wiki/shared";
import { getArticle } from "@/lib/content";
import { getViewer } from "@/lib/viewer";
import { ArticleTabs } from "@/components/ArticleTabs";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit", robots: { index: false } };
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ns?: string; title?: string }> };

export default async function EditPage({ params, searchParams }: Props) {
  const raw = decodeURIComponent((await params).slug);
  const slug = slugify(raw);
  const sp = await searchParams;
  const ns = (NAMESPACES as readonly string[]).includes(sp.ns ?? "") ? (sp.ns as Namespace) : "main";
  const { actor } = await getViewer();
  const data = await getArticle(ns, slug);

  const protection = data?.article.protection ?? "none";
  if (!canEdit(actor, protection)) {
    return (
      <>
        <ArticleTabs slug={slug} active="edit" ns={ns} />
        <h1 className="font-serif text-3xl font-bold">View source</h1>
        <p className="mt-2 text-muted">
          {actor.blocked ? "You are blocked from editing." : `This page is ${protection}-protected.`} You can copy the source below or discuss on the talk page.
        </p>
        <pre className="card mt-4 overflow-auto p-4 text-sm">{data?.revision.content}</pre>
      </>
    );
  }
  const title = data?.article.title ?? raw.replace(/[-_]/g, " ");
  return (
    <>
      <ArticleTabs slug={slug} active="edit" ns={ns} />
      <h1 className="mb-6 font-serif text-3xl font-bold">{data ? `Editing ${title}` : `Creating ${title}`}</h1>
      {!actor.userId && (
        <p className="card mb-4 p-3 text-sm">You are not logged in. Your IP address hash will be recorded. <Link className="text-accent underline" href="/login">Log in</Link> to get credit.</p>
      )}
      <Editor ns={ns} title={title} titleLocked={!!data} initial={data?.revision.content ?? ""} baseRevisionId={data?.revision.id ?? null} />
    </>
  );
}
