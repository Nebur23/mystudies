// app/routes/profile.settings.tsx
import { useState } from "react";
import { useLoaderData, useFetcher, redirect, Link } from "react-router";
import {
  User, Shield, Bell, Lock, ArrowLeft, Camera,
  Save, AlertTriangle, CheckCircle2, Loader2,
  Laptop,
  X
} from "lucide-react";
import { requireAuth } from "~/lib/auth";
import { calculateProfileCompletion } from "~/utils/profileCompletion";
import { z } from "zod";
import type { StudentProfile } from "~/types/profile";
import type { Route } from "./+types/settings";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { studentProfile } from "~/db/schema";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Input } from "~/components/ui/input";
import { authClient, useSession } from "~/lib/auth-client";
import { toast } from "sonner";
import useSWR from "swr";
import { UAParser } from "ua-parser-js";
import type { UAParser as UAParsERType } from "ua-parser-js";
import { MobileIcon } from "@radix-ui/react-icons";
import { useCompressedUpload } from "~/utils/uploadthing";

// ─────────────────────────────────────────────────────────────
// LOADER
// ─────────────────────────────────────────────────────────────
export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
  });

  if (!profile) return redirect("/onboarding/profile");

  const profileCalc = {
    level: profile.level,
    displayName: profile.displayName,
    username: profile.username,
    subjects: profile.subjects,
    region: profile.region,
    school: profile.school as string | undefined,
  }

  const completion = calculateProfileCompletion(profileCalc);

  return {
    user: session.user,
    profile,
    completion,
  };
}

// ─────────────────────────────────────────────────────────────
// ACTION (Handles Profile + Privacy Updates)
// ─────────────────────────────────────────────────────────────
const settingsProfileSchema = z.object({
  section: z.enum(["profile", "privacy"]),
  displayName: z.string().min(2).max(50).optional(),
  username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/).optional(),
  bio: z.string().max(200).optional(),
  school: z.string().max(100).optional(),
  region: z.enum([
    "northwest", "southwest", "littoral", "centre",
    "west", "adamawa", "north", "east", "south"
  ]).optional(),
  subjects: z.string().optional(), // Comma-separated from checkboxes
  isPublic: z.string().optional(),
  showStats: z.string().optional(),
  showSubjects: z.string().optional(),
  showBadges: z.string().optional(),
  allowDirectMessages: z.string().optional(),
  allowFriendRequests: z.string().optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);
  const formData = await request.formData();
  const section = formData.get("section");

  const validated = settingsProfileSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return Response.json({ errors: validated.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = validated.data;
  const updateData: any = {};

  if (section === "profile") {
    if (data.displayName) updateData.displayName = data.displayName;
    if (data.username) updateData.username = data.username;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.school !== undefined) updateData.school = data.school;
    if (data.region) updateData.region = data.region;
    if (data.subjects) {
      updateData.subjects = data.subjects.split(",").filter(Boolean);
    }
  }

  if (section === "privacy") {
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic === "on";
    if (data.showStats !== undefined) updateData.showStats = data.showStats === "on";
    if (data.showSubjects !== undefined) updateData.showSubjects = data.showSubjects === "on";
    if (data.showBadges !== undefined) updateData.showBadges = data.showBadges === "on";
    if (data.allowDirectMessages !== undefined) updateData.allowDirectMessages = data.allowDirectMessages === "on";
    if (data.allowFriendRequests !== undefined) updateData.allowFriendRequests = data.allowFriendRequests === "on";
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true, message: "No changes detected" };
  }

  await db.update(studentProfile)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(studentProfile.userId, session.user.id));

  return { success: true, message: "Settings saved successfully" };
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────
type Tab = "profile" | "privacy" | "notifications" | "security" | "account";

