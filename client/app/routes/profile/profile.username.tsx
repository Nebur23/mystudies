import { eq } from "drizzle-orm";
import { useLoaderData, Link, redirect } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  LockKeyhole,
  MapPin,
  School,
  SquarePen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ConnectButton } from "~/components/connections/ConnectButton";
import { MutualConnections } from "~/components/connections/MutualConnections";
import { db } from "~/db";
import { studentProfile } from "~/db/schema/social";
import { getSessionSafe, isProfileOwner } from "~/lib/auth";
import { ConnectionStatus } from "~/utils/connection.status";
import type { Route } from "./+types/profile.username";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { username } = params;

  if (username === "me") {
    return redirect("/profile/me");
  }

  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.username, username),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: false,
          image: false,
        },
      },
    },
  });

  if (!profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  const session = await getSessionSafe(request);
  const isOwner = isProfileOwner(profile, session);
  const connectionStatus = await ConnectionStatus({ params, request });

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
      connectionStatus,
      message: "This profile is private",
    };
  }

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
    joinDate: profile.createdAt.toISOString().split("T")[0],
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
    connectionStatus,
  };
}

export default function PublicProfile() {
  const profile = useLoaderData<typeof loader>();

  if (!profile || (!profile.privacy?.isPublic && !profile.isOwner)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md rounded-xl text-center shadow-none">
          <CardHeader className="items-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
              <LockKeyhole className="size-5 text-muted-foreground" />
            </div>
            <CardTitle>{profile ? "This profile is private" : "Profile not found"}</CardTitle>
            <CardDescription>
              {profile
                ? "This student has chosen to keep their profile private."
                : "We couldn’t find a profile with that username."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/discover">Discover students</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const joinDate = "joinDate" in profile && profile.joinDate
    ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(profile.joinDate))
    : null;
  const connectionStatus = "connectionStatus" in profile
    ? profile.connectionStatus
    : null;
  const userId = "userId" in profile ? profile.userId : null;

  return (
    <main className="min-h-[calc(100vh-3rem)] bg-muted/30 px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={profile.isOwner ? "/students" : "/discover"}>
            <ArrowLeft />
            {profile.isOwner ? "Back to dashboard" : "Discover students"}
          </Link>
        </Button>

        <Card className="overflow-hidden rounded-xl py-0 shadow-sm">
          <div className="relative h-36 overflow-hidden bg-primary/10 sm:h-48">
            {"coverImageUrl" in profile && profile.coverImageUrl ? (
              <img src={profile.coverImageUrl} alt="" className="size-full object-cover" />
            ) : (
              <>
                <div className="absolute -right-10 -top-24 size-72 rounded-full border border-primary/10" />
                <div className="absolute -right-2 -top-16 size-56 rounded-full border border-primary/10" />
                <div className="absolute -bottom-36 left-1/4 size-72 rounded-full bg-primary/5" />
              </>
            )}
          </div>

          <CardContent className="relative px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <Avatar className="size-24 border-4 border-background shadow-sm sm:size-28">
                <AvatarImage
                  src={profile.avatarUrl || undefined}
                  alt={profile.displayName}
                />
                <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                  {profile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex gap-2 sm:pb-1">
                {profile.canEdit ? (
                  <Button asChild>
                    <Link to="/profile/settings">
                      <SquarePen />
                      Edit profile
                    </Link>
                  </Button>
                ) : connectionStatus && userId ? (
                  <ConnectButton
                    targetUsername={profile.username}
                    isOwner={profile.isOwner}
                    targetUserId={userId}
                    initialStatus={connectionStatus as {
                      status: "none" | "pending" | "accepted" | "blocked" | "rejected";
                      canConnect: boolean;
                      targetUserId: string;
                      direction: "incoming" | "outgoing" | null;
                    }}
                  />
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {profile.displayName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <GraduationCap />
                  {profile.level === "olevel" ? "O-Level" : "A-Level"}
                </Badge>
                {"school" in profile && profile.school && (
                  <Badge variant="outline">
                    <School />
                    {profile.school}
                  </Badge>
                )}
                {"region" in profile && profile.region && (
                  <Badge variant="outline" className="capitalize">
                    <MapPin />
                    {profile.region.replaceAll("_", " ")}
                  </Badge>
                )}
                {joinDate && (
                  <Badge variant="outline">
                    <CalendarDays />
                    Joined {joinDate}
                  </Badge>
                )}
              </div>

              {"bio" in profile && profile.bio && (
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {profile.bio}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
          <Card className="rounded-xl shadow-none">
            <CardHeader>
              <CardTitle>Study focus</CardTitle>
              <CardDescription>
                {"targetExamYear" in profile && profile.targetExamYear
                  ? `Preparing for the ${profile.targetExamYear} exam`
                  : "Subjects and goals"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {profile.privacy?.showSubjects &&
              "subjects" in profile &&
              profile.subjects?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.subjects.map((subject: string) => (
                    <Badge key={subject} variant="secondary" className="px-2.5 py-1">
                      {subject}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {profile.isOwner
                    ? "Add your subjects in settings to make your study focus visible here."
                    : "This student hasn’t shared their subjects."}
                </p>
              )}
              {profile.canEdit && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/profile/settings">Update study profile</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-none">
            <CardHeader>
              <CardTitle>Connections</CardTitle>
              <CardDescription>Students you may know</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MutualConnections targetUsername={profile.username} />
              {!profile.isOwner && (
                <p className="text-xs leading-5 text-muted-foreground">
                  Connect to keep up with each other’s learning journey.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
