import { and, eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { resource, resourceDownload } from "~/db/schema/library";
import { requireAuth } from "~/lib/auth";
import type { Route } from "./+types/api.library.analytics";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  if (session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url    = new URL(request.url);
  const period = url.searchParams.get("period") ?? "30d";

  const since = period === "7d"
    ? sql`NOW() - INTERVAL '7 days'`
    : period === "90d"
    ? sql`NOW() - INTERVAL '90 days'`
    : sql`NOW() - INTERVAL '30 days'`;

  const [overview] = await db
    .select({
      totalDownloads: sql<number>`COUNT(*)::int`,
      uniqueUsers:    sql<number>`COUNT(DISTINCT ${resourceDownload.userId})::int`,
      uniqueResources:sql<number>`COUNT(DISTINCT ${resourceDownload.resourceId})::int`,
    })
    .from(resourceDownload)
    .where(sql`${resourceDownload.downloadedAt} >= ${since}`);

  const topResources = await db
    .select({
      id:            resource.id,
      title:         resource.title,
      subject:       resource.subject,
      downloadCount: resource.downloadCount,
      recentDownloads: sql<number>`COUNT(${resourceDownload.id})::int`,
    })
    .from(resource)
    .leftJoin(resourceDownload, and(
      eq(resourceDownload.resourceId, resource.id),
      sql`${resourceDownload.downloadedAt} >= ${since}`,
    ))
    .where(eq(resource.isPublished, true))
    .groupBy(resource.id)
    .orderBy(sql`recent_downloads DESC`)
    .limit(10);

  return Response.json({ overview, topResources, period });
}