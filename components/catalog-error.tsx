import { BrandMark } from "@/components/brand-mark"

export function CatalogError({ message }: { message: string }) {
  return (
    <section>
      <BrandMark />
      <div className="mt-8 rounded-3xl border border-rose-400/20 bg-rose-400/5 p-6 sm:p-8">
        <p className="text-sm font-medium text-rose-200">No se pudo cargar el catálogo</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">{message}</p>
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          Revisa <span className="font-mono">.env.local</span>, que la carpeta sea
          pública y que la API key tenga permiso para Google Drive API. Recarga la
          página cuando lo corrijas.
        </p>
      </div>
    </section>
  )
}
