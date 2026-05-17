import { Outlet, redirect } from "react-router";
import { Navbar1 } from "~/components/navbar1";
import { db } from "~/db";
import { userNotification } from "../db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { Route } from "./+types/appLayout";
import { useLoaderData } from "react-router";
import { getSessionSafe } from "~/lib/auth";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSessionSafe(request);

  if (!session?.user) {
    return { unreadCount : 0 }
    //    throw redirect(`/sign-in?redirect=${new URL(request.url).pathname}`);
  }

  const [{ unreadCount }] = await db
    .select({ unreadCount: sql<number>`COUNT(*)::int` })
    .from(userNotification)
    .where(and(
      eq(userNotification.userId, session?.user.id as string),
      eq(userNotification.read, false),
    ));

  return { unreadCount, currentUser: session?.user };
}

export default function AppLayout() {
  const { unreadCount, currentUser } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className=" border-b-2 border-muted/50 px-4">
        <Navbar1 unreadCount={unreadCount} currentUser={currentUser} />
      </div>
      <Outlet />
    </div>
  );
}
