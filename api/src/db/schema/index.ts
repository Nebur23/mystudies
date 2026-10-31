// Re-export all tables and relations
export * from "./auth.js";
export * from "./quiz.js";
export * from "./social.js";
export * from "./courses.js";
export * from "./library.js";

// Cross-table userRelations lives here because it references tables from all files
// Need to import these for userRelations above
import { user, session, account } from "./auth.js";
import { quizScore, leaderboardRanking } from "./quiz.js";
import { activityComment, activityLike, report, studentProfile, studyActivity, userConnection, userNotification } from "./social.js";
import { userLessonProgress } from "./courses.js";
import { relations } from "drizzle-orm";

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  quizScores: many(quizScore),
  leaderboardRanking: many(leaderboardRanking),
  studentProfile: one(studentProfile),
  connectionsAsFollower: many(userConnection, { relationName: "follower" }),
  connectionsAsFollowing: many(userConnection, { relationName: "following" }),
  activities: many(studyActivity),
  likedActivities: many(activityLike),
  comments: many(activityComment),
  notifications: many(userNotification),
  sentReports: many(report, { relationName: "reporter" }),
  reviewedReports: many(report, { relationName: "reviewer" }),
  lessonProgress: many(userLessonProgress),
}));





