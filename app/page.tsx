import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workshop_test").select("*").limit(10);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 font-mono">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">
        Bannerly — Supabase Hello World
      </h1>

      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <p className="font-semibold">Error de conexión</p>
          <p className="mt-1 text-sm">{error.message}</p>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm text-zinc-500">
            Tabla <code className="font-bold text-zinc-800 dark:text-zinc-200">workshop_test</code> — {data?.length ?? 0} registro(s)
          </p>
          <pre className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800 overflow-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
