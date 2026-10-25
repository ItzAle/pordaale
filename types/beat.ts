export type Beat = {
  id: string
  filename: string
  title: string
  bpm: string
  key: string
  mimeType: string
  createdTime: string
  size: number | null
}

export type CatalogResult =
  | { ok: true; beats: Beat[] }
  | { ok: false; reason: "unconfigured" }
  | { ok: false; reason: "error"; message: string }
