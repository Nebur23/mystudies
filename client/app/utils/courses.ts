import { and, asc, eq, inArray, or, sql } from "drizzle-orm"
import { course, courseLesson, courseModule, userLessonProgress } from "../db/schema"
import { db } from "~/db";
import type { Course } from "~/types/course";
import type { Session } from "~/lib/auth-types";



export const getSearchedCourses = async (search: string, level: string, subject: string): Promise<Course[]> => {
    // Fetch Published Courses (with optional filters)

    const courseConditions = [eq(course.isPublished, true)]

    if (search) {
        courseConditions.push(
            or(
                sql`lower(${course.title}) LIKE ${`%${search}%`}`,
                sql`lower(${course.subject}) LIKE ${`%${search}%`}`
            )!
        );
    }
    if (level) {
        courseConditions.push(eq(course.level, level as "olevel" | "alevel"));
    }
    if (subject) {
        courseConditions.push(eq(course.subject, subject));
    }

    const courses = await db.query.course.findMany({
        where: and(...courseConditions),
        orderBy: asc(course.title),
        columns: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnailUrl: true,
            level: true,
            subject: true,
        }
    });

    return courses

}

// number of completed video and total video per course
export const currentUserProgressPerCourse = async (courses: Course[], session: Session) => {


    // Fetch User Progress for ALL lessons in these courses
    // (Efficient single query instead of N+1)
    const courseIds = courses.map(c => c.id);

    let progressData: { id: string; userId: string; lessonId: string; watchedSeconds: number | null; completed: boolean | null; lastWatchedAt: Date | null; }[] = [];
    let allLessonIds: { id: string; courseId: string; }[] = [];
    if (courseIds.length > 0) {
        // Get all lesson IDs for these courses first

        // Better approach: Join courseLesson -> courseModule -> course
        allLessonIds = await db
            .select({ id: courseLesson.id, courseId: courseModule.courseId })
            .from(courseLesson)
            .innerJoin(courseModule, eq(courseLesson.moduleId, courseModule.id))
            .where(inArray(courseModule.courseId, courseIds));

        const lessonIds = allLessonIds.map(l => l.id);

        if (lessonIds.length > 0) {
            progressData = await db.query.userLessonProgress.findMany({
                where: and(
                    inArray(userLessonProgress.lessonId, lessonIds),
                    eq(userLessonProgress.userId, session.user.id)
                )
            });
        }
    }

    // 3. Calculate progress per course
    const courseProgressMap = new Map<string, { completed: number; total: number }>();

    for (const c of courses) {
        const courseLessons = allLessonIds.filter((l: { courseId: string; }) => l.courseId === c.id);
        const total = courseLessons.length;
        const completed = progressData.filter(
            p => courseLessons.some((l: { id: any; }) => l.id === p.lessonId) && p.completed
        ).length;

        courseProgressMap.set(c.id, { completed, total });
    }

    return courseProgressMap
}