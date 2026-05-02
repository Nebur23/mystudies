# Leaderboard System Integration Guide

This guide will help you complete the integration of the leaderboard system with your React Router v7 fullstack application.

## Overview

The leaderboard system consists of:
- **Database Schema**: New tables for quiz scores and leaderboard rankings
- **Server Functions**: `leaderboard.server.ts` for database operations
- **API Routes**: Quiz submission endpoint
- **UI Components**: Updated practice and leaderboard pages
- **Styling**: Tailwind configuration with custom design tokens

## Setup Steps

### 1. Database Migrations

Generate and run Drizzle migrations for the new tables:

```bash
# Generate migrations
npm run db:generate

# Review the migration in drizzle/migrations/

# Run migrations
npm run db:push
```

The new tables added:
- `quiz_score`: Stores individual quiz attempts
- `leaderboard_ranking`: Denormalized rankings for fast queries

### 2. Authentication Integration

Update `~/lib/leaderboard.server.ts` and `~/app/routes/api.quiz.submit.ts` to use your betterAuth setup.

In `api.quiz.submit.ts`, replace `getUserIdFromRequest()`:

```typescript
import { auth } from "~/lib/auth.server"; // Your betterAuth instance

async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session?.user?.id || null;
}
```

In `leaderboard.tsx` loader, update the userId retrieval:

```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session?.user) {
    return redirect("/login");
  }

  const userId = session.user.id;
  // ... rest of the loader
}
```

### 3. Route Configuration

Ensure your routes are properly configured in `react-router.config.ts`:

```typescript
{
  path: "leaderboard",
  file: "./routes/leaderboard.route.tsx",
},
{
  path: "api/quiz/submit",
  file: "./routes/api.quiz.submit.ts",
}
```

### 4. Practice Page Integration

The practice page now includes:
- Quiz timer tracking
- Score submission to database
- Leaderboard revalidation after submission

Button click submits to `/api/quiz/submit` endpoint.

### 5. Styling

The Tailwind configuration is now in `tailwind.config.ts` with:
- Custom color tokens matching your design system
- Typography scales (h1, h2, h3, body-lg, body-md, etc.)
- Spacing scales
- Font families (Lexend, Inter)

### 6. Global Styles

Added to `app.css`:
- Material Symbols font
- `.podium-gradient` class for leaderboard design
- Material icon styling

## Database Schema Details

### quiz_score table
```
- id: text (primary key)
- userId: text (foreign key to user)
- quizId: text (e.g., "2022/A/math/paper1")
- score: integer (number correct)
- totalQuestions: integer
- percentage: decimal (0-100)
- timeSpent: integer (seconds)
- completedAt: timestamp
- createdAt: timestamp
- Indexes: userId, quizId, completedAt
```

### leaderboard_ranking table
```
- id: text (primary key)
- userId: text (foreign key to user)
- totalPoints: integer (cumulative)
- averageScore: decimal
- quizzesCompleted: integer
- weeklyPoints: integer
- monthlyPoints: integer
- lastUpdateAt: timestamp
- createdAt: timestamp
- updatedAt: timestamp
- Indexes: userId, totalPoints, weeklyPoints, monthlyPoints
```

## Server Functions

### submitQuizScore(data)
Submits a quiz score and updates leaderboard:
```typescript
const result = await submitQuizScore({
  userId: "user-123",
  quizId: "2022/A/math/paper1",
  score: 8,
  totalQuestions: 10,
  timeSpent: 1200, // seconds
});
```

### getLeaderboardData(userId, filter)
Fetches leaderboard with rankings:
```typescript
const data = await getLeaderboardData(userId, "week"); // "week" | "month" | "allTime"
```

Returns:
```typescript
{
  allTime: LeaderboardEntry[],
  week: LeaderboardEntry[],
  month: LeaderboardEntry[],
  userRank: UserRankInfo,
}
```

### getTopThree(filter)
Gets top 3 for podium display:
```typescript
const topThree = await getTopThree("allTime");
```

## Points Calculation

Current formula:
```typescript
points = min(round(percentage), 100)
```

Example:
- 80% score = 80 points
- 95% score = 95 points
- 100% score = 100 points

Modify in `submitQuizScore()` if needed.

## React Router v7 Patterns Used

1. **Loaders**: Server-side data fetching in `loader()`
2. **Actions**: Form submissions and mutations
3. **useLoaderData()**: Access loader data in components
4. **useSearchParams()**: URL query parameter management
5. **useNavigate()**: Client-side routing
6. **revalidator.revalidate()**: Refresh server data after mutation

## TODO - To Complete Integration

1. [ ] Integrate `getUserIdFromRequest()` with betterAuth
2. [ ] Generate and run database migrations
3. [ ] Test quiz score submission
4. [ ] Verify leaderboard calculations
5. [ ] Implement weekly/monthly point reset logic (if needed)
6. [ ] Add error handling and toast notifications
7. [ ] Test with multiple users
8. [ ] Optimize database queries if needed

## Troubleshooting

### Quiz scores not saving
- Check `api.quiz.submit.ts` receives valid userId
- Verify database migrations ran successfully
- Check console for error messages

### Leaderboard not updating
- Call `revalidator.revalidate()` after score submission
- Verify `leaderboardRanking` table has entries
- Check user exists in database

### Styling issues
- Ensure `tailwind.config.ts` is loaded in vite config
- Verify Material Symbols font link in `app.css`
- Check Tailwind cache: `npm run build` or clear `.next` folder

## Performance Considerations

- **Leaderboard queries**: Using indexes on userId, totalPoints, timestamps
- **Caching**: Consider caching leaderboard data for 5-10 minutes
- **Pagination**: Current implementation loads all users - add pagination for scale
- **Denormalization**: `leaderboardRanking` table reduces computation on each query

## Next Steps

1. Complete auth integration
2. Set up database migrations
3. Test end-to-end flow
4. Deploy and monitor
5. Consider adding:
   - User achievements/badges
   - Weekly challenges
   - Quiz history/statistics
   - Social features (following, competing with friends)
