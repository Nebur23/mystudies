# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the MyStudies GCE exam-prep platform. The following changes were made:

- **`app/entry.client.tsx`** — Initializes `posthog-js` with the project token/host from env vars and wraps the React app in `PostHogProvider`. Enables `__add_tracing_headers` so client session/distinct IDs are automatically forwarded to the server on every request.
- **`app/lib/posthog-middleware.ts`** _(new)_ — Server-side React Router middleware that creates a `posthog-node` client per request, reads `X-POSTHOG-SESSION-ID` / `X-POSTHOG-DISTINCT-ID` headers, and attaches the client to `context.posthog` via `withContext()` so server events correlate with the correct browser session.
- **`app/root.tsx`** — Exports the `posthogMiddleware` array (enabling server-side tracking for all routes) and calls `posthog.captureException(error)` inside `ErrorBoundary` for automatic unhandled error tracking.
- **`react-router.config.ts`** — Added `future: { v8_middleware: true }` to enable the middleware system.
- **`vite.config.ts`** — Added `ssr.noExternal` for `posthog-js` / `@posthog/react`, and a dev-server proxy that routes `/ingest/*` to PostHog's ingestion endpoint (avoids ad-blockers in development).
- **`app/routes/auth/signin.tsx`** — Calls `posthog.identify(email)` and captures `user_signed_in` (with `method: "email"` or `"google"`) on successful sign-in.
- **`app/routes/auth/signup.tsx`** — Calls `posthog.identify(email)` and captures `user_signed_up` (with `method: "email"`, `"google"`, or `"facebook"`) on successful registration.
- **`app/routes/profile/onboarding.profile.tsx`** — Captures `onboarding_completed` with `level`, `region`, `subjects_count`, and `target_exam_year` when the profile setup wizard is submitted.
- **`app/routes/courses/courses.$slug.tsx`** — Captures `lesson_selected` (with course context) when a user picks a lesson, and `lesson_completed` (with `watched_seconds`) when a lesson is marked done.
- **`app/routes/library.$slug.tsx`** — Captures `resource_downloaded`, `resource_bookmarked`, and `resource_shared` with full resource metadata (subject, level, category, is_premium).
- **`app/routes/practice/practice.$paperId.tsx`** — Captures `quiz_started` on the first answered question, `quiz_completed` when results are shown (with score/percentage/time), and `quiz_score_saved` when the server confirms a leaderboard submission.
- **`app/components/connections/ConnectButton.tsx`** — Captures `connection_request_sent` and `connection_accepted` in the connection action handler.
- **`app/routes/api.quiz.submit.ts`** — Server-side: captures `server_quiz_submitted` via `context.posthog` with quiz ID, score, and points earned, correlated to the authenticated user's distinct ID.

---

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `user_signed_in` | User signs in with email and password or OAuth. | `app/routes/auth/signin.tsx` |
| `user_signed_up` | User creates a new account via email or OAuth. | `app/routes/auth/signup.tsx` |
| `onboarding_completed` | User submits the profile setup wizard on the final step. | `app/routes/profile/onboarding.profile.tsx` |
| `lesson_selected` | User selects a lesson from the course lesson list. | `app/routes/courses/courses.$slug.tsx` |
| `lesson_completed` | User finishes watching a lesson and it is marked complete. | `app/routes/courses/courses.$slug.tsx` |
| `resource_downloaded` | User initiates a download of a library resource. | `app/routes/library.$slug.tsx` |
| `resource_bookmarked` | User adds or removes a bookmark on a library resource. | `app/routes/library.$slug.tsx` |
| `resource_shared` | User shares or copies the link to a library resource. | `app/routes/library.$slug.tsx` |
| `quiz_started` | User answers the first question of a practice quiz. | `app/routes/practice/practice.$paperId.tsx` |
| `quiz_completed` | User finishes all questions and the results screen is shown. | `app/routes/practice/practice.$paperId.tsx` |
| `quiz_score_saved` | User successfully saves their quiz score to the leaderboard. | `app/routes/practice/practice.$paperId.tsx` |
| `connection_request_sent` | User sends a connection request to another student. | `app/components/connections/ConnectButton.tsx` |
| `connection_accepted` | User accepts an incoming connection request. | `app/components/connections/ConnectButton.tsx` |
| `server_quiz_submitted` | Server records a quiz submission and score for leaderboard. | `app/routes/api.quiz.submit.ts` |

---

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

**Dashboard**
- [Analytics basics (wizard)](https://us.posthog.com/project/479870/dashboard/1741564)

**Insights**
- [User Sign-ups & Sign-ins (wizard)](https://us.posthog.com/project/479870/insights/0E4e9z14)
- [Quiz Engagement (wizard)](https://us.posthog.com/project/479870/insights/CmbK7Iah)
- [Library Engagement (wizard)](https://us.posthog.com/project/479870/insights/NyJLx9dx)
- [Lesson Completions (wizard)](https://us.posthog.com/project/479870/insights/fM7DdFm7)
- [Sign-up to Onboarding Funnel (wizard)](https://us.posthog.com/project/479870/insights/moodsxqD)

---

## Verify before merging

- [ ] Run a full production build (`bun run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs. Consider calling `identify` after session rehydration (e.g. in the `appLayout.tsx` loader response, once `currentUser` is available client-side).

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
