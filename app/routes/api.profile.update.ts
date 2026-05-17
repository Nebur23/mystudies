import { redirect } from "react-router";
import { eq, and } from "drizzle-orm";
import { db } from "~/db";
import { studentProfile } from "~/db/schema/social";
import { auth, requireAuth } from "~/lib/auth.server";
import { calculateProfileCompletion, generateUsername } from "~/utils/profileCompletion";
import { z } from "zod";
import type { Route } from "./+types/api.profile.update";
import { formatZodErrors } from "~/utils/zod";

// ─── Coercion helpers ─────────────────────────────────────────────────────────
//
// FormData serialises everything to strings. These transformers teach Zod how
// to safely coerce each non-string type that arrives from the wire.

/** "true" | "false" | "1" | "0"  →  boolean */
const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((v) => v === true || v === "true" || v === "1" || v === "on");

/** "2026" | 2026  →  number */
const numberFromString = z.union([z.number(), z.string()]).transform(Number);

/**
 * subjects arrive as either:
 *   - a real string[]  (JSON.stringify path)
 *   - a comma-joined string  "Mathematics,Physics"  (FormData path)
 *   - a single string  "Mathematics"
 */
const arrayFromString = z
  .union([z.array(z.string()), z.string()])
  .transform((v) =>
    Array.isArray(v)
      ? v
      : v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
  );

// ─── Schema ───────────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  // Identity
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50).optional(),
  username: z
    .string()
    .regex(
      /^[a-zA-Z0-9_]{3,20}$/,
      "Username must be 3–20 characters using only letters, numbers, or underscores",
    )
    .optional(),
  bio: z.string().max(200).optional(),

  // Academic
  level: z.enum(["olevel", "alevel"]).optional(),
  school: z.string().max(100).optional(),
  region: z
    .enum([
      "adamawa",
      "centre",
      "east",
      "far_north", // was missing from original
      "littoral",
      "north",
      "northwest",
      "south",
      "southwest",
      "west",
    ])
    .optional(),
  subjects: arrayFromString.optional(),
  targetExamYear: numberFromString.pipe(z.number().min(2024).max(2030)).optional(),

  // Privacy — all arrive as strings from FormData
  isPublic: booleanFromString.optional(),
  showStats: booleanFromString.optional(),
  showSubjects: booleanFromString.optional(),
  showBadges: booleanFromString.optional(),
  allowDirectMessages: booleanFromString.optional(),
  allowFriendRequests: booleanFromString.optional(),

  // Social
  socialLinks: z
    .object({
      whatsapp: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
      tiktok: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
  avatarUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),

  // Onboarding override
  markAsComplete: z.literal("true").optional(),
});



// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuth(request);

  const formData = await request.formData();

 // console.log("Received form data:", Object.fromEntries(formData.entries())); // Debug log to inspect incoming data

  const rawData = Object.fromEntries(formData);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validated = updateProfileSchema.safeParse(rawData);

  if (!validated.success) {
    return Response.json(
      {
        errors: formatZodErrors(validated.error.flatten().fieldErrors),
        message: "Please fix the errors below before continuing.",
      },
      { status: 400 },
    );
  }

  const data = validated.data;

 // console.log("Validated data:", data); // Debug log to inspect validated data

  // ── Username uniqueness ─────────────────────────────────────────────────────
  if (data.username) {
    const existing = await db.query.studentProfile.findFirst({
      where: and(
        eq(studentProfile.username, data.username),
        // Exclude the current user so they can re-save their own username
      ),
    });
    if (existing && existing.userId !== session.user.id) {
      return Response.json(
        {
          errors: { username: `@${data.username}: This username is already taken. Please choose another.` },
          message: "Username unavailable.",
        },
        { status: 409 },
      );
    }
  }

  // ── Build update payload ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    ...data,
    updatedAt: new Date(),
  };

  // Strip empty social link strings so we don't persist blank URLs
  if (data.socialLinks) {
    updateData.socialLinks = Object.fromEntries(
      Object.entries(data.socialLinks).filter(([, v]) => v && v !== ""),
    );
  }

  // ── Upsert ──────────────────────────────────────────────────────────────────
  await db
    .insert(studentProfile)
    .values({
      userId: session.user.id,
      level: "olevel", // safe default; overwritten by updateData if present
      displayName: session.user.name || "Student",
      username: generateUsername(session.user.name || "student"),
      ...updateData,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: studentProfile.userId,
      set: updateData,
    });

let updatedUser = null;

  if (data.avatarUrl) {

   updatedUser = await auth.api.updateUser({
      body: {
        image: data.avatarUrl,
        // Additional custom fields defined in your schema
      },
      headers: request.headers , // Requires session headers to authenticate the request
      returnHeaders: true, // Return updated session headers if the avatar URL is part of the session data
    });

    
  }



  // ── Auto-complete onboarding if threshold reached ───────────────────────────
  const updatedProfile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
  });

  if (updatedProfile && !updatedProfile.onboardCompletedAt) {
    const completion = calculateProfileCompletion(updatedProfile);
    const shouldComplete = completion.isComplete || data.markAsComplete === "true";

    if (shouldComplete) {
      await db
        .update(studentProfile)
        .set({ onboardCompletedAt: new Date() })
        .where(eq(studentProfile.userId, session.user.id));
    }
  }

  // ── Redirect ────────────────────────────────────────────────────────────────
  const finalProfile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
  });


  return redirect(`/profile/${finalProfile?.username ?? "me"}`, {headers: updatedUser?.headers }); // Pass updated session headers if available
}
