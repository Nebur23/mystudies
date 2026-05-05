import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { user } from "./auth";  // ✅ imports from auth, not from index

export const studentProfile = pgTable("student_profile", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  level: varchar("level", { enum: ["olevel", "alevel"] }).notNull(),
  school: text("school"),
  location: text("location"),
  region: varchar("region", {
    enum: ["northwest", "southwest", "littoral", "centre", "west", "adamawa", "north", "east", "south"],
  }),
  displayName: text("display_name").notNull(),
  username: text("username").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  coverImageUrl: text("cover_image_url"),
  subjects: jsonb("subjects").$type<string[]>().default([]),
  targetExamYear: integer("target_exam_year"),
  studyGoals: jsonb("study_goals").$type<string[]>().default([]),
  isPublic: boolean("is_public").default(true),
  showStats: boolean("show_stats").default(true),
  showSubjects: boolean("show_subjects").default(true),
  showBadges: boolean("show_badges").default(true),
  allowDirectMessages: boolean("allow_direct_messages").default(true),
  allowFriendRequests: boolean("allow_friend_requests").default(true),
  socialLinks: jsonb("social_links").$type<{
    whatsapp?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  }>(),
  
  onboardCompletedAt: timestamp("onboard_completed_at"), // null = incomplete
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => [
  index("student_profile_userId_idx").on(table.userId),
  index("student_profile_username_idx").on(table.username),
  index("student_profile_level_region_idx").on(table.level, table.region),
  index("student_profile_school_idx").on(table.school),
  index("student_profile_subjects_gin").using("gin", table.subjects),
]);

export const studentProfileRelations = relations(studentProfile, ({ one }) => ({
  user: one(user, { fields: [studentProfile.userId], references: [user.id] }),
}));



