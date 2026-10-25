import { cacheLife } from "next/cache"

import { parseBeatFilename } from "@/lib/parse-beat"
import type { Beat, CatalogResult } from "@/types/beat"

const DRIVE_LIST = "https://www.googleapis.com/drive/v3/files"
const FOLDER_ID_PATTERN = /^[a-zA-Z0-9_-]{10,200}$/

type DriveFile = {
  id?: string
  name?: string
  mimeType?: string
  createdTime?: string
  size?: string
}

type DriveListPayload = {
  files?: DriveFile[]
  nextPageToken?: string
  error?: { message?: string }
}

class DriveRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DriveRequestError"
  }
}

function readConfig() {
  const apiKey = process.env.GOOGLE_API_KEY?.trim() ?? ""
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ?? ""
  return { apiKey, folderId }
}

function redact(message: string, apiKey: string) {
  const cleaned = message
    .split(apiKey)
    .join("***")
    .replace(/key=[^&\s]+/gi, "key=***")
    .replace(/\s+/g, " ")
    .trim()

  if (!cleaned || cleaned.length > 280) {
    return "No se pudo leer el catálogo de Google Drive."
  }

  return cleaned
}

function explainStatus(status: number, detail: string) {
  const suffix = detail ? ` (${detail})` : ""

  if (status === 400) {
    return `Google Drive rechazó la consulta. Revisa el ID de la carpeta y que la Drive API v3 esté activada.${suffix}`
  }

  if (status === 403) {
    return `Acceso denegado. Comparte la carpeta como «Cualquier persona con el enlace» y quita la restricción por referente HTTP de la API key: las peticiones salen del servidor.${suffix}`
  }

  if (status === 404) {
    return `No se encontró la carpeta. Revisa GOOGLE_DRIVE_FOLDER_ID.${suffix}`
  }

  return detail || `Google Drive respondió con el código ${status}.`
}

async function readGoogleMessage(response: Response, apiKey: string) {
  try {
    const payload = (await response.json()) as DriveListPayload
    const message = payload.error?.message?.trim() ?? ""
    if (!message || message.includes(apiKey) || /key=/i.test(message)) {
      return ""
    }
    return message.slice(0, 180)
  } catch {
    return ""
  }
}

function toBeat(file: DriveFile): Beat | null {
  if (!file.id || !file.name) return null
  if (file.mimeType && !file.mimeType.includes("audio/")) return null

  const parsed = parseBeatFilename(file.name)
  const size = file.size && /^\d+$/.test(file.size) ? Number(file.size) : null

  return {
    id: file.id,
    filename: file.name,
    title: parsed.title,
    bpm: parsed.bpm,
    key: parsed.key,
    mimeType: file.mimeType || "audio/mpeg",
    createdTime: file.createdTime || "",
    size,
  }
}

async function loadBeats(folderId: string): Promise<Beat[]> {
  "use cache"
  cacheLife({
    stale: 60,
    revalidate: 60,
    expire: 60 * 60,
  })

  const { apiKey } = readConfig()
  if (!apiKey) {
    throw new DriveRequestError("MISSING_API_KEY")
  }

  const beats: Beat[] = []
  let pageToken = ""

  for (let page = 0; page < 20; page += 1) {
    const url = new URL(DRIVE_LIST)
    url.searchParams.set(
      "q",
      `'${folderId}' in parents and (mimeType contains 'audio/') and trashed = false`,
    )
    url.searchParams.set("orderBy", "createdTime desc")
    url.searchParams.set(
      "fields",
      "nextPageToken,files(id, name, mimeType, createdTime, size)",
    )
    url.searchParams.set("pageSize", "100")
    url.searchParams.set("key", apiKey)
    if (pageToken) url.searchParams.set("pageToken", pageToken)

    const response = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(20_000),
    })

    if (!response.ok) {
      const detail = await readGoogleMessage(response, apiKey)
      throw new DriveRequestError(explainStatus(response.status, detail))
    }

    const payload = (await response.json()) as DriveListPayload
    for (const file of payload.files ?? []) {
      const beat = toBeat(file)
      if (beat) beats.push(beat)
    }

    if (!payload.nextPageToken) break
    pageToken = payload.nextPageToken
  }

  return beats
}

export async function getCatalog(): Promise<CatalogResult> {
  const { apiKey, folderId } = readConfig()

  if (!apiKey || !folderId) {
    return { ok: false, reason: "unconfigured" }
  }

  if (!FOLDER_ID_PATTERN.test(folderId)) {
    return {
      ok: false,
      reason: "error",
      message:
        "GOOGLE_DRIVE_FOLDER_ID no parece un ID de carpeta. Copia solo el tramo final de la URL, después de /folders/.",
    }
  }

  try {
    const beats = await loadBeats(folderId)
    return { ok: true, beats }
  } catch (error) {
    if (error instanceof DriveRequestError && error.message === "MISSING_API_KEY") {
      return { ok: false, reason: "unconfigured" }
    }

    const message =
      error instanceof Error
        ? error.name === "TimeoutError"
          ? "Google Drive tardó demasiado en responder. Inténtalo de nuevo en unos segundos."
          : redact(error.message, apiKey)
        : "No se pudo leer el catálogo de Google Drive."

    return { ok: false, reason: "error", message }
  }
}
