import { type RouteConfig, index,layout,route } from "@react-router/dev/routes";

export default [
    route("api/auth/*", "routes/api.auth.$.ts"),
    route("api/quiz/submit", "routes/api.quiz.submit.ts"),
    route("api/uploadthing", "routes/api.uploadthing.ts"),
    route("api/profile/:username", "routes/api.profile.$username.ts"),
    route("/api/profile/update", "routes/api.profile.update.ts"),


    layout("routes/appLayout.tsx", [
    index("routes/home/home.tsx"),

    route("onboarding/profile", "routes/profile/onboarding.profile.tsx"),
    route("courses", "routes/courses.tsx"),
    route("practice", "routes/practice/practice.tsx"),
    route("myprofile", "routes/profile/myprofile.tsx"),
    route("profile/:username", "routes/profile/profile.username.tsx"),
    route("leaderboard", "routes/leaderboard.tsx"),
     route("practice/:paperId", "routes/practice/practice.$paperId.tsx"),
    route("sign-in", "routes/auth/signin.tsx"),
    route("sign-up", "routes/auth/signup.tsx"),

    // layout("routes/profile/ProfileLayout.tsx", [
      route("profile/me", "routes/profile/profile.tsx"),
      route("profile/settings", "routes/profile/settings.tsx")
    // ])
  ]),

] satisfies RouteConfig;
