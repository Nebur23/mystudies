// app/routes/profile.settings.tsx
import { useState } from "react";
import { useLoaderData, useFetcher, redirect, useNavigate } from "react-router";
import {
  User, Shield, Bell, Lock, LogOut, ChevronLeft,
  Save, AlertTriangle, CheckCircle2, Loader2,
  Laptop,
  Upload,
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
import { authClient, useSession } from "~/lib/auth-client";
import { toast } from "sonner";
import useSWR from "swr";
import { UAParser } from "ua-parser-js";
import type { UAParser as UAParsERType } from "ua-parser-js";
import { MobileIcon } from "@radix-ui/react-icons";
import { useUploadThing } from "~/utils/uploadthing";

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
  const navigate = useNavigate();

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "notifications", label: "Alerts", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "account", label: "Account", icon: LogOut },
  ];

  const { data, isPending, error } = useSession();

  const [ua, setUa] = useState<UAParsERType>();

  const session = data;

  const [emailVerificationPending, setEmailVerificationPending] = useState<boolean>(false);
  const [isTerminating, setIsTerminating] = useState<string>();
  const [isSignOut, setIsSignOut] = useState<boolean>(false);

  const { data: activeSessions } = useSWR("/sessions", async () => {
    return (await authClient.listSessions()).data;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/profile/${profile?.username}`)}
            className="p-2 hover:bg-slate-100 rounded-full"
            aria-label="Back to profile"
          >
            <ChevronLeft size={22} className="text-slate-700" />
          </button>
          <h1 className="font-bold text-lg text-slate-900">Settings</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Tab Navigation */}
        <div className=" max-w-lg mx-auto overflow-x-hidden scrollbar-hide border-b border-slate-200">
          <div className="gid grid-cols-5 grid-gap-2 w-full px-2 ">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={` px-2 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon size={16} />
                  {tab.label}
                </div>

              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Completion Warning (Profile Tab Only) */}
        {activeTab === "profile" && !completion.isComplete && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span>Profile is {completion.score}% complete. Add missing info to appear in search.</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "profile" && <ProfileTab profile={profile} user={user} />}
        {activeTab === "privacy" && <PrivacyTab profile={profile} />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "security" && <SecurityTab session={session} setEmailVerificationPending={setEmailVerificationPending} emailVerificationPending={emailVerificationPending} activeSessions={activeSessions} isTerminating={isTerminating} setIsTerminating={setIsTerminating} />}
        {activeTab === "account" && <AccountTab />}
      </main>
    </div>
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



  const { startUpload, routeConfig } = useUploadThing("imageUploader", {

    onClientUploadComplete: () => {
      // alert("uploaded successfully!");
      setLoading(false);
    },
    onUploadError: (ctx) => {
      setLoading(false);
      toast.error(`Failed to upload image ${ctx.cause}`);
      console.error("error occurred while uploading");
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
    <fetcher.Form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Placeholder */}

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">

            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              profile?.displayName.charAt(0)
            )}

            {imagePreview && (
              <X
                size={16}
                className="bg-white rounded-full text-red-500 text-lg absolute top-0 right-0 cursor-pointer hover:bg-slate-50"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
              />
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow border border-slate-200 cursor-pointer hover:bg-slate-50">
            <Upload size={14} className="text-slate-600" />
            <input
              type="file"
              accept="image/*"
              name="avatarFile"
              onChange={handleImageChange}

              className="hidden"

            />
          </label>
        </div>


        <div>
          <p className="text-sm font-medium text-slate-900">Profile Photo</p>
          <p className="text-xs text-slate-500">PNG, JPG up to 2MB</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username @</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 rounded-l-lg bg-slate-50 text-slate-500 text-sm">@</span>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">School</label>
            <input
              type="text"
              name="school"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <select
              name="region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="">Select</option>
              {["northwest", "southwest", "littoral", "centre", "west", "adamawa", "north", "east", "south"].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Subjects</label>
          <input
            type="text"
            name="subjects"
            value={formData.subjects}
            onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
            placeholder="Mathematics, Physics, Chemistry"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <p className="text-xs text-slate-500 mt-1">Comma-separated</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={fetcher.state === "submitting" || loading}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all"
      >
        {fetcher.state === "submitting" || loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        {fetcher.state === "submitting" || loading ? "Saving..." : "Save Profile"}
      </button>

      {fetcher.data?.success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          <CheckCircle2 size={16} /> {fetcher.data.message}
        </div>
      )}
      {fetcher.data?.errors && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {Object.values(fetcher.data.errors).flat().join(", ")}
        </div>
      )}
    </fetcher.Form>
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
        <Alert>
          <AlertTitle>Verify Your Email Address</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Please verify your email address. Check your inbox for the
            verification email. If you haven't received the email, click the
            button below to resend.
          </AlertDescription>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 active:scale-95 transition-all"
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
              <Loader2 size={15} className="animate-spin" />
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        </Alert>
      )}

      <div className="border-l-2 px-2 w-max gap-1 flex flex-col">
        <p className="text-xs font-medium ">Active Sessions</p>
        {activeSessions
          ?.filter((activeSession: { userAgent: any; }) => activeSession.userAgent)
          .map((activeSession: { id: string | number | bigint | ((prevState: string | undefined) => string | undefined) | null | undefined; userAgent: string; token: any; }) => {
            return (
              <div key={activeSession.id as string}>
                <div className="flex items-center gap-2 text-sm  text-black font-medium dark:text-white">
                  {new UAParser(activeSession.userAgent as string).getDevice().type ===
                    "mobile" ? (
                    <MobileIcon />
                  ) : (
                    <Laptop size={16} />
                  )}
                  {new UAParser(activeSession.userAgent as string).getOS().name},{" "}
                  {new UAParser(activeSession.userAgent as string).getBrowser().name}
                  <button
                    className="text-red-500 opacity-80  cursor-pointer text-xs border-muted-foreground border-red-600  underline "
                    onClick={async () => {
                      setIsTerminating(activeSession.id as string);
                      const res = await authClient.revokeSession({
                        token: activeSession.token,
                      });

                      if (res.error) {
                        toast.error(res.error.message);
                      } else {
                        toast.success("Session terminated successfully");
                      }

                      setIsTerminating(undefined);
                    }}
                  >
                    {isTerminating === activeSession.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : activeSession.id === session?.session.id ? (
                      "Sign Out"
                    ) : (
                      "Terminate"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
      </div>


      <div className="p-4 bg-white rounded-xl border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-2">Password</h3>
        <p className="text-sm text-slate-500 mb-3">Last changed 30 days ago</p>
        <button className="text-sm text-purple-600 font-medium hover:underline">Change Password</button>
      </div>


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