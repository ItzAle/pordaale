import { BrandMark } from "@/components/brand-mark"

export function CatalogSkeleton() {
  return (
    <section aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando catálogo</span>
      <div className="flex items-end justify-between gap-4">
        <BrandMark />
        <div className="mb-1 h-4 w-28 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="mt-6 h-12 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]" />
      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-white/6 px-4 py-4 last:border-b-0"
          >
            <div className="size-10 animate-pulse rounded-full bg-white/8" />
            <div className="h-4 flex-1 animate-pulse rounded-full bg-white/8" />
            <div className="hidden h-5 w-16 animate-pulse rounded-full bg-white/8 sm:block" />
            <div className="hidden h-5 w-10 animate-pulse rounded-full bg-white/8 sm:block" />
          </div>
        ))}
      </div>
    </section>
  )
}
