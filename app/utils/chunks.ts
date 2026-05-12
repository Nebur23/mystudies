// // In your quiz completion handler (e.g., after submitting a quiz)
// import { createStudyActivity } from "~/lib/activity";

// async function handleQuizComplete(quizResult: QuizResult) {
//   // ... existing logic (save score, update stats) ...
  
//   // Auto-create activity (privacy-aware)
//   await createStudyActivity({
//     userId: session.user.id,
//     type: "quiz_completed",
//     content: {
//       quizId: quizResult.quizId,
//       subject: quizResult.subject,
//       paper: quizResult.paper,
//       score: quizResult.score,
//       totalQuestions: quizResult.totalQuestions,
//       timeSpent: quizResult.timeSpent,
//     },
//     visibility: "connections_only", // Default: share with connections
//   });
// }


// // lib/activity.ts
// import { db } from "~/db";
// import { studyActivity } from "~/db/schema/social";

// export async function createStudyActivity(data: {
//   userId: string;
//   type: string;
//   content: Record<string, any>;
//   visibility?: "public" | "connections_only" | "private";
// }) {
//   return db.insert(studyActivity).values({
//     userId: data.userId,
//     type: data.type,
//     content: data.content,
//     visibility: data.visibility || "public",
//   }).returning();
// }