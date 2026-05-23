import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { listTemplatesGlobal } from "@/lib/templates/list-templates-global";
import { TemplateGallery } from "@/components/home/template-gallery";

export default async function Home() {
  const supabase = createServiceClient();

  let templates = null;
  let errorMessage: string | null = null;

  try {
    templates = await listTemplatesGlobal(supabase);
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Error de conexión con Supabase";
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-mono dark:bg-zinc-950">
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Bannerly
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Generación de imágenes dinámicas vía API. Diseña una plantilla una
          vez, renderiza miles de variantes a escala.
        </p>
        <Link
          href="/dashboard/templates"
          className="mt-8 inline-block rounded bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Ver mis plantillas →
        </Link>
      </section>

      {/* Gallery */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Plantillas disponibles
        </h2>

        {errorMessage ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            <p className="font-semibold">Error de conexión</p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </div>
        ) : templates && templates.length > 0 ? (
          <TemplateGallery templates={templates} />
        ) : (
          <p className="text-sm text-zinc-500">
            Aún no hay plantillas disponibles.{" "}
            <Link
              href="/dashboard/templates"
              className="underline hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Crea la primera
            </Link>
            .
          </p>
        )}
      </main>
    </div>
  );
}
