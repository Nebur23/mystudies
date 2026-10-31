import { Button } from "~/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignCircleIcon, Mail01Icon } from "@hugeicons/core-free-icons"
import { Link } from "react-router"

export function NavMain({
  items,
  path,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
  path: string
}) {
   console.log("NavMain path:", path);
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu> */}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem
              key={item.title}
              className={
                path === `/${item.url}` || path.startsWith(`/${item.url}/`)
                  ? "bg-primary text-white"
                  : ""
              }
            >
              <Link to={item.url}>

                <SidebarMenuButton tooltip={item.title}>
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>

            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
