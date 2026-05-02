import { submitQuizScore } from "~/lib/leaderboard.server";
import type { Route } from "./+types/pratice";
import { auth } from "~/lib/auth.server";



/**
 * API Route: POST /api/quiz/submit
 * Handles quiz score submissions and leaderboard updates
 * React Router v7 action pattern
 */
export async function action({ request }: Route.ActionArgs) {


  try {
    const body = await request.json();
    const { quizId, score, totalQuestions, timeSpent } = body;

    // Validate input
    if (!quizId || score === undefined || !totalQuestions || timeSpent === undefined) {
       return Response.json(
         { error: "Missing required fields" },
         { status: 400 }
       );
    }

    // Get user ID from session (TODO: implement with your auth)
    const session = await auth.api.getSession({headers:request.headers})

    const userId = session?.user.id
    
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Submit the score
    const result = await submitQuizScore({
      userId,
      quizId,
      score,
      totalQuestions,
      timeSpent,
    });

    return {
      success: true,
      data: result,
      message: `Great job! You earned ${result.points} points!`,
    };
  } catch (error) {
    console.error("Error in quiz submission:", error);
    return {
      error: "Failed to submit quiz score" ,
       status: 500 
    };
  }
}

/**
 * Helper function to extract user ID from request
 * TODO: Integrate with your actual session/auth system
 */
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  // This should extract the user ID from session cookies or headers
  // Example implementation:
  // const session = await getSession(request.headers.get("cookie"));
  // return session?.userId || null;

  // Placeholder - replace with actual implementation
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // Validate and extract user ID from token
    // For now, returning placeholder
    return "user-123";
  }

  return null;
}
