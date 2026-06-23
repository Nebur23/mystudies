import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db"; // your drizzle instance
import * as schema from "~/db/schema"; // your drizzle schema
import { sendEmail } from "./sendEmail";
import { redirect } from "react-router";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: schema,
  }),
  baseURL:{
		allowedHosts: [
			"192.168.1.71:5173",
      "mystudies-production.up.railway.app"
		],
		protocol: "auto",
		fallback: "http://localhost:5173",
	},
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student", // Default role for new users
        input: true // Set to false to prevent manual role selection during signup
      }
    }
  },
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      void sendEmail({
        to: user.email,
        subject: "Verify your email address",
        url
        //text: `Click the link to verify your email: ${url}`,
      });
    },
  },
});

export async function requireAuth(request: Request) {
  const session = await auth.api.getSession(request);
  if (!session?.user) {
    throw redirect(`/sign-in?redirect=${new URL(request.url).pathname}`);
  }
  return session;
}

export async function requireAdmin(request: Request) {
  const session = await auth.api.getSession(request);
  if (!session?.user) {
    throw redirect(`/sign-in?redirect=${new URL(request.url).pathname}`);
  }
  return session;
}

export async function getSessionSafe(request: Request) {
  try {
    return await auth.api.getSession(request);
  } catch {
    return null;
  }
}

export function isProfileOwner(profile: { userId: string }, session: any) {
  return session?.user?.id === profile.userId;
}
