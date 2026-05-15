import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db"; // your drizzle instance
import * as schema from "~/db/schema"; // your drizzle schema
import { sendEmail } from "./sendEmail";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: schema,
  }),
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