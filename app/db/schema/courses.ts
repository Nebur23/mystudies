import { relations } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, index, uniqueIndex, jsonb, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const course = pgTable("course", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  level: varchar("level", { enum: ["olevel", "alevel"] }).notNull(),
  subject: text("subject").notNull(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const courseModule = pgTable("course_module", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text("course_id").notNull().references(() => course.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull(),
});

export const courseLesson = pgTable("course_lesson", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  moduleId: text("module_id").notNull().references(() => courseModule.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  youtubeVideoId: text("youtube_video_id").notNull(), // Store ONLY the ID (e.g., "dQw4w9WgXcQ")
  duration: integer("duration"), // seconds
  order: integer("order").notNull(),
  resources: jsonb("resources").$type<{ pdfUrl?: string; practiceQuizId?: string }>(),
});

export const userLessonProgress = pgTable("user_lesson_progress", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull().references(() => courseLesson.id, { onDelete: "cascade" }),
  watchedSeconds: integer("watched_seconds").default(0),
  completed: boolean("completed").default(false),
  lastWatchedAt: timestamp("last_watched_at"),
}, (table) => [
  uniqueIndex("user_lesson_progress_user_lesson_idx").on(table.userId, table.lessonId),
  index("user_lesson_progress_completed_idx").on(table.userId, table.completed),
]);

// Relations
export const courseRelations = relations(course, ({ many }) => ({
  modules: many(courseModule),
}));

export const courseModuleRelations = relations(courseModule, ({ one, many }) => ({
  course: one(course, { fields: [courseModule.courseId], references: [course.id] }),
  lessons: many(courseLesson),
}));

export const courseLessonRelations = relations(courseLesson, ({ one }) => ({
  module: one(courseModule, { fields: [courseLesson.moduleId], references: [courseModule.id] }),
}));

export const userLessonProgressRelations = relations(userLessonProgress, ({ one }) => ({
  user: one(user, { fields: [userLessonProgress.userId], references: [user.id] }),
  lesson: one(courseLesson, { fields: [userLessonProgress.lessonId], references: [courseLesson.id] }),
}));