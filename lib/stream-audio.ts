const FILE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,200}$/
const ALLOW_TTL_MS = 10 * 60 * 1000

const allowedUntil = new Map<string, number>()

const EXT_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  wave: "audio/wav",
  flac: "audio/flac",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  aif: "audio/aiff",
  aiff: "audio/aiff",
}

type DriveMeta = {
  mimeType?: string
  parents?: string[]
  trashed?: boolean
  error?: { message?: string }
}

function readConfig() {
  const apiKey = process.env.GOOGLE_API_KEY?.trim() ?? ""
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ?? ""
  return { apiKey, folderId }
}

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  )
}

function readFilename(request: Request) {
  const raw = new URL(request.url).searchParams.get("filename") ?? ""
  const cleaned = raw.replace(/[\r\n"/\\]/g, "").trim().slice(0, 180)
  return cleaned || null
}

function contentTypeFor(upstream: string | null, filename: string | null) {
  if (upstream?.startsWith("audio/")) return upstream
  const ext = filename?.split(".").pop()?.toLowerCase() ?? ""
  return EXT_TYPES[ext] ?? "application/octet-stream"
}

function contentDisposition(filename: string) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_")
  const encoded = encodeURIComponent(filename)
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`
}

async function assertCatalogFile(id: string, apiKey: string, folderId: string) {
  const freshUntil = allowedUntil.get(id) ?? 0
  if (freshUntil > Date.now()) return null

  const url = new URL(`https://www.googleapis.com/drive/v3/files/${id}`)
  url.searchParams.set("fields", "mimeType,parents,trashed")
  url.searchParams.set("key", apiKey)

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    return jsonError("No se pudo abrir este beat en Google Drive.", response.status)
  }

  const meta = (await response.json()) as DriveMeta
  const mimeType = meta.mimeType ?? ""
  const parents = meta.parents ?? []
  // Una API key puede listar la carpeta, pero files.get no devuelve `parents`.
  // Si el campo viene vacío no hay forma de comprobar la carpeta; el audio sí se puede bajar.
  const inFolder = parents.length === 0 || parents.includes(folderId)
  const allowed = !meta.trashed && mimeType.includes("audio/") && inFolder

  if (!allowed) {
    return jsonError("Este audio no está en el catálogo.", 404)
  }

  if (allowedUntil.size > 500) allowedUntil.clear()
  allowedUntil.set(id, Date.now() + ALLOW_TTL_MS)
  return null
}

function clientUserAgent(request: Request) {
  const incoming = request.headers.get("user-agent")?.replace(/[\r\n]/g, "").trim() ?? ""
  if (incoming.length >= 8 && incoming.length <= 400) return incoming
  return "Mozilla/5.0"
}

export async function proxyDriveAudio(request: Request, id: string) {
  if (!FILE_ID_PATTERN.test(id)) {
    return jsonError("El identificador del archivo no es válido.", 400)
  }

  const { apiKey, folderId } = readConfig()
  if (!apiKey || !folderId) {
    return jsonError(
      "Faltan GOOGLE_API_KEY o GOOGLE_DRIVE_FOLDER_ID en .env.local. Reinicia el servidor después de guardarlas.",
      503,
    )
  }

  const denied = await assertCatalogFile(id, apiKey, folderId)
  if (denied) return denied

  const filename = readFilename(request)
  const download = new URL(request.url).searchParams.get("download") === "1"
  const range = request.headers.get("range")?.replace(/[\r\n]/g, "") ?? ""

  const upstreamHeaders = new Headers()
  upstreamHeaders.set("User-Agent", clientUserAgent(request))
  if (/^bytes=/i.test(range) && range.length < 80) {
    upstreamHeaders.set("Range", range)
  }

  // alt=media con API key acaba en un 403 de "consultas automáticas".
  // El enlace público de descarga sí admite Range.
  const mediaUrl = new URL("https://drive.usercontent.google.com/download")
  mediaUrl.searchParams.set("id", id)
  mediaUrl.searchParams.set("export", "download")
  mediaUrl.searchParams.set("confirm", "t")

  const upstream = await fetch(mediaUrl, {
    headers: upstreamHeaders,
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  })

  const upstreamType = upstream.headers.get("content-type") ?? ""
  if ((!upstream.ok && upstream.status !== 206) || upstreamType.includes("text/html")) {
    await upstream.body?.cancel()
    return jsonError("No se pudo reproducir el audio desde Google Drive.", 502)
  }

  if (!upstream.body) {
    return jsonError("Google Drive no devolvió audio.", 502)
  }

  const headers = new Headers()
  headers.set(
    "Content-Type",
    contentTypeFor(upstream.headers.get("content-type"), filename),
  )
  headers.set("Accept-Ranges", "bytes")
  headers.set("Vary", "Range")
  headers.set("Cache-Control", "private, max-age=3600")

  const encoding = upstream.headers.get("content-encoding")
  const length = upstream.headers.get("content-length")
  if (!encoding && length) headers.set("Content-Length", length)

  const contentRange = upstream.headers.get("content-range")
  if (contentRange) headers.set("Content-Range", contentRange)

  if (download && filename) {
    headers.set("Content-Disposition", contentDisposition(filename))
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}
