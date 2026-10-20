import { test, expect } from "@playwright/test";

test.describe("07: Core APIs & Health Endpoints", () => {
  test("GET /api/health returns 200 and healthy status", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("status", "ok");
  });

  test("GET /api/suggest?q=solar returns json suggestions array", async ({ request }) => {
    const res = await request.get("/api/suggest?q=solar");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("slug");
  });

  test("GET /sitemap.xml and /robots.txt are accessible", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
  });
});
