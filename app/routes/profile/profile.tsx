// app/routes/profile.me.tsx
import { eq } from "drizzle-orm";
import { Link } from "react-router";
import { useLoaderData, redirect } from "react-router";
import { CompleteProfileBanner } from "~/components/CompleteProfileBanner";
import { ProfileEditor } from "~/components/ProfileEditor";
import { db } from "~/db";
import { studentProfile } from "~/db/schema";
import { requireAuth } from "~/lib/auth.server";
import type { ProfileLoaderData } from "~/types/profile";
import type { Route } from "./+types/profile";

export async function loader({ request }: Route.LoaderArgs) {


  // Require authentication
  const session = await requireAuth(request);


  // Fetch user's profile
  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
  });

  // If no profile exists yet, redirect to onboarding
  if (!profile) {
    return redirect("/onboarding/profile");
  }

  return redirect(`/profile/${profile.username}`);


  // Return full profile with owner context
  // return Response.json({
  //   ...profile,
  //   isOwner: true,
  //   canEdit: true,
  //   privacy: {
  //     isPublic: profile.isPublic,
  //     showStats: profile.showStats,
  //     showSubjects: profile.showSubjects,
  //     showBadges: profile.showBadges,
  //     allowDirectMessages: profile.allowDirectMessages,
  //     allowFriendRequests: profile.allowFriendRequests,
  //   },
  //   // Placeholder stats (Phase 4)
  //   stats: { papersCompleted: 0, accuracy: 0, currentStreak: 0, badges: [] }
  // });
}

export default function MyProfile() {
  const profile = useLoaderData<ProfileLoaderData>();

  return null

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-900">My Profile</h1>
          <Link to="/profile/settings" className="text-sm text-purple-600 font-medium">
            Settings
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Smart onboarding banner */}
        <CompleteProfileBanner profile={profile} />

        {/* Profile Editor */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <ProfileEditor profile={profile} />
        </div>

        {/* Quick Stats Preview */}
        <div className="mt-6">
          <h3 className="font-semibold text-slate-900 mb-3">Your Progress</h3>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Papers" value={profile.stats?.papersCompleted || 0} />
            <StatCard label="Accuracy" value={`${profile.stats?.accuracy || 0}%`} />
            <StatCard label="Streak" value={`${profile.stats?.currentStreak || 0}d`} />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
      <div className="font-bold text-lg text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
