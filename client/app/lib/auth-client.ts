import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
import { redirect } from "react-router";
import type { AuthSession } from "./auth.server";

export const authClient = createAuthClient({
    //you can pass client configuration here
    //baseURL: "http://localhost:5173" // Base URL of your app, can also be set via env variable
    //baseURL: "https://mystudies-production.up.railway.app"
    baseURL: process.env.BETTER_AUTH_URL,
    fetchOptions: { credentials: "include" },
})

export const { useSession, getSession, signIn, signOut, signUp, requestPasswordReset, resetPassword } = authClient; 

export async function requireAuth(request: Request): Promise<AuthSession> {
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const response = await authClient.getSession({
    fetchOptions: { headers },
  });

  if (response.error) {
    if (response.error.status === 401) {
      throw redirectToSignIn(request);
    }
    throw new Error(
      `Session verification failed with status ${response.error.status}.`,
    );
  }

  const session = response.data;
  if (!session) {
    throw redirectToSignIn(request);
  }

  const user = session.user as typeof session.user & { role?: unknown };
  if (typeof user.role !== "string") {
    throw new Error("Session verification returned a user without a role.");
  }

  return session as AuthSession;
}

function redirectToSignIn(request: Request) {
  const url = new URL(request.url);
  const redirectTo = `${url.pathname}${url.search}`;
  return redirect(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
}