import type { NextRequest } from "next/server"

import { proxyDriveAudio } from "@/lib/stream-audio"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  return proxyDriveAudio(request, id)
}
