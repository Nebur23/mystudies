import { relations, sql } from "drizzle-orm";
import {
  pgTable, text, timestamp, boolean, integer,
  jsonb, varchar, index, unique
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const studentProfile = pgTable("student_profile", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique()
    .references(() => user.id, { onDelete: "cascade" }),

  level: varchar("level", { enum: ["olevel", "alevel"] }).notNull(),
  school: text("school"),
  location: text("location"),
  region: varchar("region", {
    enum: ["northwest","southwest","littoral","centre","west",
           "adamawa","north","east","south","far_north"],
  }),

  displayName: text("display_name").notNull(),
  username: text("username").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url").default("https://www.gravatar.com/avatar?d=mp&f=y"),
  coverImageUrl: text("cover_image_url").default("https://yu7tr24azt.ufs.sh/f/StMcjRNdv9k09sR2mIfVQmW5w8uAlF3vE1kgYzn2ZIxOLfbj"),

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
    whatsapp?: string; instagram?: string; tiktok?: string;
    facebook?: string; twitter?: string; linkedin?: string;
  }>(),

  // ✅ search_vector column is OMITTED from Drizzle schema.
  // It exists in PostgreSQL (added via manual migration) but Drizzle
  // never reads or writes it — the trigger handles it automatically.
  // Querying it is done via sql`` tagged template when needed.

  onboardCompletedAt: timestamp("onboard_completed_at"),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => [
  // ✅ Only btree indexes here — Drizzle handles these fine
  index("student_profile_userId_idx").on(table.userId),
  index("student_profile_username_idx").on(table.username),
  index("student_profile_level_region_idx").on(table.level, table.region),
  index("student_profile_school_idx").on(table.school),
  index("student_profile_isPublic_idx").on(table.isPublic),

  // ✅ GIN on jsonb subjects is okay — Drizzle supports this specific case
  index("student_profile_subjects_gin").using("gin", table.subjects),

  // ❌ DO NOT add GIN on search_vector or trgm expression indexes here
  // Those go in migrations-manual/002_search_vectors.sql
]);

