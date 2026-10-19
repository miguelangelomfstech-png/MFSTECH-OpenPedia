"use client";

import { useEffect, useRef, useState } from "react";

type Hit = { title: string; slug: string; excerpt: string };

export function SearchBox({ placeholder, label }: { placeholder: string; label: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        if (r.ok) { setHits(await r.json()); setOpen(true); setActive(-1); }
      } catch { /* aborted */ }
    }, 150);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function onKey(e: React.KeyboardEvent) {
    if (!open || !hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? hits.length - 1 : a - 1)); }
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); window.location.href = `/wiki/${hits[active].slug}`; }
  }

  return (
    <div ref={box} className="relative w-full max-w-md">
      <form action="/search" role="search" className="flex">
        <label htmlFor="site-search" className="sr-only">{label}</label>
        <input
          id="site-search" name="q" type="search" autoComplete="off" value={q} placeholder={placeholder}
          onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} onFocus={() => hits.length && setOpen(true)}
          role="combobox" aria-expanded={open} aria-controls="search-suggestions" aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `sugg-${active}` : undefined}
          className="input rounded-full pl-4"
        />
      </form>
      {open && hits.length > 0 && (
        <ul id="search-suggestions" role="listbox" className="card absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden shadow-xl">
          {hits.map((h, i) => (
            <li key={h.slug} id={`sugg-${i}`} role="option" aria-selected={i === active}>
              <a href={`/wiki/${h.slug}`} className={`block px-4 py-2 ${i === active ? "bg-accent text-accent-ink" : "hover:bg-bg"}`}>
                <span className="font-semibold">{h.title}</span>
                <span className="block truncate text-xs opacity-80">{h.excerpt}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
