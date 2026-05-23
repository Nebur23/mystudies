// app/routes/onboarding.profile.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useFetcher, redirect, useLoaderData } from "react-router";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { requireAuth } from "~/lib/auth";
import { generateUsername } from "~/utils/profileCompletion";
import type { Route } from "./+types/onboarding.profile";
import { studentProfile } from "~/db/schema";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { Pressable } from "~/components/ui/Pressable";

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = "olevel" | "alevel";

interface PrivacySettings {
  isPublic: boolean;
  showStats: boolean;
  showSubjects: boolean;
}

interface FormData {
  level: Level | "";
  school: string;
  region: string;
  subjects: string[];
  displayName: string;
  username: string;
  targetExamYear: number;
  bio: string;
  privacy: PrivacySettings;
}

interface PrivacyToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMEROON_REGIONS = [
  { value: "adamawa", label: "Adamawa" },
  { value: "centre", label: "Centre" },
  { value: "east", label: "East" },
  { value: "far_north", label: "Far North" }, // FIX: was missing
  { value: "littoral", label: "Littoral" },
  { value: "north", label: "North" },
  { value: "northwest", label: "Northwest" },
  { value: "south", label: "South" },
  { value: "southwest", label: "Southwest" },
  { value: "west", label: "West" },
] as const;

const SUBJECTS = [
  "Mathematics", "English", "French", "Biology",
  "Physics", "Chemistry", "Geography", "History",
  "Economics", "Computer Science",
] as const;

const TOTAL_STEPS = 5;

const DEFAULT_FORM: FormData = {
  level: "",
  school: "",
  region: "",
  subjects: [],
  displayName: "",
  username: "",
  targetExamYear: 0,
  bio: "",
  privacy: { isPublic: true, showStats: true, showSubjects: true },
};