export default function SettingsPage() {
  const { user, profile, completion } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "profile", label: "Profile", icon: User },
    //{ id: "privacy", label: "Privacy", icon: Shield },
    // { id: "notifications", label: "Alerts", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    // { id: "account", label: "Account", icon: LogOut },
  ];

  const { data, isPending, error } = useSession();

  const session = data;

  const [emailVerificationPending, setEmailVerificationPending] = useState<boolean>(false);
  const [isTerminating, setIsTerminating] = useState<string>();
  const { data: activeSessions } = useSWR("/sessions", async () => {
    return (await authClient.listSessions()).data;
  });

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 pb-16 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link to={`/profile/${profile.username}`}>
                <ArrowLeft />
                Back to profile
              </Link>
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Manage your account</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Profile settings</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your profile details and account security up to date.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 px-2.5 py-1">
            <CheckCircle2 />
            {completion.score}% profile complete
          </Badge>
        </header>

        {activeTab === "profile" && !completion.isComplete && (
          <Alert className="rounded-xl border-amber-500/25 bg-amber-500/5 text-foreground">
            <AlertTriangle className="text-amber-600" />
            <AlertTitle>Finish setting up your profile</AlertTitle>
            <AlertDescription>
              Add your {completion.nextSuggestion.toLowerCase()} to help other students find you.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Card className="rounded-xl shadow-none">
              <CardContent className="flex items-center gap-3 pt-6">
                <Avatar className="size-12">
                  <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName} />
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{profile.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
                </div>
              </CardContent>
            </Card>

            <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <TabIcon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
            {activeTab === "profile" && <ProfileTab profile={profile} user={user} />}
            {activeTab === "privacy" && <PrivacyTab profile={profile} />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "security" && (
              <SecurityTab
                session={session}
                setEmailVerificationPending={setEmailVerificationPending}
                emailVerificationPending={emailVerificationPending}
                activeSessions={activeSessions}
                isTerminating={isTerminating}
                setIsTerminating={setIsTerminating}
              />
            )}
            {activeTab === "account" && <AccountTab />}
          </section>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────────────────────
function ProfileTab({ profile, user }: { profile: any; user: any }) {
  const fetcher = useFetcher();
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio || "",
    school: profile.school || "",
    region: profile.region || "",
    subjects: profile.subjects?.join(",") || "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const [loading, setLoading] = useState(false);

  const avatarSrc = imagePreview || profile.avatarUrl;



  const { startUpload } = useCompressedUpload("imageUploader", {

    onClientUploadComplete: () => {
      // alert("uploaded successfully!");
      setLoading(false);
    },
    onUploadError: (ctx) => {
      setLoading(false);
      toast.error(`Failed to upload image`);
      console.log("error occurred while uploading");
    },
    onUploadBegin: (file) => {
      setLoading(true)
      // console.log("upload has begun for", file);
    },
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uploadFiles = image ? await startUpload([image]) : null;
    let imageUrl = null;

    if (!uploadFiles) {
      imageUrl = null;

    }

    imageUrl = uploadFiles?.[0]?.ufsUrl;

    fetcher.submit(
      { section: "profile", avatarUrl: imageUrl as string, ...formData },
      { method: "POST", action: "/api/profile/update" },
    );
  };

  return (
    <Card className="rounded-xl shadow-none">
      <CardHeader className="border-b">
        <CardTitle>Personal information</CardTitle>
        <CardDescription>Update your public profile and study details.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <fetcher.Form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Avatar className="size-20">
                <AvatarImage src={avatarSrc || undefined} alt={profile.displayName} />
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                  {profile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted">
                <Camera className="size-4" />
                <span className="sr-only">Upload profile photo</span>
                <input
                  type="file"
                  accept="image/*"
                  name="avatarFile"
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </label>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Profile photo</p>
              <p className="text-xs text-muted-foreground">PNG or JPG, up to 2MB</p>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                >
                  <X className="size-3.5" />
                  Remove selected photo
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="settings-display-name" className="text-sm font-medium">Display name</label>
              <Input
                id="settings-display-name"
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="rounded-lg bg-background"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-username" className="text-sm font-medium">Username</label>
              <div className="flex h-9 items-center rounded-lg border border-input bg-background focus-within:ring-[3px] focus-within:ring-ring/50">
                <span className="border-r px-3 text-sm text-muted-foreground">@</span>
                <input
                  id="settings-username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="settings-bio" className="text-sm font-medium">Bio</label>
              <textarea
                id="settings-bio"
                name="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                maxLength={200}
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              <p className="text-right text-xs text-muted-foreground">{formData.bio.length}/200</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-school" className="text-sm font-medium">School</label>
              <Input
                id="settings-school"
                type="text"
                name="school"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="rounded-lg bg-background"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-region" className="text-sm font-medium">Region</label>
              <select
                id="settings-region"
                name="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Select a region</option>
                {["northwest", "southwest", "littoral", "centre", "west", "adamawa", "north", "east", "south"].map((region) => (
                  <option key={region} value={region}>
                    {region.charAt(0).toUpperCase() + region.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="settings-subjects" className="text-sm font-medium">Subjects</label>
              <Input
                id="settings-subjects"
                type="text"
                name="subjects"
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                placeholder="Mathematics, Physics, Chemistry"
                className="rounded-lg bg-background"
              />
              <p className="text-xs text-muted-foreground">Separate subjects with commas.</p>
            </div>
          </div>

          {fetcher.data?.success && (
            <Alert className="rounded-lg">
              <CheckCircle2 />
              <AlertTitle>{fetcher.data.message}</AlertTitle>
            </Alert>
          )}
          {fetcher.data?.errors && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertTriangle />
              <AlertTitle>We couldn’t save your profile</AlertTitle>
              <AlertDescription>
                {Object.values(fetcher.data.errors).flat().join(", ")}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end border-t pt-5">
            <Button
              type="submit"
              disabled={fetcher.state === "submitting" || loading}
              className="min-w-36"
            >
              {fetcher.state === "submitting" || loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              {fetcher.state === "submitting" || loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// PRIVACY TAB
// ────────────────────────────────────────────────────────────
function PrivacyTab({ profile }: { profile: any /*StudentProfile*/ }) {
  const fetcher = useFetcher<typeof action>();

  const toggles = [
    { key: "isPublic", label: "Public Profile", desc: "Appear in search results" },
    { key: "showStats", label: "Show Stats", desc: "Papers completed, accuracy, streaks" },
    { key: "showSubjects", label: "Show Subjects", desc: "Let others see what you study" },
    { key: "showBadges", label: "Show Badges", desc: "Display achievements publicly" },
    { key: "allowDirectMessages", label: "Allow Messages", desc: "Study partners can DM you" },
    { key: "allowFriendRequests", label: "Allow Requests", desc: "Receive connection requests" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit(new FormData(e.target as HTMLFormElement), {
      method: "POST",
      action: "/api/profile/update"
    });
  };

  return (
    <fetcher.Form onSubmit={handleSubmit} className="space-y-4">
      {toggles.map(t => (
        <div key={t.key} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
          <div>
            <p className="font-medium text-slate-900 text-sm">{t.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name={t.key}
              defaultChecked={profile[t.key as keyof typeof profile] as boolean}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>
      ))}



      <button
        type="submit"
        disabled={fetcher.state === "submitting"}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all"
      >
        {fetcher.state === "submitting" ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        {fetcher.state === "submitting" ? "Saving..." : "Save Privacy Settings"}
      </button>
    </fetcher.Form>
  );
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS TAB (Placeholder for Phase 2)
// ─────────────────────────────────────────────────────────────
function NotificationsTab() {
  return (
    <div className="space-y-4 text-center py-8">
      <Bell size={48} className="mx-auto text-slate-300" />
      <h3 className="font-semibold text-slate-900">Notification Preferences</h3>
      <p className="text-sm text-slate-500 px-4">
        Control push, email, and in-app alerts for study reminders, friend activity, and weekly challenges.
      </p>
      <p className="text-xs text-purple-600 font-medium">Coming in Phase 2</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECURITY TAB (Placeholder)
// ─────────────────────────────────────────────────────────────
function SecurityTab({ session, setEmailVerificationPending, emailVerificationPending, setIsTerminating, activeSessions, isTerminating }: { session: any, setEmailVerificationPending: React.Dispatch<React.SetStateAction<boolean>>, emailVerificationPending: boolean, setIsTerminating: React.Dispatch<React.SetStateAction<string | undefined>>, activeSessions: any, isTerminating: string | undefined }) {
  return (
    <div className="space-y-4">
      {session?.user.emailVerified ? null : (
        <Alert className="rounded-xl">
          <AlertTriangle />
          <AlertTitle>Verify your email address</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Please verify your email address. Check your inbox for the
            verification email. If you haven't received the email, click the
            button below to resend.
          </AlertDescription>
          <Button
            size="sm"
            className="mt-2"
            disabled={emailVerificationPending}
            onClick={async () => {
              await authClient.sendVerificationEmail(
                {
                  email: session?.user.email || "",
                },
                {
                  onRequest(context) {
                    setEmailVerificationPending(true);
                  },
                  onError(context) {
                    toast.error(context.error.message);
                    setEmailVerificationPending(false);
                  },
                  onSuccess() {
                    toast.success("Verification email sent successfully");
                    setEmailVerificationPending(false);
                  },
                },
              );
            }}
          >
            {emailVerificationPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Resend verification email"
            )}
          </Button>
        </Alert>
      )}

      <Card className="rounded-xl shadow-none">
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>Review devices currently signed in to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions?.filter((activeSession: { userAgent: string | null }) => activeSession.userAgent).length ? (
            <div className="divide-y">
              {activeSessions
                .filter((activeSession: { userAgent: string | null }) => activeSession.userAgent)
                .map((activeSession: { id: string; userAgent: string; token: string }) => {
                  const parser = new UAParser(activeSession.userAgent);
                  const isMobile = parser.getDevice().type === "mobile";
                  const isCurrentSession = activeSession.id === session?.session.id;

                  return (
                    <div key={activeSession.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {isMobile ? <MobileIcon /> : <Laptop className="size-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {parser.getOS().name || "Unknown device"}
                          {parser.getBrowser().name && ` · ${parser.getBrowser().name}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isCurrentSession ? "This device" : "Signed in"}
                        </p>
                      </div>
                      {isCurrentSession ? (
                        <Badge variant="secondary">Current</Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isTerminating === activeSession.id}
                          onClick={async () => {
                            setIsTerminating(activeSession.id);
                            const res = await authClient.revokeSession({ token: activeSession.token });
                            if (res.error) {
                              toast.error(res.error.message);
                            } else {
                              toast.success("Session terminated successfully");
                            }
                            setIsTerminating(undefined);
                          }}
                        >
                          {isTerminating === activeSession.id && <Loader2 className="animate-spin" />}
                          Terminate
                        </Button>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active session details available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-none">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Manage the password used to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Password changes are managed from your account security options.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ACCOUNT TAB (Danger Zone)
// ─────────────────────────────────────────────────────────────
function AccountTab() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-2">Export Data</h3>
        <p className="text-sm text-slate-500 mb-3">Download your study history, progress, and profile info.</p>
        <button className="text-sm text-purple-600 font-medium hover:underline">Request Export</button>
      </div>

      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} className="text-red-600" />
          <h3 className="font-semibold text-red-900">Danger Zone</h3>
        </div>
        <p className="text-sm text-red-800 mb-3">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          Delete Account
        </button>
      </div>
    </div>
  );
}
