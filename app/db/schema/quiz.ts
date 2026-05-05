import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, integer, decimal, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const quizScore = pgTable("quiz_score", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  timeSpent: integer("time_spent").notNull(),
  completedAt: timestamp("completed_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
}, (table) => [
  index("quiz_score_userId_idx").on(table.userId),
  index("quiz_score_quizId_idx").on(table.quizId),
  index("quiz_score_completedAt_idx").on(table.completedAt),
]);

export const leaderboardRanking = pgTable("leaderboard_ranking", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").notNull().default(0),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }).notNull().default("0"),
  quizzesCompleted: integer("quizzes_completed").notNull().default(0),
  weeklyPoints: integer("weekly_points").notNull().default(0),
  monthlyPoints: integer("monthly_points").notNull().default(0),
  lastUpdateAt: timestamp("last_update_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("leaderboard_ranking_userId_idx").on(table.userId),
  index("leaderboard_ranking_totalPoints_idx").on(table.totalPoints),
  index("leaderboard_ranking_weeklyPoints_idx").on(table.weeklyPoints),
  index("leaderboard_ranking_monthlyPoints_idx").on(table.monthlyPoints),
]);

export const quizScoreRelations = relations(quizScore, ({ one }) => ({
  user: one(user, { fields: [quizScore.userId], references: [user.id] }),
}));

export const leaderboardRankingRelations = relations(leaderboardRanking, ({ one }) => ({
  user: one(user, { fields: [leaderboardRanking.userId], references: [user.id] }),
}));