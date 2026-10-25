import type { NextRequest } from "next/server"

import { getCatalog } from "@/lib/drive"

export async function GET(request: NextRequest) {
  // Tocar la request evita prerenderizar un catálogo vacío en el build.
  void request.headers.get("accept")

  const catalog = await getCatalog()

  if (!catalog.ok) {
    return Response.json(catalog, {
      status: catalog.reason === "unconfigured" ? 200 : 502,
      headers: { "Cache-Control": "no-store" },
    })
  }

  return Response.json(catalog, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60",
    },
  })
}
