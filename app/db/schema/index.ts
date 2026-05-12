// Re-export all tables and relations
export * from "./auth";
export * from "./quiz";
export * from "./social";

// Cross-table userRelations lives here because it references tables from all files
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { quizScore, leaderboardRanking } from "./quiz";
import { activityComment, activityLike, studentProfile, studyActivity, userConnection } from "./social";

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
}));



// Need to import these for userRelations above
import { session, account } from "./auth";