import { Inject, Injectable } from '@nestjs/common';
import { CreateLearningProgressDto } from './dto/create-learning-progress.dto.js';
import { UpdateLearningProgressDto } from './dto/update-learning-progress.dto.js';
import { CurrentLearningProgressDto } from './dto/current-user-progress-per-course.dto.js';
import { DATABASE_CONNECTION } from '../database/database.connection.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { courseLesson, courseModule, userLessonProgress } from '../db/schema.js';
import { and, eq, inArray } from 'drizzle-orm';

@Injectable()
export class LearningProgressService {

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<{ userLessonProgress: typeof userLessonProgress }>,
  ) {
  }

  create(createLearningProgressDto: CreateLearningProgressDto) {
    return 'This action adds a new learningProgress';
  }

  findAll() {
    return `This action returns all learningProgress`;
  }

  async findUserProgressPerCourse(currentUserProgressPerCourseDto: CurrentLearningProgressDto) {

    const { courses, session } = currentUserProgressPerCourseDto;

       // Fetch User Progress for ALL lessons in these courses
    // (Efficient single query instead of N+1)
    const courseIds = courses.map(c => c.id);

    let progressData: { id: string; userId: string; lessonId: string; watchedSeconds: number | null; completed: boolean | null; lastWatchedAt: Date | null; }[] = [];
    let allLessonIds: { id: string; courseId: string; }[] = [];
    if (courseIds.length > 0) {
        // Get all lesson IDs for these courses first

        // Better approach: Join courseLesson -> courseModule -> course
        allLessonIds = await this.db.select({ id: courseLesson.id, courseId: courseModule.courseId })
            .from(courseLesson)
            .innerJoin(courseModule, eq(courseLesson.moduleId, courseModule.id))
            .where(inArray(courseModule.courseId, courseIds));

        const lessonIds = allLessonIds.map(l => l.id);


        if (lessonIds.length > 0) {
  

             progressData = await this.db
                .select({
                    id: userLessonProgress.id,
                    userId: userLessonProgress.userId,
                    lessonId: userLessonProgress.lessonId,
                    watchedSeconds: userLessonProgress.watchedSeconds,
                    completed: userLessonProgress.completed,
                    lastWatchedAt: userLessonProgress.lastWatchedAt,
                })
                .from(userLessonProgress)
                .where(and(
                    inArray(userLessonProgress.lessonId, lessonIds),
                    eq(userLessonProgress.userId, session.user.id),
                ));
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

  findOne(id: number) {
    return `This action returns a #${id} learningProgress`;
  }

  update(id: number, updateLearningProgressDto: UpdateLearningProgressDto) {
    return `This action updates a #${id} learningProgress`;
  }

  remove(id: number) {
    return `This action removes a #${id} learningProgress`;
  }
}
