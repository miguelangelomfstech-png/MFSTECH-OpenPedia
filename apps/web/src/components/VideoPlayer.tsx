"use client";

import { useState } from "react";

export type Source = { label: string; url: string; height: number | null };

export function VideoPlayer({ sources, poster, alt }: { sources: Source[]; poster?: string; alt: string }) {
  const [idx, setIdx] = useState(Math.max(0, sources.findIndex((s) => s.label === "720p")));
  const [key, setKey] = useState(0);
  const cur = sources[idx] ?? sources[0];
  if (!cur) return null;

  function change(i: number, el: HTMLSelectElement) {
    // Preserve playback position when switching quality.
    const v = el.closest("figure")!.querySelector("video")!;
    const t = v.currentTime, playing = !v.paused;
    setIdx(i);
    setKey((k) => k + 1);
    requestAnimationFrame(() => {
      const nv = el.closest("figure")!.querySelector("video")!;
      nv.currentTime = t;
      if (playing) void nv.play();
    });
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-black">
      <video key={key} controls preload="metadata" playsInline poster={poster} aria-label={alt} className="aspect-video w-full">
        <source src={cur.url} type="video/mp4" />
      </video>
      {sources.length > 1 && (
        <figcaption className="flex items-center gap-2 bg-surface p-2 text-sm">
          <label htmlFor="quality">Quality</label>
          <select id="quality" className="input !w-auto !min-h-8 !py-1" value={idx} onChange={(e) => change(Number(e.target.value), e.target)}>
            {sources.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
          </select>
        </figcaption>
      )}
    </figure>
  );
}
