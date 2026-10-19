import { createSchema, createYoga } from "graphql-yoga";
import { db, articles, revisions, media, eq, and, desc, isNull, type SQL } from "@wiki/db";
import { meili, INDEX_ARTICLES, publicUrl, slugify, rateLimit, LIMITS } from "@wiki/shared";

type Ctx = { ip: string };

const typeDefs = /* GraphQL */ `
  type Article { id: ID! title: String! slug: String! featured: Boolean! updatedAt: String! markdown: String revisions(limit: Int = 10): [Revision!]! }
  type Revision { id: ID! summary: String! size: Int! createdAt: String! }
  type Media { id: ID! filename: String! slug: String! kind: String! license: String! description: String! url: String! status: String! }
  type SearchHit { title: String! slug: String! excerpt: String! }
  type Query {
    article(slug: String!): Article
    articles(limit: Int = 20, offset: Int = 0): [Article!]!
    media(limit: Int = 20, kind: String): [Media!]!
    search(q: String!, limit: Int = 10): [SearchHit!]!
  }
`;

const clamp = (n: number, max: number) => Math.min(max, Math.max(1, n));

const resolvers = {
  Query: {
    article: async (_: unknown, { slug }: { slug: string }) => {
      const [a] = await db.select().from(articles).where(and(eq(articles.namespace, "main"), eq(articles.slug, slugify(slug))));
      return a ?? null;
    },
    articles: (_: unknown, { limit, offset }: { limit: number; offset: number }) =>
      db.select().from(articles).where(and(eq(articles.namespace, "main"), isNull(articles.redirectToSlug)))
        .orderBy(desc(articles.updatedAt)).limit(clamp(limit, 100)).offset(Math.max(0, offset)),
    media: (_: unknown, { limit, kind }: { limit: number; kind?: string }) => {
      const conds: SQL[] = [eq(media.status, "ready")];
      if (kind === "image" || kind === "video") conds.push(eq(media.kind, kind));
      return db.select().from(media).where(and(...conds)).orderBy(desc(media.createdAt)).limit(clamp(limit, 100));
    },
    search: async (_: unknown, { q, limit }: { q: string; limit: number }) => {
      const r = await meili().index(INDEX_ARTICLES).search(q, { limit: clamp(limit, 25), filter: 'namespace = "main"' });
      return r.hits;
    },
  },
  Article: {
    updatedAt: (a: { updatedAt: Date }) => a.updatedAt.toISOString(),
    markdown: async (a: { currentRevisionId: string | null }) => {
      if (!a.currentRevisionId) return null;
      const [r] = await db.select({ c: revisions.content }).from(revisions).where(eq(revisions.id, a.currentRevisionId));
      return r?.c ?? null;
    },
    revisions: (a: { id: string }, { limit }: { limit: number }) =>
      db.select().from(revisions).where(eq(revisions.articleId, a.id)).orderBy(desc(revisions.createdAt)).limit(clamp(limit, 50)),
  },
  Revision: { createdAt: (r: { createdAt: Date }) => r.createdAt.toISOString() },
  Media: { url: (m: { originalKey: string }) => publicUrl(m.originalKey) },
};

const yoga = createYoga<Ctx>({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  landingPage: false,
  graphiql: process.env.NODE_ENV !== "production",
  maskedErrors: process.env.NODE_ENV === "production",
});

async function handler(req: Request, ctx: unknown) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  if (!(await rateLimit(`gql:${ip}`, LIMITS.api.limit, LIMITS.api.window)).ok) {
    return new Response(JSON.stringify({ errors: [{ message: "Rate limited" }] }), { status: 429, headers: { "content-type": "application/json" } });
  }
  return yoga.fetch(req, { ip, ...(ctx as object) });
}

export { handler as GET, handler as POST, handler as OPTIONS };
