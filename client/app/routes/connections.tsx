import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
import { UserPlus, Users, Clock, X } from "lucide-react";
import { ConnectionRequests } from "~/components/connections/ConnectionRequests";
import { StudentCard } from "~/components/discovery/StudentCard";
import { requireAuth } from "~/lib/auth";
import type { Route } from "./+types/connections";
import { db } from "~/db";
import { studentProfile, user, userConnection } from "../db/schema";
import { and, desc, eq, or, sql } from "drizzle-orm";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  
  // Load pending requests TO current user
  const pendingRequests = await db
    .select({
      id: userConnection.id,
      userId: userConnection.followerId, // They followed you
      username: studentProfile.username,
      displayName: studentProfile.displayName,
      avatarUrl: studentProfile.avatarUrl,
      school: studentProfile.school,
      subjects: studentProfile.subjects,
      connectionContext: userConnection.connectionContext,
    })
    .from(userConnection)
    .innerJoin(user, eq(userConnection.followerId, user.id))
    .innerJoin(studentProfile, eq(studentProfile.userId, user.id))
    .where(and(
      eq(userConnection.followingId, session.user.id),
      eq(userConnection.status, "pending")
    ))
    .orderBy(desc(userConnection.createdAt));
  

const connections = await db
  .select({
    userId: user.id,
    username: studentProfile.username,
    displayName: studentProfile.displayName,
    avatarUrl: studentProfile.avatarUrl,
    school: studentProfile.school,
    region: studentProfile.region,
    level: studentProfile.level,
    subjects: studentProfile.subjects,
  })
  .from(userConnection)
  .innerJoin(
    user,
    eq(
      user.id,
      sql`
        CASE
          WHEN ${userConnection.followerId} = ${session.user.id}
          THEN ${userConnection.followingId}
          ELSE ${userConnection.followerId}
        END
      `
    )
  )
  .innerJoin(
    studentProfile,
    eq(studentProfile.userId, user.id)
  )
  .where(
    and(
      or(
        eq(userConnection.followerId, session.user.id),
        eq(userConnection.followingId, session.user.id)
      ),
      eq(userConnection.status, "accepted")
    )
  )

  .orderBy(desc(userConnection.createdAt))
  .limit(20);
  
  return { pendingRequests, connections };
}

export default function ConnectionsPage() {
  const { pendingRequests, connections } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<"requests" | "following">("requests");
  const [requests, setRequests] = useState(pendingRequests);
  
  const handleRequestAction = (requestId: string, action: "accept" | "decline") => {
    // Optimistic update: remove from list
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };
  
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="font-bold text-lg text-slate-900">Connections</h1>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "requests"
                  ? "bg-purple-100 text-purple-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Clock size={16} /> Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "following"
                  ? "bg-purple-100 text-purple-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users size={16} /> Connections ({connections.length})
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === "requests" ? (
          <ConnectionRequests 
            requests={requests} 
            onAction={handleRequestAction}
          />
        ) : (
          <div className="space-y-3">
            {connections.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">No connections yet</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Connect with study partners to see their activity</p>
                <Link 
                  to="/discover"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  <UserPlus size={16} /> Find Students
                </Link>
              </div>
            ) : (
              connections.map(user => (
                <StudentCard key={user.userId} user={user as any} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
