// lib/auth.ts
import { redirect } from "react-router";
import { auth } from "./auth.server";

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