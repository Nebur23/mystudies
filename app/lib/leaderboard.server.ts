import { db } from "~/db";
import { quizScore, leaderboardRanking, user } from "~/db/schema";
import { eq } from "drizzle-orm";

export interface QuizSubmissionData {
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
}

export interface LeaderboardStats {
  allTime: LeaderboardEntry[];
  week: LeaderboardEntry[];
  month: LeaderboardEntry[];
  userRank: UserRankInfo;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  totalPoints: number;
  averageScore: number;
  quizzesCompleted: number;
}

export interface UserRankInfo {
  rank: number;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  averageScore: number;
  quizzesCompleted: number;
}

/**
 * Submit a quiz score and update leaderboard rankings
 * Following React Router v7 action pattern
 */
export async function submitQuizScore(data: QuizSubmissionData) {
  try {
    // Calculate percentage
    const percentage = (data.score / data.totalQuestions) * 100;
    
    // Generate ID for quiz score
    const scoreId = crypto.randomUUID();
    
    // Insert quiz score
    await db.insert(quizScore).values({
      id: scoreId,
      userId: data.userId,
      quizId: data.quizId,
      score: data.score,
      totalQuestions: data.totalQuestions,
      percentage: percentage.toString(),
      timeSpent: data.timeSpent,
      completedAt: new Date(),
      createdAt: new Date(),
    });

    // Calculate points (e.g., percentage * 10, capped at 100)
    const points = Math.min(Math.round(percentage), 100);

    // Update leaderboard ranking
    await updateLeaderboardRanking(data.userId, points);

    return {
      success: true,
      scoreId,
      points,
      percentage,
    };
  } catch (error) {
    console.error("Error submitting quiz score:", error);
    throw error;
  }
}

/**
 * Update user's leaderboard ranking
 */
async function updateLeaderboardRanking(userId: string, points: number) {
  try {
    // Get or create leaderboard entry
    const existing = await db
      .select()
      .from(leaderboardRanking)
      .where(eq(leaderboardRanking.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      // Create new leaderboard entry
      await db.insert(leaderboardRanking).values({
        id: crypto.randomUUID(),
        userId,
        totalPoints: points,
        averageScore: points.toString(),
        quizzesCompleted: 1,
        weeklyPoints: points,
        monthlyPoints: points,
        lastUpdateAt: new Date(),
        createdAt: new Date(),
      });
    } else {
      // Update existing entry
      const current = existing[0];
      const newQuizzesCompleted = current.quizzesCompleted + 1;
      const newAverageScore =
        (parseFloat(current.averageScore) * current.quizzesCompleted + points) /
        newQuizzesCompleted;

      await db
        .update(leaderboardRanking)
        .set({
          totalPoints: current.totalPoints + points,
          averageScore: newAverageScore.toString(),
          quizzesCompleted: newQuizzesCompleted,
          weeklyPoints: current.weeklyPoints + points,
          monthlyPoints: current.monthlyPoints + points,
          lastUpdateAt: new Date(),
        })
        .where(eq(leaderboardRanking.userId, userId));
    }
  } catch (error) {
    console.error("Error updating leaderboard ranking:", error);
    throw error;
  }
}

/**
 * Get leaderboard data with different time filters
 * Used in the leaderboard loader
 */
export async function getLeaderboardData(
  userId: string,
  filter: "week" | "month" | "allTime" = "allTime"
) {
  try {
    // Get all users with their leaderboard data
    const leaderboardData = await db
      .select({
        userId: leaderboardRanking.userId,
        name: user.name,
        email: user.email,
        image: user.image,
        totalPoints: leaderboardRanking.totalPoints,
        averageScore: leaderboardRanking.averageScore,
        quizzesCompleted: leaderboardRanking.quizzesCompleted,
        weeklyPoints: leaderboardRanking.weeklyPoints,
        monthlyPoints: leaderboardRanking.monthlyPoints,
      })
      .from(leaderboardRanking)
      .innerJoin(user, eq(leaderboardRanking.userId, user.id));

    // Sort and rank based on filter
    let sortedData: typeof leaderboardData;

    if (filter === "week") {
      sortedData = leaderboardData.sort(
        (a, b) => b.weeklyPoints - a.weeklyPoints
      );
    } else if (filter === "month") {
      sortedData = leaderboardData.sort(
        (a, b) => b.monthlyPoints - a.monthlyPoints
      );
    } else {
      sortedData = leaderboardData.sort(
        (a, b) => b.totalPoints - a.totalPoints
      );
    }

    // Add rankings
    const rankedData: LeaderboardEntry[] = sortedData.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.name,
      email: entry.email,
      image: entry.image,
      totalPoints: entry.totalPoints,
      averageScore: parseFloat(entry.averageScore),
      quizzesCompleted: entry.quizzesCompleted,
    }));

    // Get current user's rank
    const userRankIndex = rankedData.findIndex((entry) => entry.userId === userId);
    const userRankEntry =
      userRankIndex !== -1 ? rankedData[userRankIndex] : null;

    // Get user-specific data
    const userData = leaderboardData.find((entry: { userId: string; }) => entry.userId === userId);

    const userRank: UserRankInfo = {
      rank: userRankIndex !== -1 ? userRankIndex + 1 : 0,
      totalPoints: userData?.totalPoints || 0,
      weeklyPoints: userData?.weeklyPoints || 0,
      monthlyPoints: userData?.monthlyPoints || 0,
      averageScore: userData ? parseFloat(userData.averageScore) : 0,
      quizzesCompleted: userData?.quizzesCompleted || 0,
    };

    return {
      allTime: rankedData,
      week: leaderboardData
        .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
        .map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          name: entry.name,
          email: entry.email,
          image: entry.image,
          totalPoints: entry.weeklyPoints,
          averageScore: parseFloat(entry.averageScore),
          quizzesCompleted: entry.quizzesCompleted,
        })),
      month: leaderboardData
        .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
        .map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          name: entry.name,
          email: entry.email,
          image: entry.image,
          totalPoints: entry.monthlyPoints,
          averageScore: parseFloat(entry.averageScore),
          quizzesCompleted: entry.quizzesCompleted,
        })),
      userRank,
    };
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    throw error;
  }
}

/**
 * Get top 3 users for podium display
 */
export async function getTopThree(filter: "week" | "month" | "allTime" = "allTime") {
  try {
    const leaderboardData = await db
      .select({
        userId: leaderboardRanking.userId,
        name: user.name,
        image: user.image,
        totalPoints: leaderboardRanking.totalPoints,
        weeklyPoints: leaderboardRanking.weeklyPoints,
        monthlyPoints: leaderboardRanking.monthlyPoints,
      })
      .from(leaderboardRanking)
      .innerJoin(user, eq(leaderboardRanking.userId, user.id));

    let sortedData = leaderboardData;

    if (filter === "week") {
      sortedData = leaderboardData.sort(
        (a, b) => b.weeklyPoints - a.weeklyPoints
      );
    } else if (filter === "month") {
      sortedData = leaderboardData.sort(
        (a, b) => b.monthlyPoints - a.monthlyPoints
      );
    } else {
      sortedData = leaderboardData.sort(
        (a, b) => b.totalPoints - a.totalPoints
      );
    }

    return sortedData.slice(0, 3).map((entry, index) => ({
      position: (index + 1) as 1 | 2 | 3,
      name: entry.name,
      image: entry.image,
      points:
        filter === "week"
          ? entry.weeklyPoints
          : filter === "month"
            ? entry.monthlyPoints
            : entry.totalPoints,
    }));
  } catch (error) {
    console.error("Error fetching top three:", error);
    throw error;
  }
}
