import * as React from "react"

import { NavDocuments } from "~/components/nav-documents"
import { NavMain } from "~/components/nav-main"
import { NavSecondary } from "~/components/nav-secondary"
import { NavUser } from "~/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon, Menu01Icon, ChartHistogramIcon, Folder01Icon, UserGroupIcon, Camera01Icon, File01Icon, Settings05Icon, HelpCircleIcon, SearchIcon, Database01Icon, Analytics01Icon, CommandIcon, Note01FreeIcons, Note01Icon, Video01FreeIcons } from "@hugeicons/core-free-icons"
import Logo from "./logo"
import type { CurrentUser } from "~/types"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "students",
      icon: (
        <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Courses",
      url: "courses",
      icon: (
        <HugeiconsIcon icon={Video01FreeIcons} strokeWidth={2} />
      ),
    },
    {
      title: "Practice",
      url: "practice",
      icon: (
        <HugeiconsIcon icon={Note01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Library",
      url: "library",
      icon: (
        <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />
      ),
    },
    // {
    //   title: "Analytics",
    //   url: "#",
    //   icon: (
    //     <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />
    //   ),
    // },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: (
        <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: (
        <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: (
        <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Get Help",
      url: "#",
      icon: (
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
      ),
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: (
        <HugeiconsIcon icon={Database01Icon} strokeWidth={2} />
      ),
    },
    {
      name: "Reports",
      url: "#",
      icon: (
        <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} />
      ),
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: (
        <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
      ),
    },
  ],
}



export function AppSidebar({currentUser, path, ...props }: React.ComponentProps<typeof Sidebar> & {currentUser: CurrentUser, path: string}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Logo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain path={path} items={data.navMain} />
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.image === "" || currentUser.image === null ? "https://www.gravatar.com/avatar?d=mp&f=y" : currentUser.image as string,
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}
