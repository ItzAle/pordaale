import Image from "next/image"

import { site } from "@/lib/site"

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={site.image}
        alt=""
        width={128}
        height={128}
        fetchPriority="high"
        className="size-14 rounded-2xl object-cover ring-1 ring-white/10 sm:size-16"
      />
      <div>
        <p className="text-[11px] font-medium tracking-[0.22em] text-emerald-300/80 uppercase">
          {site.eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {site.name}
        </h1>
      </div>
    </div>
  )
}
