import { eq, and, sql } from "drizzle-orm";
import { db } from "~/db";
import { report, userNotification, studentProfile } from "~/db/schema/social";
import { requireAuth } from "~/lib/auth";
import { z } from "zod";
import type { Route } from "./+types/api.report";

const reportSchema = z.object({
  targetType: z.enum(["profile", "activity", "comment", "message"]),
  targetId:   z.string().min(1),   // ✅ removed .uuid() — IDs are text, not always UUID format
  reason:     z.enum(["spam","harassment","inappropriate","fake_profile","cheating","copyright","other"]),
  details:    z.string().max(500).optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const session  = await requireAuth(request);
  const formData = await request.formData();

  const validated = reportSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return Response.json(
      { error: "Invalid report data", details: validated.error.flatten() },
      { status: 400 }
    );
  }

  const { targetType, targetId, reason, details } = validated.data;

  // Duplicate guard
  const existing = await db.query.report.findFirst({
    where: and(
      eq(report.reporterId, session.user.id),
      eq(report.targetType, targetType),
      eq(report.targetId,   targetId),
      eq(report.status,     "pending"),
    ),
  });
  if (existing) {
    return Response.json({ error: "You already reported this" }, { status: 409 });
  }

  await db.insert(report).values({
    reporterId: session.user.id,
    targetType,
    targetId,
    reason,
    details: details ?? null,
  });

  // Auto-hide on severe violations (optional — implement content hiding logic here)
  if (reason === "harassment" || reason === "inappropriate") {
    // TODO: flag content as hidden pending review
  }

  return Response.json({
    success: true,
    message: "Report submitted. Our team will review it shortly.",
  });
}

// ── Admin: list reports ───────────────────────────────────────────────────────
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  if (session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const reports = await db
    .select({
      id:               report.id,
      reporterId:       report.reporterId,
      targetType:       report.targetType,
      targetId:         report.targetId,
      reason:           report.reason,
      details:          report.details,
      status:           report.status,
      createdAt:        report.createdAt,
      reviewedAt:       report.reviewedAt,
      adminNotes:       report.adminNotes,
      reporterUsername: sql<string | null>`(
        SELECT username FROM student_profile WHERE user_id = ${report.reporterId} LIMIT 1
      )`,
    })
    .from(report)
    .orderBy(
      sql`CASE status WHEN 'pending' THEN 0 WHEN 'reviewed' THEN 1 ELSE 2 END`,
      report.createdAt,
    )
    .limit(100);

  return Response.json({ reports });
}
