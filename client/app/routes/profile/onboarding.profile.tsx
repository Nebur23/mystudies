// app/routes/onboarding.profile.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useFetcher, redirect, useLoaderData } from "react-router";
import { usePostHog } from "@posthog/react";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { generateUsername } from "~/utils/profileCompletion";
import type { Route } from "./+types/onboarding.profile";
import { studentProfile } from "~/db/schema";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { requireAuth } from "~/lib/auth.server";

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
const STEP_DETAILS = [
  { title: "About you", description: "Choose how you appear to the study community.", icon: UserRound },
  { title: "Exam level", description: "Tell us which GCE level you are preparing for.", icon: GraduationCap },
  { title: "School & region", description: "Add your school and where you study.", icon: MapPin },
  { title: "Subjects & goals", description: "Personalize your study recommendations.", icon: BookOpenCheck },
  { title: "Privacy", description: "Choose what other students can see.", icon: ShieldCheck },
] as const;

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

   const userId = session.user.id;
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, userId),
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
  const posthog = usePostHog();

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
    posthog?.capture("onboarding_completed", {
      level: formData.level,
      region: formData.region,
      subjects_count: formData.subjects.length,
      target_exam_year: formData.targetExamYear,
    });
    fetcher.submit(
      {
        ...rest,
        ...privacy,
        // subjects must be a string for FormData; action coerces it back to array
        subjects: subjects.join(","),
      },
      { method: "POST", action: "/api/profile/update" },
    );
  }, [fetcher, formData, posthog]);

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

  const activeStep = STEP_DETAILS[step - 1];
  const ActiveStepIcon = activeStep.icon;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => step > 1 && setStep((current) => current - 1)}
            disabled={step === 1}
            aria-label="Go to previous step"
          >
            <ChevronLeft />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium">{activeStep.title}</p>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                Step {step} of {TOTAL_STEPS}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Profile setup progress"
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-valuenow={step}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <section className="min-w-0">
          <div className="mb-5">
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <ActiveStepIcon />
              Student profile setup
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Let’s make your study space yours
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Set up your profile in a few steps. You can update these details anytime.
            </p>
          </div>

          <Card className="rounded-xl shadow-sm">
            <CardHeader className="border-b pb-5">
              <CardTitle className="text-xl">{activeStep.title}</CardTitle>
              <CardDescription>{activeStep.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
        {/* FIX 10: Form's action is handled in handleSubmit; fetcher.Form wraps correctly */}
        <fetcher.Form method="POST" onSubmit={handleSubmit} className="space-y-7">

          {/* Step 1: Display Name & Username */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">How should other students know you?</p>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Display Name <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => update({ displayName: e.target.value })}
                  placeholder="e.g., Ruben Yebga"
                  maxLength={50}
                  className="h-10 rounded-lg bg-background"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Your full name or nickname — at least 2 characters.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Username <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">@</span>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setUsernameTouched(true);
                      update({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") });
                    }}
                    placeholder="your_username"
                    maxLength={20}
                    className="h-10 rounded-lg bg-background pl-7"
                  />
                </div>
                <p className={`text-xs mt-1 ${formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)
                    ? "text-destructive"
                    : "text-muted-foreground"
                  }`}>
                  {formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)
                    ? "3–20 characters: letters, numbers, underscores only."
                    : "3–20 characters. Auto-suggested from your name."}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => update({ bio: e.target.value })}
                  placeholder="Tell other students a little about yourself…"
                  maxLength={200}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {formData.bio.length}/200
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Level */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">Which GCE exam are you preparing for?</p>

              <div className="grid gap-3">
                {(["olevel", "alevel"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => update({ level })}
                    aria-pressed={formData.level === level}
                    className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${formData.level === level
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/50"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {level === "olevel" ? "Ordinary Level" : "Advanced Level"}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {level === "olevel"
                            ? "Form 3–4-5"
                            : "Lower 6th–Upper 6th"}
                        </p>
                      </div>
                      {formData.level === level && (
                        <CheckCircle2 className="shrink-0 text-primary" size={22} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: School & Location */}
          {step === 3 && (
            <div className="space-y-5">

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  School Name
                </label>
                <Input
                  type="text"
                  value={formData.school}
                  onChange={(e) => update({ school: e.target.value })}
                  placeholder="e.g., Government Bilingual High School, Bamenda"
                  className="h-10 rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Region <span className="text-destructive">*</span>
                </label>
                {/* FIX 5: All 10 Cameroonian regions present, sorted alphabetically */}
                <select
                  value={formData.region}
                  onChange={(e) => update({ region: e.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            <div className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Subjects You're Studying <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                      aria-pressed={formData.subjects.includes(subject)}
                      className={`flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${formData.subjects.includes(subject)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-background text-foreground hover:bg-muted/50"
                        }`}
                    >
                      {subject}
                      {formData.subjects.includes(subject) && <Check className="size-4 shrink-0" />}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formData.subjects.length} selected · Select at least 1 subject
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Target Exam Year <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.targetExamYear || ""}
                  onChange={(e) => update({ targetExamYear: Number(e.target.value) })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Decide how your study profile appears to other students. You can change these choices later.
              </p>

              <div className="space-y-2">
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

              <div className="flex gap-3 rounded-xl border bg-muted/40 p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-6 text-muted-foreground">
                  <strong className="font-medium text-foreground">Your privacy matters.</strong>{" "}
                  Your email and personal details are never shown on your public profile.
                </p>
              </div>

              {/* Profile Preview */}
              <div className="rounded-xl border bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Profile preview</p>
                  <Badge variant="outline">Preview</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {formData.displayName.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {formData.displayName || "Your Name"}
                    </p>
                    {/* FIX 6: Memoized username preview */}
                    <p className="text-xs text-muted-foreground">
                      @{previewUsername} •{" "}
                      {formData.level === "olevel" ? "O-Level" : "A-Level"}
                    </p>
                  </div>
                </div>
                {formData.subjects.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {formData.subjects.map((subject) => (
                      <Badge key={subject} variant="secondary">{subject}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 border-t pt-5">
            {step > 1 && (
              <Button
                onClick={() => setStep((s) => s - 1)}
                type="button"
                variant="outline"
                className="rounded-lg"
              >
                <ChevronLeft />
                Back
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                type="button"
                className="ml-auto rounded-lg"
              >
                Continue
                <ArrowRight />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={fetcher.state === "submitting" || !canProceed()}
                className="ml-auto rounded-lg"
              >
                {fetcher.state === "submitting" ? "Saving..." : "Complete Profile"}
                {fetcher.state !== "submitting" && <Check />}
              </Button>
            )}
          </div>
        </fetcher.Form>

        {/* Form Errors — per-field, cleanly formatted */}
        {fetcher.data?.errors && (
          <div role="alert" className="mt-4 space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            {fetcher.data.message && (
              <p className="mb-2 text-sm font-semibold text-destructive">
                {fetcher.data.message}
              </p>
            )}
            {Object.values(fetcher.data.errors as Record<string, string>).map((msg, i) => (
              <p key={i} className="flex items-start gap-1.5 text-sm text-destructive">
                <span aria-hidden="true" className="mt-0.5 shrink-0">•</span>
                <span>{msg}</span>
              </p>
            ))}
          </div>
        )}
            </CardContent>
          </Card>
        </section>

        <aside className="hidden lg:block">
          <Card className="sticky top-24 rounded-xl shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Your setup</CardTitle>
              <CardDescription>Five quick steps to personalize your study space.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {STEP_DETAILS.map((item, index) => {
                const StepIcon = item.icon;
                const stepNumber = index + 1;
                const isComplete = stepNumber < step;
                const isCurrent = stepNumber === step;

                return (
                  <div
                    key={item.title}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${isCurrent ? "bg-muted" : ""}`}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isComplete ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {isComplete ? <Check className="size-4" /> : <StepIcon className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                        {item.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}

// ─── PrivacyToggle ────────────────────────────────────────────────────────────

// FIX 7: Properly typed (no `any`)
function PrivacyToggle({ label, description, checked, onChange }: PrivacyToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div>
        )}
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          aria-label={label}
        />
        <span className="h-6 w-11 rounded-full bg-muted-foreground/30 transition-colors peer-checked:bg-primary peer-focus-visible:outline-none peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-background after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
      </label>
    </div>
  );
}
