"use client"

import { site } from "@/lib/site"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6">
      <p className="text-sm font-medium text-violet-200">{site.name}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
        No se pudo mostrar el catálogo
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Ha ocurrido un error inesperado. Si acabas de cambiar{" "}
        <span className="font-mono text-zinc-300">.env.local</span>, reinicia el
        servidor y vuelve a intentarlo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-11 w-fit rounded-full bg-white px-5 text-sm font-medium text-zinc-950"
      >
        Reintentar
      </button>
    </main>
  )
}
