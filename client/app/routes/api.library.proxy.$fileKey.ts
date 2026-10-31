import type { Route } from "./+types/api.library.proxy.$fileKey";
import { requireAuth } from "~/lib/auth";

// Streams the UploadThing file through your server with:
//   - Auth check (user must be logged in)
//   - Aggressive cache headers (CDN + browser)
//   - Range request support (lets browsers seek inside large PDFs)
export async function loader({ params, request }: Route.LoaderArgs) {
  await requireAuth(request);

  const { fileKey } = params;
  if (!fileKey) throw new Response("Missing fileKey", { status: 400 });

  //https://yu7tr24azt.ufs.sh/f/StMcjRNdv9k04ZiXnbdVCUm3tIvef6Bi0Qsw8D9lnoXPYa7y

  const upstreamUrl = `https://yu7tr24azt.ufs.sh/f/${fileKey}`;

  // Forward Range header so PDF.js can request individual pages
  const rangeHeader = request.headers.get("range");

  const upstream = await fetch(upstreamUrl, {
    headers: rangeHeader ? { range: rangeHeader } : {},
  });

  if (!upstream.ok && upstream.status !== 206) {
    throw new Response("File not found", { status: 404 });
  }

  const headers = new Headers();

  // ✅ Tell browsers + CDN to cache for 1 year (file key is content-addressed)
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("content-type",  upstream.headers.get("content-type")  ?? "application/pdf");
  headers.set("content-length",upstream.headers.get("content-length") ?? "");
  headers.set("accept-ranges", "bytes");

  // Forward partial content status for Range requests
  if (upstream.status === 206) {
    headers.set("content-range", upstream.headers.get("content-range") ?? "");
  }

  return new Response(upstream.body, {
    status:  upstream.status,
    headers,
  });
}