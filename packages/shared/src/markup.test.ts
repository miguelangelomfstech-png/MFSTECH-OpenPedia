import { describe, it, expect } from "vitest";
import { parseMeta } from "./markup";
import { slugify, normalizeTitle } from "./constants";

describe("parseMeta", () => {
  it("extracts links, categories, media and redirects", () => {
    const m = parseMeta("See [[Eiffel Tower|the tower]] and [[Paris]].\n[[File:Tower.jpg|thumb|A tower]]\n[[Category:Landmarks]]");
    expect(m.links).toEqual(["eiffel-tower", "paris"]);
    expect(m.media).toEqual(["tower.jpg"]);
    expect(m.categories).toEqual([{ slug: "landmarks", title: "Landmarks" }]);
    expect(m.redirect).toBeNull();
  });
  it("detects redirects", () => {
    expect(parseMeta("#REDIRECT [[Big Apple]]").redirect).toBe("big-apple");
  });
});

describe("slugs", () => {
  it("normalises", () => {
    expect(slugify("  New York City ")).toBe("new-york-city");
    expect(normalizeTitle("new_york  city")).toBe("New york city");
  });
});
