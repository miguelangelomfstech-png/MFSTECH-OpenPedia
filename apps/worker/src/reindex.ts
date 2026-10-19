import { db, articles, media, isNotNull, eq } from "@wiki/db";
import { enqueueSearch, ensureIndexes, redis } from "@wiki/shared";

await ensureIndexes();
const arts = await db.select({ id: articles.id }).from(articles).where(isNotNull(articles.currentRevisionId));
for (const a of arts) await enqueueSearch({ type: "article", articleId: a.id });
const ready = await db.select({ id: media.id }).from(media).where(eq(media.status, "ready"));
for (const m of ready) await enqueueSearch({ type: "media", mediaId: m.id });
console.log(`queued ${arts.length} articles and ${ready.length} media for indexing`);
redis().disconnect();
process.exit(0);
