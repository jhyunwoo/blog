import { compare } from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context, MiddlewareHandler } from "hono";
import { createDb } from "./db";
import { admins, sessions } from "./schema";
import type { AppEnv } from "./types";
import { createId, hashSessionToken, randomToken } from "./crypto";

const cookieName = "__Host-blog_session";
const sessionDays = 7;

export async function ensureConfiguredAdmin(c: Context<AppEnv>) {
  const db = createDb(c.env.DB);
  const existing = await db.query.admins.findFirst({
    where: eq(admins.email, c.env.ADMIN_EMAIL)
  });

  if (existing) {
    return existing;
  }

  const [admin] = await db
    .insert(admins)
    .values({
      id: createId("adm"),
      email: c.env.ADMIN_EMAIL,
      passwordHash: c.env.ADMIN_PASSWORD_HASH,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .returning();

  if (!admin) {
    throw new Error("Failed to create configured admin");
  }

  return admin;
}

export async function loginAdmin(c: Context<AppEnv>, email: string, password: string) {
  const admin = await ensureConfiguredAdmin(c);

  if (admin.email !== email) {
    return null;
  }

  const ok = await compare(password, admin.passwordHash);
  if (!ok) {
    return null;
  }

  const token = randomToken();
  const tokenHash = await hashSessionToken(token, c.env.SESSION_SECRET);
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();
  const db = createDb(c.env.DB);

  await db.insert(sessions).values({
    id: createId("ses"),
    adminId: admin.id,
    tokenHash,
    expiresAt,
    createdAt: new Date().toISOString()
  });

  const isHttps = new URL(c.req.url).protocol === "https:";
  setCookie(c, cookieName, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "None" : "Lax",
    path: "/",
    maxAge: sessionDays * 24 * 60 * 60
  });

  return admin;
}

export async function logoutAdmin(c: Context<AppEnv>) {
  const token = getCookie(c, cookieName);
  if (token) {
    const tokenHash = await hashSessionToken(token, c.env.SESSION_SECRET);
    await createDb(c.env.DB).delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  const isHttps = new URL(c.req.url).protocol === "https:";
  deleteCookie(c, cookieName, {
    path: "/",
    secure: isHttps,
    sameSite: isHttps ? "None" : "Lax"
  });
}

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, cookieName);
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tokenHash = await hashSessionToken(token, c.env.SESSION_SECRET);
  const db = createDb(c.env.DB);
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date().toISOString())),
    with: {
      admin: true
    }
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("admin", session.admin);
  c.set("sessionId", session.id);
  await next();
};
