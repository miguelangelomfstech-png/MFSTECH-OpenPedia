"use client";

import { useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime";

type Phase = "idle" | "uploading" | "processing" | "ready" | "error";

export function UploadForm() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState("");
  const [slug, setSlug] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file") as File;
    if (!file?.size) return;
    setPhase("uploading"); setPct(0); setMsg("");
    try {
      const meta = {
        filename: ((fd.get("filename") as string) || file.name).trim(),
        mimeType: file.type, size: file.size,
        description: fd.get("description"), altText: fd.get("altText"),
        license: fd.get("license"), source: fd.get("source"),
      };
      const pre = await fetch("/api/media/presign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(meta) });
      const pj = await pre.json();
      if (!pre.ok) throw new Error(pj.error ?? "Upload rejected");
      setSlug(pj.slug);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", pj.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (ev) => ev.lengthComputable && setPct(Math.round((ev.loaded / ev.total) * 100));
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Storage rejected the upload (${xhr.status})`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      const done = await fetch("/api/media/complete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mediaId: pj.mediaId }) });
      if (!done.ok) throw new Error((await done.json()).error ?? "Could not start processing");
      setPhase("processing");

      for (let i = 0; i < 600; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const s = await (await fetch(`/api/media/${pj.mediaId}/status`)).json();
        if (s.status === "ready") { setPhase("ready"); return; }
        if (s.status === "failed") throw new Error(s.error ?? "Processing failed");
      }
      throw new Error("Processing is taking longer than expected. Check the file page later.");
    } catch (err) {
      setPhase("error"); setMsg((err as Error).message);
    }
  }

  const busy = phase === "uploading" || phase === "processing";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="file" className="mb-1 block text-sm font-semibold">File (images up to 25 MB, videos up to 1 GB)</label>
        <input id="file" name="file" type="file" accept={ACCEPT} required className="input" disabled={busy} />
      </div>
      <div>
        <label htmlFor="filename" className="mb-1 block text-sm font-semibold">File name on the wiki (optional)</label>
        <input id="filename" name="filename" className="input" placeholder="Eiffel_Tower.jpg" disabled={busy} />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-semibold">Description / caption</label>
        <textarea id="description" name="description" rows={3} maxLength={2000} className="input" disabled={busy} />
      </div>
      <div>
        <label htmlFor="altText" className="mb-1 block text-sm font-semibold">Alt text (for screen readers)</label>
        <input id="altText" name="altText" maxLength={300} className="input" disabled={busy} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="license" className="mb-1 block text-sm font-semibold">License</label>
          <select id="license" name="license" className="input" disabled={busy} defaultValue="CC-BY-SA-4.0">
            <option>CC0-1.0</option><option>CC-BY-4.0</option><option>CC-BY-SA-4.0</option><option>Public-domain</option><option>Fair-use</option>
          </select>
        </div>
        <div>
          <label htmlFor="source" className="mb-1 block text-sm font-semibold">Source / author</label>
          <input id="source" name="source" className="input" maxLength={500} disabled={busy} placeholder="Own work" />
        </div>
      </div>
      <button className="btn btn-primary" disabled={busy}>Upload</button>
      <div aria-live="polite" className="text-sm">
        {phase === "uploading" && (
          <div>
            <div className="h-2 overflow-hidden rounded bg-line"><div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1">Uploading… {pct}%</p>
          </div>
        )}
        {phase === "processing" && <p>Processing (transcoding, thumbnails)… you can leave this page.</p>}
        {phase === "ready" && <p className="text-accent">Done! <a className="underline" href={`/file/${slug}`}>View the file page</a>.</p>}
        {phase === "error" && <p role="alert" className="text-red">{msg}</p>}
      </div>
    </form>
  );
}
