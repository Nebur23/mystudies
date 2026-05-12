import { sql, eq, and, or, desc } from "drizzle-orm";
import { db } from "~/db";
import { studentProfile } from "~/db/schema/social";

const VALID_LEVELS = ["olevel", "alevel"] as const;
const VALID_REGIONS = [
    "adamawa", "centre", "east", "far_north",
    "littoral", "north", "northwest", "south", "southwest", "west",
] as const;

type Level = typeof VALID_LEVELS[number];
type Region = typeof VALID_REGIONS[number];

function isValidLevel(v: string | null): v is Level {
    return VALID_LEVELS.includes(v as Level);
}
function isValidRegion(v: string | null): v is Region {
    return VALID_REGIONS.includes(v as Region);
}

export type SearchResult = {
    results: {
        id: string;
        userId: string;
        displayName: string | null;
        username: string | null;
        avatarUrl: string | null;
        school: string | null;
        region: string | null;
        level: string | null;
        subjects: string[] | null;
        matchScore: number;
    }[];
    total: number;
    page: number;
    hasNextPage: boolean;
    query: string;
    filters: { level: Level | null; region: Region | null; subject: string | null };
    error?: string;
};

// Reusable sql snippet — avoids repeating the trgm expression
const trgmExpr = (q: string) => sql`
    similarity(
        lower(
            coalesce(${studentProfile.displayName}, '') || ' ' ||
            coalesce(${studentProfile.username}, '')   || ' ' ||
            coalesce(${studentProfile.school}, '')
        ),
        lower(${q})
    )
`;

export async function searchStudents({ request }: { request: Request }): Promise<SearchResult> {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = 20;
    const offset = (page - 1) * limit;

    const rawLevel  = url.searchParams.get("level");
    const rawRegion = url.searchParams.get("region");
    const rawSubject = url.searchParams.get("subject")?.trim() ?? "";

    if (rawLevel && !isValidLevel(rawLevel)) {
        return {
            results: [], total: 0, page, hasNextPage: false, query: q,
            filters: { level: null, region: null, subject: null },
            error: `Invalid level: "${rawLevel}". Must be one of: ${VALID_LEVELS.join(", ")}.`,
        };
    }
    if (rawRegion && !isValidRegion(rawRegion)) {
        return {
            results: [], total: 0, page, hasNextPage: false, query: q,
            filters: { level: null, region: null, subject: null },
            error: `Invalid region: "${rawRegion}". Must be one of: ${VALID_REGIONS.join(", ")}.`,
        };
    }

    const level  = rawLevel  as Level  | null;
    const region = rawRegion as Region | null;

    // ── WHERE conditions ────────────────────────────────────────────────────────
    const conditions: ReturnType<typeof eq>[] = [eq(studentProfile.isPublic, true)];

    if (q) {
        conditions.push(
            or(
                // ✅ raw string "search_vector" — not studentProfile.searchVector
                sql`search_vector @@ websearch_to_tsquery('english', unaccent(${q}))`,
                sql`${trgmExpr(q)} > 0.3`
            ) as any
        );
    }

    if (level)  conditions.push(eq(studentProfile.level, level));
    if (region) conditions.push(eq(studentProfile.region, region));

    if (rawSubject) {
        conditions.push(
            sql`${studentProfile.subjects} @> jsonb_build_array(${rawSubject}::text)` as any
        );
    }

    // ── Ranking expression ──────────────────────────────────────────────────────
    const rankExpr = q
        ? sql<number>`CASE
            WHEN search_vector @@ websearch_to_tsquery('english', unaccent(${q}))
                THEN ts_rank('{0.1, 0.2, 0.4, 1.0}', search_vector,
                             websearch_to_tsquery('english', unaccent(${q}))) * 2
            ELSE ${trgmExpr(q)}
          END`
        : sql<number>`1`;

    const orderExpr = q
        ? sql`CASE
            WHEN search_vector @@ websearch_to_tsquery('english', unaccent(${q}))
                THEN ts_rank('{0.1, 0.2, 0.4, 1.0}', search_vector,
                             websearch_to_tsquery('english', unaccent(${q}))) * 2
            ELSE ${trgmExpr(q)}
          END DESC`
        : desc(studentProfile.lastActiveAt);

    // ── Run count + results in parallel ─────────────────────────────────────────
    const whereClause = and(...conditions);

    const [results, [{ total }]] = await Promise.all([
        db.select({
                id:          studentProfile.id,
                userId:      studentProfile.userId,
                displayName: studentProfile.displayName,
                username:    studentProfile.username,
                avatarUrl:   studentProfile.avatarUrl,
                school:      studentProfile.school,
                region:      studentProfile.region,
                level:       studentProfile.level,
                subjects:    studentProfile.subjects,
                matchScore:  rankExpr,
            })
            .from(studentProfile)
            .where(whereClause)
            .orderBy(orderExpr)
            .limit(limit)
            .offset(offset),

        db.select({ total: sql<number>`COUNT(*)::int` })
            .from(studentProfile)
            .where(whereClause),
    ]);

    return {
        results,
        total,
        page,
        hasNextPage: offset + results.length < total,
        query: q,
        filters: { level, region, subject: rawSubject || null },
    };
}