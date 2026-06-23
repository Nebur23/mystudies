import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
  ssr: {
    noExternal: ["posthog-js", "@posthog/react"],
  },
  server: {
    proxy: {
      "/ingest/static": {
        target: "https://us-assets.i.posthog.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ingest/, ""),
      },
      "/ingest/array": {
        target: "https://us-assets.i.posthog.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ingest/, ""),
      },
      "/ingest": {
        target: env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ingest/, ""),
      },
    },
  },
  plugins: [tailwindcss(), reactRouter(),
      VitePWA({
      // ── Registration strategy ────────────────────────────────────────────
      // "autoUpdate": new SW installs in background, activates on next visit.
      // Use "prompt" instead if you want a "New version available" banner.
      registerType: "autoUpdate",

      // ── Dev mode ─────────────────────────────────────────────────────────
      // Enables service worker in development so you can test offline behaviour
      // with `bun dev`. Check Network tab → Service Workers in DevTools.
      devOptions: {
        enabled:   true,
        type:      "module",       // required for Vite dev server
        navigateFallback: "/",
      },

      // ── Web App Manifest ─────────────────────────────────────────────────
      manifest: {
        name:             "MyStudies",
        short_name:       "MyStudies",
        description:      "GCE Study Platform — Past Papers, Courses & More",
        theme_color:      "#7c3aed",
        background_color: "#ffffff",
        display:          "standalone",
        display_override: ["window-controls-overlay", "standalone", "browser"],
        orientation:      "portrait-primary",
        start_url:        "/?source=pwa",
        scope:            "/",
        lang:             "en",
        dir:              "ltr",

         icons: [
        {
          src: 'pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],

        // App shortcuts — appear on long-press of home screen icon
        shortcuts: [
          {
            name:        "Library",
            short_name:  "Library",
            description: "Browse past papers and textbooks",
            url:         "/library?source=shortcut",
            icons:       [{ src: "pwa-64x64.png", sizes: "64x64" }],
          },
          {
            name:        "Practice",
            short_name:  "Practice",
            description: "Take a practice quiz",
            url:         "/practice?source=shortcut",
            icons:       [{ src: "pwa-64x64.png", sizes: "64x64" }],
          },
          {
            name:        "Leaderboard",
            short_name:  "Scores",
            description: "See top students",
            url:         "/leaderboard?source=shortcut",
            icons:        [{ src: "pwa-64x64.png", sizes: "64x64" }],
          },
        ],

        // Categories for app stores
        categories: ["education", "productivity"],

        // Protocol handler — mystudies://share opens the app (advanced)
        // protocol_handlers: [{ protocol: "web+mystudies", url: "/share?url=%s" }],
      },

      // ── Workbox config (service worker caching) ──────────────────────────
      workbox: {
        // Where to find compiled app files to precache
        globDirectory:  "build/client",
        globPatterns:   ["**/*.{js,css,html,ico,png,svg,woff2}"],

        // Skip old SW waiting — activate immediately on update
        skipWaiting:   true,
        clientsClaim:  true,

        // Offline fallback for navigation requests
        navigateFallback:          "/offline",
        navigateFallbackDenylist:  [
          /^\/api\//,       // never cache API routes offline
          /^\/admin\//,     // never cache admin routes offline
          /^\/uploadthing/, // never cache upload endpoints
        ],

        // ── Runtime caching strategies ────────────────────────────────────
        runtimeCaching: [

          // 1. App shell JS/CSS — CacheFirst (hashed filenames = safe forever)
          {
            urlPattern: /\/_build\/.+\.(js|css)$/,
            handler:    "CacheFirst",
            options: {
              cacheName:  "app-shell",
              expiration: {
                maxEntries:    60,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },

          // 2. Google Fonts — StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler:    "StaleWhileRevalidate",
            options: {
              cacheName:  "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },

          // 3. UploadThing images (thumbnails) — CacheFirst, 30 days
          //    These are content-addressed so they never change
          {
            urlPattern: /https:\/\/.*\.ufs\.sh\/f\/.+\.(jpg|jpeg|png|webp|svg)/i,
            handler:    "CacheFirst",
            options: {
              cacheName:  "uploadthing-images",
              expiration: {
                maxEntries:    150,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              // Allow cross-origin caching
              fetchOptions: { credentials: "omit" },
            },
          },

          // 4. UploadThing PDFs (via proxy route) — CacheFirst
          //    Proxy URL: /api/library/proxy/<key>
          //    Heavy files — cache once, serve forever
          {
            urlPattern: /\/api\/library\/proxy\/.+/,
            handler:    "CacheFirst",
            options: {
              cacheName:  "library-pdfs",
              expiration: {
                maxEntries:    30,   // ~30 PDFs max in cache
                maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
              },
              // Required for Range request support (PDF.js page seeking)
              rangeRequests: true,
            },
          },

          // 5. Library listing page — StaleWhileRevalidate, 10 min
          {
            urlPattern: /\/library(\?.*)?$/,
            handler:    "StaleWhileRevalidate",
            options: {
              cacheName:  "page-library",
              expiration: { maxEntries: 5, maxAgeSeconds: 10 * 60 },
            },
          },

          // 6. Library detail pages — StaleWhileRevalidate, 5 min
          {
            urlPattern: /\/library\/.+/,
            handler:    "StaleWhileRevalidate",
            options: {
              cacheName:  "page-library-detail",
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
            },
          },

          // 7. Courses pages — StaleWhileRevalidate, 1 hour
          {
            urlPattern: /\/courses(\/.*)?(\?.*)?$/,
            handler:    "StaleWhileRevalidate",
            options: {
              cacheName:  "page-courses",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 },
            },
          },

          // 8. Practice (static JSON) — CacheFirst, 1 day
          {
            urlPattern: /\/data\/questions\/.+\.json$/,
            handler:    "CacheFirst",
            options: {
              cacheName:  "practice-questions",
              expiration: {
                maxEntries:    200,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },

          // 9. API endpoints — NetworkFirst, 5s timeout, fallback to cache
          {
            urlPattern: /\/api\/.*/,
            handler:    "NetworkFirst",
            options: {
              cacheName:            "api-responses",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
            },
          },

          // 10. Feed — NetworkOnly (real-time, never stale)
          {
            urlPattern: /\/feed(\?.*)?$/,
            handler:    "NetworkOnly",
          },
        ],
      },
    }),


  ],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    // ✅ prevents Vite from trying to pre-bundle the worker
    exclude: ["pdfjs-dist"],
  },
  worker: {
    format: "es",
  },
  };
});







