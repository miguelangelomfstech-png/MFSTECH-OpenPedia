import Link from "next/link";
import { getT } from "@/lib/i18n";

type Tab = "article" | "talk" | "edit" | "history";

export async function ArticleTabs({ slug, active, ns = "main" }: { slug: string; active: Tab; ns?: string }) {
  const t = await getT();
  const base = `/wiki/${slug}`;
  const nsq = ns === "category" ? "?ns=category" : "";
  const tabs: [Tab, string, string][] = [
    ["article", t("article"), ns === "category" ? `/category/${slug}` : base],
    ["talk", t("talk"), `${base}/talk`],
    ["edit", t("edit"), `${base}/edit${nsq}`],
    ["history", t("history"), `${base}/history${nsq}`],
  ];
  return (
    <nav aria-label="Page tabs" className="mb-6 flex gap-1 border-b border-line">
      {tabs.map(([k, label, href]) => (
        <Link key={k} href={href} aria-current={active === k ? "page" : undefined}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${active === k ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
