import { lazy, Suspense } from "react";
import { useLoaderData, Link } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Route } from "../+types/library.$slug";
import { db } from "~/db";
import { resource, resourceCategory } from "~/db/schema/library";
import { requireAuth } from "~/lib/auth";
import { eq, and } from "drizzle-orm";

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
    <div className="min-h-screen pb-28" style={{ background: "linear-gradient(160deg, #fafaf8 0%, #f5f3ee 100%)" }}>
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={`/library/${resource.slug}`} className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900">
            <ArrowLeft size={16} /> Back to info
          </Link>
          <h1 className="text-base font-semibold text-stone-900">Read PDF: {resource.title}</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center">
            <Loader2 size={28} className="animate-spin text-stone-400 mx-auto" />
            <p className="mt-4 text-sm text-stone-500">Loading PDF reader…</p>
          </div>
        }>
          <PdfReader fileUrl={resource.fileUrl} title={resource.title} />
        </Suspense>
      </main>
    </div>
  );
}