export const userConnection = pgTable("user_connection", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  followerId: text("follower_id").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  followingId: text("following_id").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: varchar("status", {
    enum: ["pending", "accepted", "blocked", "rejected"],
  }).default("pending").notNull(),
  connectionContext: varchar("connection_context", {
    enum: ["same_school","same_subject","leaderboard","search","study_group","other"],
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => [
  index("user_connection_follower_idx").on(table.followerId),
  index("user_connection_following_idx").on(table.followingId),
  index("user_connection_status_idx").on(table.status),
  unique("user_connection_unique").on(table.followerId, table.followingId),
]);

export const studyActivity = pgTable("study_activity", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: varchar("type", {
    enum: [
      "quiz_completed","badge_earned","streak_milestone","leaderboard_rank",
      "subject_enrolled","study_session_started","note_shared",
      "question_asked","profile_updated",
    ],
  }).notNull(),
  content: jsonb("content").notNull().$type<{
    quizId?: string; subject?: string; paper?: string;
    score?: number; totalQuestions?: number; timeSpent?: number;
    badgeId?: string; badgeName?: string; badgeIcon?: string;
    streakDays?: number; rank?: number; category?: string;
    note?: string; question?: string;
    sessionId?: string; inviteOnly?: boolean;
    message?: string; imageUrl?: string;
  }>(),
  visibility: varchar("visibility", {
    enum: ["public", "connections_only", "private"],
  }).default("public").notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("study_activity_userId_idx").on(table.userId),
  index("study_activity_type_idx").on(table.type),
  index("study_activity_createdAt_idx").on(table.createdAt),
  index("study_activity_feed_idx").on(table.userId, table.visibility, table.createdAt),
  // ❌ Partial index with WHERE clause removed — goes in manual migration instead
]);

export const activityLike = pgTable("activity_like", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  activityId: text("activity_id").notNull()
    .references(() => studyActivity.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("activity_like_activity_idx").on(table.activityId),
  index("activity_like_user_idx").on(table.userId),
  unique("activity_like_unique").on(table.activityId, table.userId),
]);

export const activityComment = pgTable("activity_comment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  activityId: text("activity_id").notNull()
    .references(() => studyActivity.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentId: text("parent_id")
    .references((): any => activityComment.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => [
  index("activity_comment_activity_idx").on(table.activityId),
  index("activity_comment_parent_idx").on(table.parentId),
  index("activity_comment_createdAt_idx").on(table.createdAt),
]);

// ── Relations ──────────────────────────────────────────────────────────────

export const studentProfileRelations = relations(studentProfile, ({ one }) => ({
  user: one(user, { fields: [studentProfile.userId], references: [user.id] }),
}));

export const userConnectionRelations = relations(userConnection, ({ one }) => ({
  follower: one(user, {
    fields: [userConnection.followerId], references: [user.id],
    relationName: "follower",
  }),
  following: one(user, {
    fields: [userConnection.followingId], references: [user.id],
    relationName: "following",
  }),
}));

export const studyActivityRelations = relations(studyActivity, ({ one, many }) => ({
  user: one(user, { fields: [studyActivity.userId], references: [user.id] }),
  likes: many(activityLike),
  comments: many(activityComment),
}));

export const activityLikeRelations = relations(activityLike, ({ one }) => ({
  activity: one(studyActivity, { fields: [activityLike.activityId], references: [studyActivity.id] }),
  user: one(user, { fields: [activityLike.userId], references: [user.id] }),
}));

export const activityCommentRelations = relations(activityComment, ({ one, many }) => ({
  activity: one(studyActivity, { fields: [activityComment.activityId], references: [studyActivity.id] }),
  user: one(user, { fields: [activityComment.userId], references: [user.id] }),
  parent: one(activityComment, {
    fields: [activityComment.parentId], references: [activityComment.id],
    relationName: "comment_replies",
  }),
  replies: many(activityComment, { relationName: "replies" }),
}));


// ─────────────────────────────────────────────────────────────
// USER NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
export const userNotification = pgTable("user_notification", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: varchar("type", {
    enum: [
      "connection_request", "connection_accepted", "activity_like",
      "activity_comment", "badge_earned", "weekly_challenge",
      "study_invite", "report_resolved", "system_alert",
    ],
  }).notNull(),
  title:       text("title").notNull(),
  body:        text("body").notNull(),
  data: jsonb("data").$type<{
    activityId?:  string;
    fromUserId?:  string;
    fromUsername?: string;
    challengeId?: string;
    sessionId?:   string;
    reportId?:    string;
  }>(),
  inApp: boolean("in_app").default(true),
  email: boolean("email").default(false),
  push:  boolean("push").default(false),
  read:  boolean("read").default(false),
  deliveredAt: timestamp("delivered_at"),
  readAt:      timestamp("read_at"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("user_notification_userId_idx").on(table.userId),
  // ❌ Partial index (WHERE read = false) goes in manual migration
  index("user_notification_createdAt_idx").on(table.createdAt),
]);

// ─────────────────────────────────────────────────────────────
// REPORTS & MODERATION
// ─────────────────────────────────────────────────────────────
export const report = pgTable("report", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  reporterId: text("reporter_id").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  targetType: varchar("target_type", {
    enum: ["profile", "activity", "comment", "message"],
  }).notNull(),
  targetId: text("target_id").notNull(),
  reason: varchar("reason", {
    enum: ["spam", "harassment", "inappropriate", "fake_profile", "cheating", "copyright", "other"],
  }).notNull(),
  details:    text("details"),
  status: varchar("status", {
    enum: ["pending", "reviewed", "resolved", "dismissed", "escalated"],
  }).default("pending").notNull(),
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("report_target_idx").on(table.targetType, table.targetId),
  index("report_status_idx").on(table.status),
  index("report_reporterId_idx").on(table.reporterId),
  index("report_createdAt_idx").on(table.createdAt),
]);

// ─────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────
export const userNotificationRelations = relations(userNotification, ({ one }) => ({
  user: one(user, { fields: [userNotification.userId], references: [user.id] }),
}));

export const reportRelations = relations(report, ({ one }) => ({
  reporter: one(user, {
    fields: [report.reporterId], references: [user.id],
    relationName: "reporter",
  }),
  reviewer: one(user, {
    fields: [report.reviewedBy], references: [user.id],
    relationName: "reviewer",
  }),
}));