/** Slugify a display name into a valid username suggestion. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 20);
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
  });

  if (profile?.onboardCompletedAt) {
    return redirect(`/profile/${profile.username}`);
  }

  return { existingProfile: profile ?? null };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSetup() {
  const { existingProfile } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

  // FIX 1: useEffect (not useState) to pre-fill from existing profile
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        level: existingProfile.level as Level,
        school: existingProfile.school ?? "",
        region: existingProfile.region ?? "",
        subjects: existingProfile.subjects ?? [],
        displayName: existingProfile.displayName ?? "",
        username: existingProfile.username ?? "",
        bio: existingProfile.bio ?? "",
        targetExamYear: existingProfile.targetExamYear ?? 0,
        privacy: {
          isPublic: existingProfile.isPublic as boolean,
          showStats: existingProfile.showStats as boolean,
          showSubjects: existingProfile.showSubjects as boolean,
        },
      });
    }
  }, [existingProfile]);

  // FIX 2: Navigate only after a successful server response
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && !fetcher.data.errors) {
      navigate(`/profile/${formData.username || "me"}`);
    }
  }, [fetcher.state, fetcher.data, formData.username, navigate]);

  const update = useCallback(
    (patch: Partial<FormData>) => setFormData((prev) => ({ ...prev, ...patch })),
    [],
  );

  // Auto-suggest username from display name (only if user hasn't typed one manually)
  const [usernameTouched, setUsernameTouched] = useState(false);
  useEffect(() => {
    if (!usernameTouched && formData.displayName) {
      update({ username: slugify(formData.displayName) });
    }
  }, [formData.displayName, usernameTouched, update]);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 1: return (
        formData.displayName.trim().length >= 2 &&
        /^[a-zA-Z0-9_]{3,20}$/.test(formData.username)
      );
      case 2: return formData.level === "olevel" || formData.level === "alevel";
      case 3: return formData.region !== "";
      case 4: return formData.subjects.length >= 1 
      case 5: return true;
      default: return false;
    }
  }, [step, formData.displayName, formData.username, formData.level, formData.region, formData.subjects]);

  // Flatten privacy + serialise subjects as comma string for FormData transport
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const { privacy, subjects, ...rest } = formData;
    fetcher.submit(
      {
        ...rest,
        ...privacy,
        // subjects must be a string for FormData; action coerces it back to array
        subjects: subjects.join(","),
      },
      { method: "POST", action: "/api/profile/update" },
    );
  }, [fetcher, formData]);

  // FIX 9: Dynamic exam years relative to current year
  const examYears = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current + 1, current + 2];
  }, []);

  // FIX 6: Memoize generated username to avoid recalculating every render
  const previewUsername = useMemo(
    () => formData.username || generateUsername(formData.displayName || "student"),
    [formData.username, formData.displayName],
  );



  const updatePrivacy = useCallback(
    (patch: Partial<PrivacySettings>) =>
      setFormData((prev) => ({ ...prev, privacy: { ...prev.privacy, ...patch } })),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          {/* FIX 8: Disable back button on step 1 and show it as inactive */}
          <Pressable
            onClick={() => step > 1 && setStep((s) => s - 1)}
            disabled={step === 1}
            className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </Pressable>
          <div className="flex-1 mx-4">
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-slate-600">Step {step}/{TOTAL_STEPS}</span>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* FIX 10: Form's action is handled in handleSubmit; fetcher.Form wraps correctly */}
        <fetcher.Form method="POST" onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1: Display Name & Username */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Your Identity</h2>
              <p className="text-slate-600">How should other students know you?</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => update({ displayName: e.target.value })}
                  placeholder="e.g., Ruben Yebga"
                  maxLength={50}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your full name or nickname — at least 2 characters.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setUsernameTouched(true);
                      update({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") });
                    }}
                    placeholder="your_username"
                    maxLength={20}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <p className={`text-xs mt-1 ${formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)
                    ? "text-red-500"
                    : "text-slate-500"
                  }`}>
                  {formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)
                    ? "3–20 characters: letters, numbers, underscores only."
                    : "3–20 characters. Auto-suggested from your name."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => update({ bio: e.target.value })}
                  placeholder="Tell other students a little about yourself…"
                  maxLength={200}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />
                <p className="text-xs text-slate-500 mt-1 text-right">
                  {formData.bio.length}/200
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Level */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Your Level</h2>
              <p className="text-slate-600">Which GCE exam are you preparing for?</p>

              <div className="grid gap-3">
                {(["olevel", "alevel"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => update({ level })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${formData.level === level
                        ? "border-purple-600 bg-purple-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-purple-300"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {level === "olevel" ? "Ordinary Level" : "Advanced Level"}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {level === "olevel"
                            ? "Form 3–4-5"
                            : "Lower 6th–Upper 6th"}
                        </p>
                      </div>
                      {formData.level === level && (
                        <CheckCircle2 className="text-purple-600 shrink-0" size={24} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: School & Location */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">School & Location</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => update({ school: e.target.value })}
                  placeholder="e.g., Government Bilingual High School, Bamenda"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Region <span className="text-red-500">*</span>
                </label>
                {/* FIX 5: All 10 Cameroonian regions present, sorted alphabetically */}
                <select
                  value={formData.region}
                  onChange={(e) => update({ region: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option value="">Select your region</option>
                  {CAMEROON_REGIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Subjects & Goals */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Subjects & Goals</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subjects You're Studying <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => {
                        const subjects = formData.subjects.includes(subject)
                          ? formData.subjects.filter((s) => s !== subject)
                          : [...formData.subjects, subject];
                        update({ subjects });
                      }}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${formData.subjects.includes(subject)
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                        }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">Select at least 1 subject</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target Exam Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.targetExamYear || ""}
                  onChange={(e) => update({ targetExamYear: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option  value="">Select year</option>
                  {/* FIX 9: Dynamically computed years */}
                  {examYears.map((year) => (
                    <option  key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 5: Privacy & Finish */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Privacy & Visibility</h2>

              <div className="space-y-3">
                <PrivacyToggle
                  label="Make profile public"
                  description="Let other students find and view your profile"
                  checked={formData.privacy.isPublic}
                  onChange={(v) => updatePrivacy({ isPublic: v })}
                />
                <PrivacyToggle
                  label="Show my stats"
                  description="Papers completed, accuracy, streaks"
                  checked={formData.privacy.showStats}
                  onChange={(v) => updatePrivacy({ showStats: v })}
                />
                <PrivacyToggle
                  label="Show my subjects"
                  description="Let others see what you're studying"
                  checked={formData.privacy.showSubjects}
                  onChange={(v) => updatePrivacy({ showSubjects: v })}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800">
                  🔒 <strong>Student Safety First</strong>: You can change these settings
                  anytime in your profile. We never share your email or personal details publicly.
                </p>
              </div>

              {/* Profile Preview */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-600 mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {formData.displayName.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900">
                      {formData.displayName || "Your Name"}
                    </p>
                    {/* FIX 6: Memoized username preview */}
                    <p className="text-xs text-slate-500">
                      @{previewUsername} •{" "}
                      {formData.level === "olevel" ? "O-Level" : "A-Level"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-50 pb-4">
            {step > 1 && (
              <Pressable
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
              >
                Back
              </Pressable>
            )}
            {step < TOTAL_STEPS ? (
              <Pressable
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 active:scale-95 transition-all"
              >
                Continue
              </Pressable>
            ) : (
              <Pressable
                type="submit"
                disabled={fetcher.state === "submitting" || !canProceed()}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 active:scale-95 transition-all"
              >
                {fetcher.state === "submitting" ? "Saving..." : "Complete Profile"}
              </Pressable>
            )}
          </div>
        </fetcher.Form>

        {/* Form Errors — per-field, cleanly formatted */}
        {fetcher.data?.errors && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
            {fetcher.data.message && (
              <p className="text-sm font-semibold text-red-800 mb-2">
                {fetcher.data.message}
              </p>
            )}
            {Object.values(fetcher.data.errors as Record<string, string>).map((msg, i) => (
              <p key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{msg}</span>
              </p>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── PrivacyToggle ────────────────────────────────────────────────────────────

// FIX 7: Properly typed (no `any`)
function PrivacyToggle({ label, description, checked, onChange }: PrivacyToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        {description && (
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
      </label>
    </div>
  );
}
