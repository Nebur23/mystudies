import { sql, eq, and, or, ne } from "drizzle-orm";
import { db } from "~/db";
import { studentProfile } from "~/db/schema/social";



export async function getSuggestions(currentUserId: string) {
    // 1. Load current user's profile
    const currentUser = await db.query.studentProfile.findFirst({
        where: eq(studentProfile.userId, currentUserId),
    });

    if (!currentUser) return [];

    const school = currentUser.school ?? null;
    const region = currentUser.region ?? null;
    const subjects = currentUser.subjects ?? [];

    // 2. Need at least one signal to match on
    const matchConditions: any[] = [];

    if (school) {
        matchConditions.push(eq(studentProfile.school, school));
    }
    if (region) {
        matchConditions.push(eq(studentProfile.region, region));
    }
    if (subjects.length > 0) {
        // Any overlap: candidate has at least one of my subjects
        matchConditions.push(
            or(...subjects.map((s) =>
                sql`${studentProfile.subjects} @> jsonb_build_array(${s}::text)`
            ))
        );
    }

    if (matchConditions.length === 0) return [];

    // 3. Additive score: school=3, region=2, subject=1
    //    Uses ::text casts so Postgres can infer param types
    const schoolScore = school
        ? sql`CASE WHEN ${studentProfile.school} = ${school}::text THEN 3 ELSE 0 END`
        : sql`0`;

    const regionScore = region
        ? sql`CASE WHEN ${studentProfile.region} = ${region}::text THEN 2 ELSE 0 END`
        : sql`0`;

    const subjectScore = subjects.length > 0
        ? sql`CASE WHEN (${sql.join(
              subjects.map((s) => sql`${studentProfile.subjects} @> jsonb_build_array(${s}::text)`),
              sql` OR `
          )}) THEN 1 ELSE 0 END`
        : sql`0`;

    const totalScore = sql<number>`(${schoolScore} + ${regionScore} + ${subjectScore})`;

    // 4. matchReason = the strongest single criterion (for UI badge)
    const subjectWhen = subjects.length > 0
        ? sql`WHEN (${sql.join(
              subjects.map((s) => sql`${studentProfile.subjects} @> jsonb_build_array(${s}::text)`),
              sql` OR `
          )}) THEN 'same_subject'`
        : sql``;

    const matchReason = sql<"same_school" | "same_region" | "same_subject">`CASE
        WHEN ${school ? sql`${studentProfile.school} = ${school}::text` : sql`false`} THEN 'same_school'
        WHEN ${region ? sql`${studentProfile.region} = ${region}::text` : sql`false`} THEN 'same_region'
        ${subjectWhen}
        ELSE 'same_subject'
    END`;

    // 5. Run query
    const suggestions = await db
        .select({
            id: studentProfile.id,
            userId: studentProfile.userId,
            displayName: studentProfile.displayName,
            username: studentProfile.username,
            avatarUrl: studentProfile.avatarUrl,
            school: studentProfile.school,
            region: studentProfile.region,
            level: studentProfile.level,
            subjects: studentProfile.subjects,
            matchScore: totalScore,
            matchReason,
        })
        .from(studentProfile)
        .where(
            and(
                eq(studentProfile.isPublic, true),
                ne(studentProfile.userId, currentUserId),
                or(...matchConditions)
            )
        )
        .orderBy(sql`${totalScore} DESC`)
        .limit(12);

    return suggestions;
}