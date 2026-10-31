import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { Filter, Check, X, Eye, Flag, AlertTriangle } from "lucide-react";
import { db } from "~/db";
import { report, studentProfile } from "~/db/schema/social";
import { sql } from "drizzle-orm";
import type { Route } from "./+types/admin.reports";

// ✅ Loader runs server-side — no internal fetch needed
export async function loader({ request }: Route.LoaderArgs) {
//   const session = await requireAuth(request);
//   if (session.user.role !== "admin") {
//     throw new Response("Unauthorized", { status: 403 });
//   }

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
      reporterUsername: sql<string | null>`(
        SELECT username FROM student_profile WHERE user_id = ${report.reporterId} LIMIT 1
      )`,
    })
    .from(report)
    .orderBy(
      sql`CASE status WHEN 'pending' THEN 0 WHEN 'reviewed' THEN 1 ELSE 2 END`,
      report.createdAt
    )
    .limit(100);

  return { reports };
}

type ReportRow = Awaited<ReturnType<typeof loader>>["reports"][number];

export default function AdminReportsPage() {
  const { reports }  = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState("pending");
  const fetcher = useFetcher<{ success?: boolean }>();

  const statusCounts = reports.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={24} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-slate-900">Moderation Dashboard</h1>
          {statusCounts["pending"] > 0 && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
              {statusCounts["pending"]} pending
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["all", "pending", "reviewed", "resolved", "dismissed", "escalated"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-purple-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-purple-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {statusCounts[f] ? ` (${statusCounts[f]})` : ""}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 font-semibold text-slate-700">Reporter</th>
                <th className="text-left p-4 font-semibold text-slate-700">Target</th>
                <th className="text-left p-4 font-semibold text-slate-700">Reason</th>
                <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                <th className="text-left p-4 font-semibold text-slate-700">Date</th>
                <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <ReportRow key={r.id} report={r} fetcher={fetcher} />
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Flag size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No reports match this filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportRow({ report: r, fetcher }: { report: ReportRow; fetcher: ReturnType<typeof useFetcher> }) {
  const [showNotes, setShowNotes] = useState(false);

  const statusColors: Record<string, string> = {
    pending:    "bg-amber-100 text-amber-700",
    reviewed:   "bg-blue-100 text-blue-700",
    resolved:   "bg-green-100 text-green-700",
    dismissed:  "bg-slate-100 text-slate-600",
    escalated:  "bg-red-100 text-red-700",
  };

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="p-4 font-medium text-slate-900">
          @{r.reporterUsername ?? "unknown"}
        </td>
        <td className="p-4 text-slate-600 capitalize">
          {r.targetType} <span className="font-mono text-xs text-slate-400">#{r.targetId.slice(0, 8)}</span>
        </td>
        <td className="p-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium">
            <Flag size={11} /> {r.reason}
          </span>
        </td>
        <td className="p-4">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[r.status] ?? ""}`}>
            {r.status}
          </span>
        </td>
        <td className="p-4 text-slate-500 text-xs">
          {new Date(r.createdAt).toLocaleDateString()}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => setShowNotes(s => !s)}
              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="View details"
            >
              <Eye size={15} />
            </button>

            {r.status === "pending" && (
              <>
                {/* ✅ Separate forms per action — fixes duplicate hidden input bug */}
                <fetcher.Form method="POST" action="/api/admin/reports/action">
                  <input type="hidden" name="reportId" value={r.id} />
                  <input type="hidden" name="intent"   value="resolve" />
                  <button
                    type="submit"
                    title="Resolve"
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Check size={15} />
                  </button>
                </fetcher.Form>

                <fetcher.Form method="POST" action="/api/admin/reports/action">
                  <input type="hidden" name="reportId" value={r.id} />
                  <input type="hidden" name="intent"   value="dismiss" />
                  <button
                    type="submit"
                    title="Dismiss"
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={15} />
                  </button>
                </fetcher.Form>

                <fetcher.Form method="POST" action="/api/admin/reports/action">
                  <input type="hidden" name="reportId" value={r.id} />
                  <input type="hidden" name="intent"   value="escalate" />
                  <button
                    type="submit"
                    title="Escalate"
                    className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <AlertTriangle size={15} />
                  </button>
                </fetcher.Form>
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Expandable details row */}
      {showNotes && (
        <tr className="bg-slate-50">
          <td colSpan={6} className="px-4 py-3">
            <p className="text-xs text-slate-500 font-medium mb-1">Reporter details:</p>
            <p className="text-sm text-slate-700">{r.details ?? "No additional details provided."}</p>
          </td>
        </tr>
      )}
    </>
  );
}
