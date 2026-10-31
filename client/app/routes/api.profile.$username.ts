import { redirect } from "react-router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { studentProfile } from "~/db/schema/social";
import { getSessionSafe, isProfileOwner } from "~/lib/auth.server";
import type { Route } from "./profile/+types/profile.username";

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

  // Privacy filter: minimal view if private and not owner
  if (!profile.isPublic && !isOwner) {
    return Response.json({
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
      message: "This profile is private",
    }); //satisfies Partial<ProfileLoaderData>);
  }

  // Full profile for owner or public profile
  // Note: Stats would be fetched from quiz_score/leaderboard tables (Phase 4)
  return Response.json({
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
    }
  } );
}
