import { eq } from "drizzle-orm";
import { db } from "~/db";
import { report, userNotification } from "~/db/schema/social";
import { requireAuth } from "~/lib/auth";
import { sql } from "drizzle-orm";
import type { Route } from "./+types/api.admin.reports.action";

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  if (session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const reportId = formData.get("reportId") as string;
  const intent   = formData.get("intent") as "resolve" | "dismiss" | "escalate";
  const notes    = (formData.get("notes") as string) || null;

  if (!reportId || !intent) {
    return Response.json({ error: "Missing reportId or intent" }, { status: 400 });
  }

  const statusMap = { resolve: "resolved", dismiss: "dismissed", escalate: "escalated" } as const;

  await db
    .update(report)
    .set({ status: statusMap[intent], reviewedBy: session.user.id, reviewedAt: new Date(), adminNotes: notes })
    .where(eq(report.id, reportId));

  // Notify reporter
  const reportData = await db.query.report.findFirst({ where: eq(report.id, reportId) });
  if (reportData) {
    await db.insert(userNotification).values({
      userId: reportData.reporterId,
      type:   "report_resolved",
      title:  intent === "resolve" ? "Report Resolved" : intent === "dismiss" ? "Report Dismissed" : "Report Escalated",
      body:   intent === "resolve"
        ? "Thank you. The reported content has been actioned."
        : intent === "dismiss"
        ? "After review, this content does not violate our guidelines."
        : "Your report has been escalated for further review.",
      data:   { reportId },
      inApp:  true,
    });

    // ✅ NOTIFY with sql.raw — payload must be a literal string, not a parameter
    const payload = JSON.stringify({ userId: reportData.reporterId }).replace(/'/g, "''");
    await db.execute(sql.raw(`NOTIFY new_user_notification, '${payload}'`));
  }

  return Response.json({ success: true });
}