# Leaderboard System - Quick Reference

## What Was Added

### 1. Database Schema (schema.ts)
- **quiz_score**: Tracks individual quiz attempts
- **leaderboard_ranking**: Denormalized rankings for fast queries

### 2. Server Logic (leaderboard.server.ts)
- `submitQuizScore()` - Submit quiz result and update leaderboard
- `getLeaderboardData()` - Fetch rankings with filters
- `getTopThree()` - Get podium winners

### 3. API Endpoints
- `POST /api/quiz/submit` - Submit quiz scores

### 4. UI Components
- Updated leaderboard page with live rankings
- Segmented filter buttons (Week/Month/All Time)
- Podium display with 1st/2nd/3rd place
- Current user highlight
- Practice page integration

### 5. Styling
- Tailwind configuration with design tokens
- Global styles for Material Icons
- Podium gradient effect
- Responsive design

## Key Files to Know

| File | Purpose |
|------|---------|
| `app/db/schema.ts` | Database tables definition |
| `app/server/db.ts` | Database client |
| `app/lib/leaderboard.server.ts` | Server functions |
| `app/routes/api.quiz.submit.ts` | Quiz submission endpoint |
| `app/routes/leaderboard.tsx` | Leaderboard UI (use leaderboard.new.tsx after rename) |
| `app/routes/pratice.tsx` | Practice page with score submission |
| `tailwind.config.ts` | Design system tokens |
| `app/app.css` | Global styles |

## Setup Quick Start

```bash
# 1. Generate migration
npm run db:generate

# 2. Apply migration
npm run db:push

# 3. Update auth in api.quiz.submit.ts
# Edit: getUserIdFromRequest() function

# 4. Update auth in leaderboard.tsx
# Edit: loader() function

# 5. Deploy
npm run build
npm start
```

## Data Flow

```
Practice Page → Submit Quiz
    ↓
/api/quiz/submit (action)
    ↓
submitQuizScore() (server)
    ↓
Insert quiz_score → Update leaderboard_ranking
    ↓
Return points earned
    ↓
Leaderboard Page → Display Rankings
```

## API Example

```typescript
// Submit quiz score
const response = await fetch("/api/quiz/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    quizId: "2022/A/math/paper1",
    score: 8,
    totalQuestions: 10,
    timeSpent: 1200, // seconds
  }),
});

// Response
{
  success: true,
  data: {
    scoreId: "uuid",
    points: 80,
    percentage: 80
  },
  message: "Great job! You earned 80 points!"
}
```

## Filter Behavior

| Filter | Source | Order |
|--------|--------|-------|
| This Week | `weeklyPoints` | Descending |
| This Month | `monthlyPoints` | Descending |
| All Time | `totalPoints` | Descending |

## Points System

- **Formula**: min(round(percentage), 100)
- **Range**: 0-100 points per quiz
- **Example**: 85% quiz = 85 points

## User Position Calculation

```typescript
// Shows user's rank among all users
rank = (userIndex + 1) / totalUsers * 100

// Example: 242nd place out of 500 users
percentile = (242 / 500) * 100 = 48.4%
Displayed as "Top 48%"
```

## Database Indexes

For performance optimization:
- `quiz_score_userId_idx` - User query optimization
- `quiz_score_quizId_idx` - Quiz history queries
- `quiz_score_completedAt_idx` - Date range queries
- `leaderboard_ranking_userId_idx` - User lookups
- `leaderboard_ranking_totalPoints_idx` - Sorting by points

## Common Tasks

### View User's Quiz History
```typescript
const scores = await db
  .select()
  .from(quizScore)
  .where(eq(quizScore.userId, userId));
```

### Reset Weekly Points
```typescript
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
await db
  .update(leaderboardRanking)
  .set({ weeklyPoints: 0, lastUpdateAt: new Date() })
  .where(lt(leaderboardRanking.lastUpdateAt, weekAgo));
```

### Get Top 10 This Month
```typescript
const topTen = await db
  .select()
  .from(leaderboardRanking)
  .innerJoin(user, eq(leaderboardRanking.userId, user.id))
  .orderBy(desc(leaderboardRanking.monthlyPoints))
  .limit(10);
```

## React Router v7 Patterns Used

- **Loader**: `export async function loader()`
- **Action**: `export async function action()`
- **useLoaderData()**: Access loader data
- **useNavigate()**: Route navigation
- **useRevalidator()**: Refresh server data

## Environment Variables Needed

```
DATABASE_URL=postgresql://...
# Add any auth-related env vars
```

## Testing Checklist

- [ ] Quiz submission saves to database
- [ ] Leaderboard rankings update correctly
- [ ] Filter buttons work (week/month/all time)
- [ ] User position displays accurately
- [ ] Multiple users show in correct order
- [ ] Podium shows top 3 correctly
- [ ] No console errors

## Troubleshooting Commands

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# View quiz_score table
psql $DATABASE_URL -c "SELECT * FROM quiz_score LIMIT 10;"

# View leaderboard_ranking
psql $DATABASE_URL -c "SELECT * FROM leaderboard_ranking LIMIT 10;"

# Check migration status
npm run db:check

# Clear and re-run migrations
npm run db:drop
npm run db:push
```

## Performance Tips

1. **Caching**: Cache leaderboard data for 5-10 minutes
2. **Pagination**: Show 50 users per page
3. **Indexes**: Already added on key columns
4. **Query optimization**: Use SELECT * only when necessary

## Security Considerations

- ✅ User auth required for submission
- ✅ Server-side score validation
- ✅ User can only submit for themselves
- ⚠️ TODO: Rate limiting on submissions
- ⚠️ TODO: Fraud detection for impossible scores

## Future Enhancements

1. Achievements/badges system
2. Quiz history statistics
3. Compare with friends
4. Weekly challenges
5. Leaderboard notifications
6. Admin moderation tools
7. Export rankings to CSV
