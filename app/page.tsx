import { Suspense } from "react"
import { connection } from "next/server"

import { BeatCatalog } from "@/components/beat-catalog"
import { CatalogError } from "@/components/catalog-error"
import { CatalogSkeleton } from "@/components/catalog-skeleton"
import { SetupNotice } from "@/components/setup-notice"
import { StudioShell } from "@/components/studio-shell"
import { getCatalog } from "@/lib/drive"

export default function Page() {
  return (
    <StudioShell>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogSection />
      </Suspense>
    </StudioShell>
  )
}

async function CatalogSection() {
  await connection()
  const catalog = await getCatalog()

  if (!catalog.ok && catalog.reason === "unconfigured") {
    return <SetupNotice />
  }

  if (!catalog.ok) {
    return <CatalogError message={catalog.message} />
  }

  return <BeatCatalog beats={catalog.beats} />
}
