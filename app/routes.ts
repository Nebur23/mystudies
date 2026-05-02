import { type RouteConfig, index,layout,route } from "@react-router/dev/routes";

export default [
    route("api/auth/*", "routes/api.auth.$.ts"),
    route("api/quiz/submit", "routes/api.quiz.submit.ts"),

    layout("routes/appLayout.tsx", [
    index("routes/home.tsx"),
    route("courses", "routes/courses.tsx"),
    route("practice", "routes/pratice.tsx"),
    route("myprofile", "routes/myprofile.tsx"),
    route("leaderboard", "routes/leaderboard.tsx"),
    route("sign-in", "routes/signin.tsx"),
    route("sign-up", "routes/signup.tsx"),
  ]),

] satisfies RouteConfig;
