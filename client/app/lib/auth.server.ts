import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db"; // your drizzle instance
import * as schema from "~/db/schema"; // your drizzle schema
import { sendEmail } from "./sendEmail";
import { redirect } from "react-router";

const baseURL = process.env.BETTER_AUTH_URL?.trim();
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL must be configured for Better Auth.");
}

const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

if (trustedOrigins.length === 0) {
  throw new Error("TRUSTED_ORIGINS must contain at least one origin.");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: schema,
  }),
  trustedOrigins,
  baseURL,
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      try {
        void sendEmail({
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

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export { requireAuth } from "./auth-client";

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
