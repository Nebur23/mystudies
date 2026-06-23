import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { usePostHog } from "@posthog/react";
import { posthogMiddleware } from "./lib/posthog-middleware";
import { Toaster } from "./components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { PwaInstallPrompt } from "./components/pwa/PwaInstallPrompt";

export const middleware: Route.MiddlewareFunction[] = [posthogMiddleware];



export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "apple-touch-icon", href: "apple-touch-icon-180x180.png" },
];



// ── Global progress bar — lives OUTSIDE Outlet, never interferes with rendering
function NProgress() {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const rafRef = useRef<number>(null);

  useEffect(() => {
    if (navigation.state !== "idle") {
      timerRef.current = setTimeout(() => {
        setVisible(true);
        setWidth(30);

        let w = 30;
        const crawl = () => {
          w = Math.min(w + (85 - w) * 0.05, 84);
          setWidth(w);
          rafRef.current = requestAnimationFrame(crawl);
        };
        rafRef.current = requestAnimationFrame(crawl);
      }, 120);
    } else {
      clearTimeout(timerRef.current ?? undefined);
      cancelAnimationFrame(rafRef.current!);

      if (visible) {
        setWidth(100);
        const t = setTimeout(() => {
          setVisible(false);
          setWidth(0);
        }, 300);
        return () => clearTimeout(t);
      }
    }

    return () => {
      clearTimeout(timerRef.current ?? undefined);
      cancelAnimationFrame(rafRef.current!);
    };
  }, [navigation.state, visible]); // ← add `visible` here

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-9999 h-0.5 pointer-events-none" aria-hidden>
      <div
        className="h-full bg-violet-500 transition-[width] ease-out"
        style={{
          width: `${width}%`,
          transitionDuration: width === 100 ? "200ms" : "400ms",
          boxShadow: "0 0 8px rgba(124,58,237,0.6)",
        }}
      />
    </div>
  );
}



export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyStudies" />
        <meta name="mobile-web-app-capable" content="yes" />
        <Meta />
        <Links />
      </head>
      <body>
        <NProgress />
        <Toaster richColors closeButton />
        {children}
        {/* <PwaInstallPrompt /> */}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const posthog = usePostHog();
  posthog.captureException(error);

  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
