export function beatStreamPath(
  beat: { id: string; filename: string },
  download = false,
) {
  const params = new URLSearchParams({ filename: beat.filename })
  if (download) params.set("download", "1")
  return `/api/stream/${encodeURIComponent(beat.id)}?${params.toString()}`
}

export function beatShareHash(id: string) {
  return `#${encodeURIComponent(id)}`
}
