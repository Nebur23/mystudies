import { Menu } from "lucide-react";
import {
  Link,
  NavLink,
  useRouteLoaderData,
} from "react-router";

import LOGO from "~/assets/logo_icon.svg";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

import { cn } from "~/lib/utils";

import { UserAvatar } from "./user-avatar";
import Logo from "./logo";
import { NotificationCenter } from "./notifications/NotificationCenter";
import { useSession } from "~/lib/auth-client";

interface MenuItem {
  title: string;
  url: string;
}

interface Navbar1Props {
  className?: string;
  unreadCount: number;
  currentUser: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
    role: string | null | undefined;
} | undefined; // Replace with your User type

  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };

  menu?: MenuItem[];

  auth?: {
    login: {
      title: string;
      url: string;
    };
    signup: {
      title: string;
      url: string;
    };
  };
}

const Navbar1 = ({
  className,
  unreadCount,
  currentUser,

  logo = {
    url: "/",
    src: LOGO,
    alt: "logo",
    title: "MyStudies",
  },

  menu = [
    { title: "Home", url: "/" },
    { title: "Practice", url: "/practice" },
    { title: "Courses", url: "/courses" },
    { title: "Leaderboard", url: "/leaderboard" },
    { title: "Find Students", url: "/discover" },
    { title: "Posts", url: "/feed" },
    { title: "Library", url: "/library" },
  ],

  auth = {
    login: {
      title: "Login",
      url: "/sign-in",
    },
    signup: {
      title: "Sign up",
      url: "/sign-up",
    },
  },
}: Navbar1Props) => {
const session = useSession();

const user = currentUser || session.data?.user;

  return (
    <section className={cn("py-4 border-b bg-background", className)}>
      <div className="container">
        {/* Desktop */}
        <nav className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link
              to={logo.url}
              className="flex items-center gap-2"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="max-h-8 dark:invert"
              />

              <span className="text-lg font-semibold tracking-tight">
                {logo.title}
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              {menu.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url === "/"}
                  className={({ isActive }) =>
                    cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )
                  }
                >
                  {item.title}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right Side */}
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationCenter
                initialUnreadCount={unreadCount}
              />

              <UserAvatar />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <Link to={auth.login.url}>
                  {auth.login.title}
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
              >
                <Link to={auth.signup.url}>
                  {auth.signup.title}
                </Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile */}
        <div className="flex items-center justify-between lg:hidden">
          <Logo logo={logo} />

          <div className="flex items-center gap-2">
            {user && (
              <>
                <NotificationCenter
                  initialUnreadCount={unreadCount}
                />

                <UserAvatar />
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>
                    <Logo logo={logo} />
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-2 mt-8">
                  {menu.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end={item.url === "/"}
                      prefetch="viewport"
                      className={({ isActive }) =>
                        cn(
                          "px-4 py-3 rounded-lg text-black font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-black"
                        )
                      }
                    >
                      {item.title}
                    </NavLink>
                  ))}

                  {!user && (
                    <div className="flex flex-col gap-3 mt-6">
                      <Button
                        asChild
                        variant="outline"
                      >
                        <Link to={auth.login.url}>
                          {auth.login.title}
                        </Link>
                      </Button>

                      <Button asChild>
                        <Link to={auth.signup.url}>
                          {auth.signup.title}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Navbar1 };