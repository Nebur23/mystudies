import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer, decimal } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Quiz Score Tracking Table
export const quizScore = pgTable(
  "quiz_score",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    quizId: text("quiz_id").notNull(), // e.g., "2022/A/math/paper1"
    score: integer("score").notNull(), // Number of correct answers
    totalQuestions: integer("total_questions").notNull(),
    percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
    timeSpent: integer("time_spent").notNull(), // in seconds
    completedAt: timestamp("completed_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("quiz_score_userId_idx").on(table.userId),
    index("quiz_score_quizId_idx").on(table.quizId),
    index("quiz_score_completedAt_idx").on(table.completedAt),
  ],
);

// Leaderboard Rankings Table (denormalized for faster queries)
export const leaderboardRanking = pgTable(
  "leaderboard_ranking",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    totalPoints: integer("total_points").notNull().default(0),
    averageScore: decimal("average_score", { precision: 5, scale: 2 }).notNull().default("0"),
    quizzesCompleted: integer("quizzes_completed").notNull().default(0),
    weeklyPoints: integer("weekly_points").notNull().default(0),
    monthlyPoints: integer("monthly_points").notNull().default(0),
    lastUpdateAt: timestamp("last_update_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("leaderboard_ranking_userId_idx").on(table.userId),
    index("leaderboard_ranking_totalPoints_idx").on(table.totalPoints),
    index("leaderboard_ranking_weeklyPoints_idx").on(table.weeklyPoints),
    index("leaderboard_ranking_monthlyPoints_idx").on(table.monthlyPoints),
  ],
);

// Relations
export const quizScoreRelations = relations(quizScore, ({ one }) => ({
  user: one(user, {
    fields: [quizScore.userId],
    references: [user.id],
  }),
}));

export const leaderboardRankingRelations = relations(leaderboardRanking, ({ one }) => ({
  user: one(user, {
    fields: [leaderboardRanking.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  quizScores: many(quizScore),
  leaderboardRanking: many(leaderboardRanking),
}));
