import { lazy, Suspense } from "react";
import { useLoaderData, Link } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { db } from "~/db";
import { resource, resourceCategory } from "~/db/schema/library";
import { requireAuth } from "~/lib/auth";
import { eq, and } from "drizzle-orm";
import type { Route } from "./+types/library.$slug.view";

const PdfReader = lazy(() => import("~/components/library/PdfReader"));

export async function loader({ params, request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  const res = await db
    .select({
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      fileType: resource.fileType,
      fileUrl: resource.fileUrl,
      isPublished: resource.isPublished,
      categorySlug: resourceCategory.slug,
    })
    .from(resource)
    .innerJoin(resourceCategory, eq(resource.categoryId, resourceCategory.id))
    .where(and(eq(resource.slug, params.slug), eq(resource.isPublished, true)))
    .limit(1);

  if (!res[0]) {
    throw new Response("Not found", { status: 404 });
  }

  const item = res[0];
  if (item.fileType !== "pdf") {
    throw new Response("PDF reader only available for PDF resources", { status: 400 });
  }

  return { resource: item };
}

export default function PdfReaderPage() {
  const { resource } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background pb-8 text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to={`/library/${resource.slug}`} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg pr-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <ArrowLeft size={16} /> Details
          </Link>
          <div className="min-w-0 border-l border-border pl-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">PDF reader</p>
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">{resource.title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Suspense fallback={
          <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
            <Loader2 size={28} className="mx-auto animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Loading PDF reader…</p>
          </div>
        }>
          <PdfReader fileUrl={resource.fileUrl} title={resource.title} />
        </Suspense>
      </main>
    </div>
  );
}
