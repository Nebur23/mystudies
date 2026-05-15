// Re-export all tables and relations
export * from "./auth";
export * from "./quiz";
export * from "./social";
export * from "./courses";

// Cross-table userRelations lives here because it references tables from all files
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { quizScore, leaderboardRanking } from "./quiz";
import { activityComment, activityLike, report, studentProfile, studyActivity, userConnection, userNotification } from "./social";
import { userLessonProgress } from "./courses";

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




// Need to import these for userRelations above
import { session, account } from "./auth";

