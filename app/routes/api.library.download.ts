import { eq, and, sql } from "drizzle-orm";
import { db } from "~/db";
import { resource, resourceDownload, resourceBookmark } from "~/db/schema/library";
import { requireAuth } from "~/lib/auth";
import type { Route } from "./+types/api.library.download";

// ── In-memory rate limiter (swap for Redis/Upstash in production) ─────────
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): void {
  const now   = Date.now();
  const entry = rateLimits.get(userId);

  if (entry && now < entry.resetAt) {
    if (entry.count >= 10) {
      throw new Error("Rate limit: max 10 downloads per 15 minutes.");
    }
    entry.count++;
  } else {
    rateLimits.set(userId, { count: 1, resetAt: now + 15 * 60 * 1000 });
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session  = await requireAuth(request);
  const formData = await request.formData();
  const intent   = formData.get("intent") as string;

  switch (intent) {
    case "download": return handleDownload(formData, request, session.user.id);
    case "bookmark": return handleBookmark(formData, session.user.id);
    default:
      return Response.json({ error: "Unknown intent" }, { status: 400 });
  }
}

async function handleDownload(formData: FormData, request: Request, userId: string) {
  const resourceId = formData.get("resourceId") as string;
  if (!resourceId) return Response.json({ error: "Missing resourceId" }, { status: 400 });

  // Rate limit
  try {
    checkRateLimit(userId);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 429 });
  }

  const res = await db.query.resource.findFirst({
    where: eq(resource.id, resourceId),
    columns: {
      id: true, title: true, fileType: true, fileUrl: true,
      fileSize: true, isPublished: true, isPremium: true,
    },
  });

  if (!res || !res.isPublished) {
    return Response.json({ error: "Resource not found" }, { status: 404 });
  }

  // Premium gate (extend with subscription check when billing is ready)
  // if (res.isPremium) {
  //   const hasAccess = await checkSubscription(userId);
  //   if (!hasAccess) return Response.json({ error: "Premium required" }, { status: 403 });
  // }

  // Record download + increment atomically
  await Promise.all([
    db.insert(resourceDownload).values({
      resourceId,
      userId,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
    }),
    db
      .update(resource)
      // ✅ sql template — NOT resource.downloadCount + 1 (that reads stale JS value)
      .set({ downloadCount: sql`${resource.downloadCount} + 1` })
      .where(eq(resource.id, resourceId)),
  ]);

  // TODO: swap fileUrl for a signed Supabase URL before returning
  // const { data } = await supabase.storage.from("resources")
  //   .createSignedUrl(res.fileUrl, 300);
  // return Response.json({ success: true, downloadUrl: data.signedUrl, ... });

  return Response.json({
    success:     true,
    downloadUrl: res.fileUrl,
    fileName:    `${res.title}.${res.fileType}`,
    fileSize:    res.fileSize,
  });
}

async function handleBookmark(formData: FormData, userId: string) {
  const resourceId = formData.get("resourceId") as string;
  const add        = formData.get("action") === "add";

  if (!resourceId) return Response.json({ error: "Missing resourceId" }, { status: 400 });

  if (add) {
    await db
      .insert(resourceBookmark)
      .values({ resourceId, userId })
      .onConflictDoNothing(); // unique constraint handles duplicates
  } else {
    await db
      .delete(resourceBookmark)
      .where(and(
        eq(resourceBookmark.resourceId, resourceId),
        eq(resourceBookmark.userId,     userId),
      ));
  }

  return Response.json({ success: true, bookmarked: add });
}