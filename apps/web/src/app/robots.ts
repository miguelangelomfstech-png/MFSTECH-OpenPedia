import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/search", "/upload", "/watchlist", "/*/edit", "/*/history", "/*/diff"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
