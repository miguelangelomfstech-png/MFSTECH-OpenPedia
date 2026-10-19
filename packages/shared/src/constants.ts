/** Canonical URL slug: case-insensitive, spaces -> dashes, unicode preserved. */
export function slugify(title: string): string {
  return title
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\/?#%\\<>"|]/g, "")
    .replace(/\s+/g, "-");
}

/** Display title from user input: collapse whitespace, capitalise first letter. */
export function normalizeTitle(title: string): string {
  const t = title.trim().replace(/[_\s]+/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const NAMESPACES = ["main", "talk", "category"] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"] as const;
export const VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"] as const;

export function mediaKind(mime: string): "image" | "video" | null {
  if ((IMAGE_MIME as readonly string[]).includes(mime)) return "image";
  if ((VIDEO_MIME as readonly string[]).includes(mime)) return "video";
  return null;
}

export const VIDEO_LADDER = [
  { label: "360p", height: 360, crf: 28, audioKbps: 96 },
  { label: "720p", height: 720, crf: 25, audioKbps: 128 },
  { label: "1080p", height: 1080, crf: 23, audioKbps: 160 },
] as const;
