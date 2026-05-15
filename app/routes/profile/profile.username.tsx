// app/routes/profile.$username.tsx
import { useLoaderData, Link, redirect } from "react-router";
import { MapPin, School, Calendar, MessageCircle, Share2, Edit } from "lucide-react";
// app/routes/api.profile.$username.ts
import { eq, and } from "drizzle-orm";
import { db } from "~/db";
import { studentProfile } from "~/db/schema/social";
import { getSessionSafe, isProfileOwner } from "~/lib/auth.server";
import type { Route } from "./+types/profile.username";
import { ConnectButton } from "~/components/connections/ConnectButton";
import { MutualConnections } from "~/components/connections/MutualConnections";
import { ConnectionStatus } from "~/utils/connection.status";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { username } = params;

  // Redirect /profile/me to private view
  if (username === "me") {
    return redirect("/profile/me");
  }

  // Fetch profile
  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.username, username),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: false, // Never expose email
          image: false
        }
      }
    }
  });

  if (!profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  // Check auth for owner detection (non-blocking)
  const session = await getSessionSafe(request);
  const isOwner = isProfileOwner(profile, session);

  const connectionStatus = await ConnectionStatus({ params, request });

  // Privacy filter: minimal view if private and not owner
  if (!profile.isPublic && !isOwner) {
    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl as string,
      level: profile.level,
      privacy: {
        isPublic: false,
        showStats: false,
        showSubjects: false,
        showBadges: false,
        allowDirectMessages: false,
        allowFriendRequests: false,

      },
      isOwner: false,
      canEdit: false,
      connectionStatus, // from ConnectionStatus utility
      message: "This profile is private",
    }; //satisfies Partial<ProfileLoaderData>);
  }

  // Full profile for owner or public profile
  // Note: Stats would be fetched from quiz_score/leaderboard tables (Phase 4)

  return {
    id: profile.id,
    userId: profile.userId,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl as string,
    coverImageUrl: profile.coverImageUrl as string,
    bio: profile.bio as string,
    level: profile.level,
    school: profile.school as string,
    location: profile.location,
    region: profile.region as string,
    subjects: profile.subjects,
    targetExamYear: profile.targetExamYear,
    studyGoals: profile.studyGoals,
    socialLinks: profile.socialLinks,
    joinDate: profile.createdAt.toISOString().split('T')[0],
    lastActiveAt: profile.lastActiveAt?.toISOString(),
    privacy: {
      isPublic: profile.isPublic,
      showStats: profile.showStats,
      showSubjects: profile.showSubjects,
      showBadges: profile.showBadges,
      allowDirectMessages: profile.allowDirectMessages,
      allowFriendRequests: profile.allowFriendRequests,
    },
    isOwner,
    canEdit: isOwner,
    // Placeholder stats - replace with actual queries in Phase 4
    stats: {
      papersCompleted: 0,
      accuracy: 0,
      currentStreak: 0,
      badges: []
    },
    connectionStatus, // from ConnectionStatus utility
  };
}


export default function PublicProfile() {
  const profile = useLoaderData<typeof loader>();

  // Handle "not found" or "private" states
  if (!profile || (!profile?.privacy?.isPublic && !profile.isOwner)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
          <p className="text-slate-600 mb-4">
            {!profile ? "This user doesn't exist" : "This profile is private"}
          </p>
          <Link to="/discover" className="text-purple-600 font-medium hover:underline">
            Discover other students →
          </Link>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Cover Image */}

      <div className="h-32 md:h-48 bg-linear-to-r from-purple-500 to-blue-500 relative">
        {profile.coverImageUrl && (
          <img
            src={profile.coverImageUrl}
            alt="Cover"
            className="w-full h-full object-cover opacity-90"
          />
        )}
        {profile.canEdit && (
          <button className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-white shadow">
            Change Cover
          </button>
        )}
      </div>


      <div className="max-w-lg mx-auto px-2 -mt-12 relative">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">

          <div className="flex flex-col">

            {/* profile image */}
            <div className="flex items-center gap-4 mb-3">
              <div className="">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-200 overflow-hidden">

                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    profile?.displayName.charAt(0)
                  )}
                </div>


              </div>
              <div >
                <h1 className="font-bold text-xl text-slate-900">{profile.displayName}</h1>
                <p className="text-sm text-slate-500">@{profile.username}</p>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="">
              {profile.canEdit ? (
                <Link
                  to="/profile/settings"
                  className="flex items-center w-22 gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  <Edit size={14} /> Edit
                </Link>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <ConnectButton
                    targetUsername={profile.username}
                    isOwner={profile.isOwner}
                    targetUserId={profile.userId as string}
                    initialStatus={profile.connectionStatus as {
                      status: "none" | "pending" | "accepted" | "blocked" | "rejected";
                      canConnect: boolean;
                      targetUserId: string;
                      direction: "incoming" | "outgoing" | null; 
                    }} // from loader
                    // canConnect={profile.privacy?.allowFriendRequests !== false}
                    onStatusChange={(newStatus) => {
                      // Optionally refetch mutual connections
                    }}
                  />
                  {profile.privacy?.allowDirectMessages && (
                    <button className="p-2 hover:bg-slate-100 rounded-full" aria-label="Message">
                      <MessageCircle size={18} className="text-slate-600" />
                    </button>
                  )}


                  <button className="p-2 hover:bg-slate-100 rounded-full" aria-label="Share">
                    <Share2 size={18} className="text-slate-600" />
                  </button>
                </div>

              )

              }
            </div>
          </div>

          {/* personal info */}

          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              {profile.level === "olevel" ? "O-Level" : "A-Level"}
            </span>
            {profile.school && (
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <School size={12} /> {profile.school}
              </span>
            )}
            {profile.region && (
              <span className="flex items-center gap-1 text-xs text-slate-600 capitalize">
                <MapPin size={12} /> {profile.region.replace('_', ' ')}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
          )}

          <MutualConnections targetUsername={profile.username} />

          {profile.location && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-600">
              <MapPin size={14} /> {profile.location}
            </div>
          )}

          {/* Join Date */}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <Calendar size={14} /> Joined {profile.joinDate}
          </div>
        </div>

        {/* Stats Section (Privacy-Aware) */}
        {profile.privacy?.showStats && profile.stats && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatCard label="Papers" value={profile.stats.papersCompleted} />
            <StatCard label="Accuracy" value={`${profile.stats.accuracy}%`} />
            <StatCard label="Streak" value={`${profile.stats.currentStreak}d`} />
          </div>
        )}

        {/* Subjects Section (Privacy-Aware) */}
        {profile.privacy?.showSubjects && profile.subjects && profile.subjects?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mt-4">
            <h3 className="font-bold text-slate-900 mb-3">Studying</h3>
            <div className="flex flex-wrap gap-2">
              {profile.subjects.map((subject: string) => (
                <span key={subject} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for future features */}
        <div className="mt-6 text-center text-sm text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-200">
          {profile.isOwner
            ? "🎉 Profile complete! Next: Connect with study partners →"
            : "More coming soon: study activity, badges, and connections 👋"
          }
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
      <div className="font-bold text-lg text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
