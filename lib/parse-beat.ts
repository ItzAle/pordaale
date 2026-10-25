export const MISSING_META = "--"

export type ParsedBeatName = {
  title: string
  bpm: string
  key: string
}

const COMPACT_NAME =
  /^(.*?)(\d{2,3})(?:\s*bpm)?([A-G][#b]?(?:min|maj|dim|m)?)?$/i

/**
 * Acepta `Nombre del Beat_BPM_Key.ext` y también el formato pegado
 * `places107Amin.wav` o `heaven127Cmin.wav`.
 * Si no encaja, conserva el nombre y usa "--" en los huecos.
 */
export function parseBeatFilename(filename: string): ParsedBeatName {
  const base = filename.replace(/\.[^./\\]+$/, "").trim()
  return parseUnderscore(base) ?? parseCompact(base) ?? {
    title: base || MISSING_META,
    bpm: MISSING_META,
    key: MISSING_META,
  }
}

function parseUnderscore(base: string): ParsedBeatName | null {
  const parts = base
    .split("_")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  const bpmCandidate = parts.length >= 3 ? parts[parts.length - 2] : ""
  if (parts.length < 3 || !/^\d{2,3}$/.test(bpmCandidate)) return null

  const key = parts[parts.length - 1] || MISSING_META
  const title = parts.slice(0, -2).join(" ").trim() || MISSING_META
  return { title, bpm: bpmCandidate, key }
}

function parseCompact(base: string): ParsedBeatName | null {
  const match = base.match(COMPACT_NAME)
  if (!match) return null

  const bpm = Number(match[2])
  const title = match[1].replace(/_+/g, " ").trim()
  if (!title || bpm < 40 || bpm > 300) return null

  const rawKey = match[3]?.trim() ?? ""
  return {
    title,
    bpm: match[2],
    key: rawKey ? rawKey[0].toUpperCase() + rawKey.slice(1) : MISSING_META,
  }
}

export function formatBpm(bpm: string) {
  return bpm === MISSING_META ? MISSING_META : `${bpm} BPM`
}
