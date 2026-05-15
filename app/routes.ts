import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("api/quiz/submit", "routes/api.quiz.submit.ts"),
  route("api/uploadthing", "routes/api.uploadthing.ts"),
  route("api/profile/:username", "routes/api.profile.$username.ts"),
  route("/api/profile/update", "routes/api.profile.update.ts"),
  route("/api/connections/action", "routes/api.connections.action.ts"),
  route("/api/connections/mutual/:username", "routes/api.connections.mutual.$username.ts"),
  route("/api/connections/status/:username", "routes/api.connections.status.$username.ts"),
  route("api/feed/stream", "routes/api.feed.stream.ts"),
  route("api/feed/create", "routes/api.feed.create.ts"),
  route("api/feed/engagement", "routes/api.feed.engagement.ts"),
  route("api/admin/reports", "routes/api.admin.reports.action.ts"),
  route("api/reports", "routes/api.report.ts"),
  route("api/notifications/stream", "routes/api.notifications.stream.ts"),
  route("api/notifications/index", "routes/api.notifications.index.ts"),
  route("api/courses/progress", "routes/api.courses.progress.ts"),

  layout("routes/appLayout.tsx", [
    index("routes/home/home.tsx"),

    route("onboarding/profile", "routes/profile/onboarding.profile.tsx"),
    route("courses", "routes/courses/courses.tsx"),
    route("courses/:slug", "routes/courses/courses.$slug.tsx"),
    route("practice", "routes/practice/practice.tsx"),
    route("profile/:username", "routes/profile/profile.username.tsx"),
    route("leaderboard", "routes/leaderboard.tsx"),
    route("practice/:paperId", "routes/practice/practice.$paperId.tsx"),
    route("discover", "routes/profile/discover.tsx"),
    route("connections", "routes/connections.tsx"),
    route("feed", "routes/feed.tsx"),
    route("sign-in", "routes/auth/signin.tsx"),
    route("sign-up", "routes/auth/signup.tsx"),

    route("admin/reports", "routes/admin.reports.tsx"),

    // layout("routes/profile/ProfileLayout.tsx", [
    route("profile/me", "routes/profile/profile.tsx"),
    route("profile/settings", "routes/profile/settings.tsx")
    // ])
  ]),

] satisfies RouteConfig;
