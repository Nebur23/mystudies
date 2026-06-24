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
  trustedOrigins: [
    "http://localhost:5173",
    "http://192.168.1.71:5173",
    "http://10.63.144.204:5173",
    "https://mystudies-production.up.railway.app",
  ],
  baseURL: {
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "192.168.1.71",
      "10.63.144.204",
      "mystudies-production.up.railway.app",
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
    sendResetPassword: async ({ user, url, token }, request) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          url,
          type: "reset-password"
        });
      } catch (error) {
        console.error("Password reset email failed", error);
        throw error;
      }
    },
    onPasswordReset: async ({ user }, request) => {
      // your logic here
      console.log(`Password for user ${user.email} has been reset.`);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your email address",
          url,
        });
      } catch (error) {
        console.error("Verification email failed", error);
        throw error;
      }
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
