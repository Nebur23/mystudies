import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { Link, NavLink, useNavigation, useLocation } from "react-router";

import LOGO from "~/assets/logo_icon.svg";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { UserAvatar } from "./user-avatar";
import Logo from "./logo";
import { NotificationCenter } from "./notifications/NotificationCenter";
import { useSession } from "~/lib/auth-client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MenuItem { title: string; url: string; }

interface Navbar1Props {
  className?:   string;
  unreadCount:  number;
  currentUser?: {
    id: string; createdAt: Date; updatedAt: Date;
    email: string; emailVerified: boolean; name: string;
    image?: string | null; role?: string | null;
  };
  logo?: { url: string; src: string; alt: string; title: string };
  menu?: MenuItem[];
  auth?: {
    login:  { title: string; url: string };
    signup: { title: string; url: string };
  };
}

const DEFAULT_MENU: MenuItem[] = [
  { title: "Home",        url: "/"            },
  { title: "Practice",   url: "/practice"    },
  { title: "Courses",    url: "/courses"     },
  { title: "Leaderboard",url: "/leaderboard" },
  { title: "Discover",   url: "/discover"    },
  { title: "Feed",       url: "/feed"        },
  { title: "Library",    url: "/library"     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isMatch(url: string, pathname: string): boolean {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(url + "/");
}

function useLinkState(url: string) {
  const location   = useLocation();
  const navigation = useNavigation();
  const pending    = navigation.location?.pathname;

  const isActive  = pending ? isMatch(url, pending)   : isMatch(url, location.pathname);
  const isPending = !!pending && isMatch(url, pending) && !isMatch(url, location.pathname);

  return { isActive, isPending };
}

function navClass(isActive: boolean, extra = ""): string {
  return cn(
    "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium",
    "transition-all duration-150 select-none outline-none",
    isActive
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
    extra
  );
}

// ── Desktop nav item ──────────────────────────────────────────────────────────
function DesktopNavItem({ item }: { item: MenuItem }) {
  const { isActive, isPending } = useLinkState(item.url);

  return (
    <NavLink
      to={item.url}
      end={item.url === "/"}
      prefetch="intent"
      viewTransition
      className={navClass(isActive)}
      onClick={e => { if (isActive && !isPending) e.preventDefault(); }}
      aria-current={isActive ? "page" : undefined}
    >
      {item.title}
      {isPending && (
        <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary/50 animate-pulse" />
      )}
    </NavLink>
  );
}

// ── Mobile nav item ───────────────────────────────────────────────────────────
function MobileNavItem({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { isActive, isPending } = useLinkState(item.url);

  return (
    <NavLink
      to={item.url}
      end={item.url === "/"}
      prefetch="intent"
      viewTransition
      className={navClass(isActive, "w-full py-3 px-4 rounded-xl")}
      onClick={e => {
        if (isActive && !isPending) { e.preventDefault(); return; }
        onClose();
      }}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="flex-1">{item.title}</span>
      {isPending && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping shrink-0" />
      )}
    </NavLink>
  );
}

// ── Mobile drawer — portaled to document.body ─────────────────────────────────
function MobileDrawer({
  open,
  onClose,
  logo,
  menu,
  auth,
  user,
}: {
  open:    boolean;
  onClose: () => void;
  logo:    NonNullable<Navbar1Props["logo"]>;
  menu:    MenuItem[];
  auth:    NonNullable<Navbar1Props["auth"]>;
  user:    unknown;
}) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  // ✅ Portal — renders directly into document.body, completely outside the
  // navbar's stacking context and container width constraints
  return createPortal(
    <div className="fixed inset-0 z-[999] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel — slides in from right */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex flex-col",
          "w-72 max-w-[85vw] bg-background shadow-2xl",
          "animate-in slide-in-from-right duration-300 ease-out",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <Logo logo={logo} />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menu.map(item => (
            <MobileNavItem key={item.url} item={item} onClose={onClose} />
          ))}
        </nav>

        {/* Auth buttons — only when logged out */}
        {!user && (
          <div className="px-4 py-5 border-t space-y-2 shrink-0">
            <Button asChild variant="outline" className="w-full">
              <Link to={auth.login.url} onClick={onClose}>
                {auth.login.title}
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link to={auth.signup.url} onClick={onClose}>
                {auth.signup.title}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body   // ✅ renders outside the navbar entirely
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const Navbar1 = ({
  className,
  unreadCount,
  currentUser,
  logo   = { url: "/", src: LOGO, alt: "logo", title: "MyStudies" },
  menu   = DEFAULT_MENU,
  auth   = {
    login:  { title: "Login",   url: "/sign-in" },
    signup: { title: "Sign up", url: "/sign-up" },
  },
}: Navbar1Props) => {
  const session    = useSession();
  const user       = currentUser ?? session.data?.user;
  const [open, setOpen] = useState(false);

  return (
    <>
      <section
        className={cn(
          "py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40",
          className
        )}
      >
        <div className="container">

          {/* ── Desktop ──────────────────────────────────────────────────── */}
          <nav className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to={logo.url} className="flex items-center gap-2 shrink-0">
                <img src={logo.src} alt={logo.alt} className="h-7 dark:invert" />
                <span className="text-base font-bold tracking-tight">{logo.title}</span>
              </Link>

              <div className="flex items-center gap-0.5">
                {menu.map(item => <DesktopNavItem key={item.url} item={item} />)}
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <NotificationCenter initialUnreadCount={unreadCount} />
                <UserAvatar />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={auth.login.url}>{auth.login.title}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to={auth.signup.url}>{auth.signup.title}</Link>
                </Button>
              </div>
            )}
          </nav>

          {/* ── Mobile topbar ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between lg:hidden">
            <Logo logo={logo} />

            <div className="flex items-center gap-2">
              {user && (
                <>
                  <NotificationCenter initialUnreadCount={unreadCount} />
                  <UserAvatar />
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={open}
              >
                <Menu className="size-4" />
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* ✅ Drawer lives outside <section> via portal — no clipping issues */}
      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        logo={logo}
        menu={menu}
        auth={auth}
        user={user}
      />
    </>
  );
};

export { Navbar1 };