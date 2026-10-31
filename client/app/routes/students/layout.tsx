import { AppSidebar } from "~/components/app-sidebar"
import { SiteHeader } from "~/components/site-header"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { and, eq, sql } from "drizzle-orm";

import { Outlet, useLoaderData, useLocation, useParams } from "react-router"
import { db } from "~/db";
import { userNotification } from "~/db/schema";
import type { Route } from "./+types/layout";
import type { CurrentUser } from "~/types";
import { requireAuth } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  const [{ unreadCount }] = await db
    .select({ unreadCount: sql<number>`COUNT(*)::int` })
    .from(userNotification)
    .where(and(
      eq(userNotification.userId, session.user.id),
      eq(userNotification.read, false),
    ));

  return { unreadCount, currentUser: session.user };
}

export default function StudentLayout() {
  const { unreadCount, currentUser } = useLoaderData<typeof loader>();
const location = useLocation();


  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar path={location.pathname} currentUser={currentUser as CurrentUser}  variant="inset" />
      <SidebarInset>
        <SiteHeader path={location.pathname} />
        <div className="flex flex-1 flex-col">
           <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
