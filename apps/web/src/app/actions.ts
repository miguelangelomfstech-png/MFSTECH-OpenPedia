"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import {
  db, articles, revisions, users, watchlist, notifications, eq, and,
  saveRevision, EditError, isAdmin,
} from "@wiki/db";
import { LIMITS, rateLimit, slugify, enqueueSearch, NAMESPACES, type Namespace } from "@wiki/shared";
import { getViewer } from "@/lib/viewer";
import { renderContent } from "@/lib/content";

export type FormState = { error?: string; ok?: boolean; html?: string } | undefined;

const nsSchema = z.enum(NAMESPACES);

const pageUrl = (ns: Namespace, slug: string) =>
  ns === "talk" ? `/wiki/${slug}/talk` : ns === "category" ? `/category/${slug}` : `/wiki/${slug}`;

export async function saveArticle(_prev: FormState, fd: FormData): Promise<FormState> {
  const { actor, ip } = await getViewer();
  const rl = actor.userId ? LIMITS.editUser : LIMITS.editAnon;
  if (!(await rateLimit(`edit:${actor.userId ?? ip}`, rl.limit, rl.window)).ok) {
    return { error: "You are editing too quickly. Please wait a minute." };
  }
  const ns = nsSchema.safeParse(fd.get("ns") ?? "main");
  if (!ns.success) return { error: "Invalid namespace." };
  try {
    const r = await saveRevision({
      namespace: ns.data,
      title: String(fd.get("title") ?? ""),
      content: String(fd.get("content") ?? ""),
      summary: String(fd.get("summary") ?? ""),
      minor: fd.get("minor") === "on",
      baseRevisionId: (fd.get("baseRevisionId") as string) || null,
      actor,
    });
    revalidatePath("/", "layout");
    redirect(pageUrl(ns.data, r.slug));
  } catch (e) {
    if (e instanceof EditError) return { error: e.message };
    throw e;
  }
}

export async function previewMarkdown(content: string) {
  return (await renderContent(content.slice(0, 200_000))).html;
}

export async function restoreRevision(fd: FormData) {
  const { actor } = await getViewer();
  const revId = String(fd.get("revisionId"));
  const [row] = await db.select({ content: revisions.content, articleId: revisions.articleId, createdAt: revisions.createdAt })
    .from(revisions).where(eq(revisions.id, revId));
  if (!row) throw new Error("Revision not found");
  const [a] = await db.select().from(articles).where(eq(articles.id, row.articleId));
  try {
    await saveRevision({
      namespace: a.namespace, title: a.title, content: row.content, isRevert: true,
      summary: `Restored revision from ${row.createdAt.toISOString().slice(0, 16).replace("T", " ")}`, actor,
    });
  } catch (e) {
    if (e instanceof EditError) redirect(`${pageUrl(a.namespace, a.slug)}?error=${encodeURIComponent(e.message)}`);
    throw e;
  }
  revalidatePath("/", "layout");
  redirect(pageUrl(a.namespace, a.slug));
}

export async function toggleWatch(fd: FormData) {
  const { user } = await getViewer();
  if (!user) redirect("/login");
  const articleId = String(fd.get("articleId"));
  const [w] = await db.select().from(watchlist).where(and(eq(watchlist.userId, user.id), eq(watchlist.articleId, articleId)));
  if (w) await db.delete(watchlist).where(and(eq(watchlist.userId, user.id), eq(watchlist.articleId, articleId)));
  else await db.insert(watchlist).values({ userId: user.id, articleId }).onConflictDoNothing();
  revalidatePath("/watchlist");
}

export async function setProtection(fd: FormData) {
  const { actor } = await getViewer();
  if (!isAdmin(actor)) throw new Error("Forbidden");
  const level = z.enum(["none", "semi", "full"]).parse(fd.get("level"));
  const id = String(fd.get("articleId"));
  const [a] = await db.update(articles).set({ protection: level }).where(eq(articles.id, id)).returning();
  revalidatePath(pageUrl(a.namespace, a.slug));
}

export async function setFeatured(fd: FormData) {
  const { actor } = await getViewer();
  if (!isAdmin(actor)) throw new Error("Forbidden");
  const id = String(fd.get("articleId"));
  const on = fd.get("featured") === "1";
  const [a] = await db.update(articles).set({ featured: on, featuredAt: on ? new Date() : null }).where(eq(articles.id, id)).returning();
  await enqueueSearch({ type: "article", articleId: id });
  revalidatePath("/");
  revalidatePath(pageUrl(a.namespace, a.slug));
}

export async function blockUser(fd: FormData) {
  const { actor } = await getViewer();
  if (!isAdmin(actor)) throw new Error("Forbidden");
  const days = Number(fd.get("days") ?? 0);
  await db.update(users).set({
    blockedUntil: days > 0 ? new Date(Date.now() + days * 86400_000) : null,
    blockReason: String(fd.get("reason") ?? "").slice(0, 300),
  }).where(eq(users.id, String(fd.get("userId"))));
}

export async function markNotificationsRead() {
  const { user } = await getViewer();
  if (!user) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  revalidatePath("/", "layout");
}

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .regex(/^[\p{L}\p{N} _.-]+$/u, "Use letters, numbers, spaces, _ . -"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(10, "Password must be at least 10 characters").max(200),
  gdprConsent: z.literal("on", {
    errorMap: () => ({ message: "Must accept Privacy Policy (GDPR) to create account." }),
  }),
});

export async function register(_prev: FormState, fd: FormData): Promise<FormState> {
  const { ip } = await getViewer();
  if (!(await rateLimit(`register:${ip}`, LIMITS.register.limit, LIMITS.register.window)).ok) {
    return { error: "Too many registrations from your address. Try again later." };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;
  const dupe = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  const nameDupe = await db.select({ id: users.id }).from(users).where(eq(users.name, name));
  if (dupe.length || nameDupe.length) return { error: "That name or email is already registered." };
  await db.insert(users).values({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Account created! Please sign in on the login page." };
    throw e;
  }
}

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? ""),
      redirectTo: String(fd.get("next") || "/"),
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Invalid email or password." };
    throw e; // redirect
  }
}

export async function oauthLogin(fd: FormData) {
  await signIn(String(fd.get("provider")), { redirectTo: "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
