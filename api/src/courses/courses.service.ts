import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { DATABASE_CONNECTION } from '../database/database.connection.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { course } from '../db/schema.js';
import * as schema from '../db/schema.js';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { LearningProgressService } from '../learning-progress/learning-progress.service.js';
import { UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class CoursesService {

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>,
    private readonly learningProgressService: LearningProgressService
  ) {

  }

  create(createCourseDto: CreateCourseDto) {
    return 'This action adds a new course';
  }

  async findAll(search = '', level = '', subject = '', session?: UserSession) {
    // Fetch published courses with optional filters.

    const courseConditions = [eq(course.isPublished, true)]

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      courseConditions.push(
        sql`lower(${course.title}) LIKE ${`%${normalizedSearch}%`}`
      );
    }
    if (level) {
      courseConditions.push(eq(course.level, level as "olevel" | "alevel"));
    }
    if (subject) {
      courseConditions.push(eq(course.subject, subject));
    }

    const courses = await this.db.select({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      level: course.level,
      subject: course.subject,
    })
      .from(course)
      .where(and(...courseConditions))
      .orderBy(asc(course.title));

    const publishedCourseFilters = await this.db
      .selectDistinct({ level: course.level, subject: course.subject })
      .from(course)
      .where(eq(course.isPublished, true));

    const courseProgressMap = session?.user?.id
      ? await this.learningProgressService.findUserProgressPerCourse({ courses, session })
      : new Map(courses.map(({ id }) => [id, { completed: 0, total: 0 }]));

    return {
      courses,
      courseProgressMap: Object.fromEntries(
        courseProgressMap instanceof Map ? courseProgressMap : []
      ),
      availableFilters: {
        levels: [...new Set(publishedCourseFilters.map(({ level }) => level))],
        subjects: [...new Set(publishedCourseFilters.map(({ subject }) => subject))],
      },
    };
  }

  async findBySlug(slug: string, session: UserSession) {
    const [courseRecord] = await this.db
      .select()
      .from(schema.course)
      .where(and(
        eq(schema.course.slug, slug),
        eq(schema.course.isPublished, true),
      ))
      .limit(1);

    if (!courseRecord) {
      throw new NotFoundException('Course not found');
    }

    const modules = await this.db
      .select()
      .from(schema.courseModule)
      .where(eq(schema.courseModule.courseId, courseRecord.id))
      .orderBy(asc(schema.courseModule.order));

    const moduleIds = modules.map(({ id }) => id);
    const lessons = moduleIds.length > 0
      ? await this.db
        .select()
        .from(schema.courseLesson)
        .where(inArray(schema.courseLesson.moduleId, moduleIds))
        .orderBy(asc(schema.courseLesson.order))
      : [];
    const lessonsByModule = new Map<string, typeof lessons>();

    for (const lesson of lessons) {
      const moduleLessons = lessonsByModule.get(lesson.moduleId) ?? [];
      moduleLessons.push(lesson);
      lessonsByModule.set(lesson.moduleId, moduleLessons);
    }

    const lessonIds = lessons.map(({ id }) => id);
    const progressData = lessonIds.length > 0
      ? await this.db
        .select({
          lessonId: schema.userLessonProgress.lessonId,
          watchedSeconds: schema.userLessonProgress.watchedSeconds,
          completed: schema.userLessonProgress.completed,
          lastWatchedAt: schema.userLessonProgress.lastWatchedAt,
        })
        .from(schema.userLessonProgress)
        .where(and(
          inArray(schema.userLessonProgress.lessonId, lessonIds),
          eq(schema.userLessonProgress.userId, session.user.id),
        ))
      : [];

    const progressMap = Object.fromEntries(
      progressData.map((progress) => [
        progress.lessonId,
        {
          lessonId: progress.lessonId,
          watchedSeconds: progress.watchedSeconds ?? 0,
          completed: progress.completed ?? false,
          lastWatchedAt: progress.lastWatchedAt,
        },
      ]),
    );

    let nextLessonId: string | null = null;
    for (const module of modules) {
      for (const lesson of lessonsByModule.get(module.id) ?? []) {
        if (!progressMap[lesson.id]?.completed) {
          nextLessonId = lesson.id;
          break;
        }
      }
      if (nextLessonId) break;
    }

    const completedCount = progressData.filter(({ completed }) => completed).length;
    const totalLessons = lessons.length;

    return {
      course: {
        ...courseRecord,
        modules: modules.map((module) => ({
          ...module,
          lessons: lessonsByModule.get(module.id) ?? [],
        })),
      },
      progressMap,
      nextLessonId,
      progressPercent: totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0,
      totalLessons,
      completedCount,
      currentUserId: session.user.id,
    };
  }
  
  findOne(id: number) {
    return this.db.select().from(schema.course)

    return `This action returns a #${id} course`;
  }

  update(id: number, updateCourseDto: UpdateCourseDto) {
    return `This action updates a #${id} course`;
  }

  remove(id: number) {
    return `This action removes a #${id} course`;
  }
}
