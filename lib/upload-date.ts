const TIME_ZONE = "Europe/Madrid"

const uploadedOn = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
})

const monthName = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  timeZone: TIME_ZONE,
})

const calendarDay = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
})

const calendarYear = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  timeZone: TIME_ZONE,
})

export type UploadWindow = "all" | "7d" | "30d" | "year"

const DAY_MS = 24 * 60 * 60 * 1000

export function formatUploadDate(iso: string) {
  const date = parseUploadDate(iso)
  if (!date) return ""
  return uploadedOn.format(date).replace(/\./g, "")
}

export function uploadSearchText(iso: string) {
  const date = parseUploadDate(iso)
  if (!date) return ""
  return `${formatUploadDate(iso)} ${monthName.format(date)} ${calendarDay.format(date)}`
}

export function isWithinUploadWindow(
  iso: string,
  window: UploadWindow,
  now = Date.now(),
) {
  if (window === "all") return true
  const date = parseUploadDate(iso)
  if (!date) return false
  if (window === "7d") return now - date.getTime() <= 7 * DAY_MS
  if (window === "30d") return now - date.getTime() <= 30 * DAY_MS
  return calendarYear.format(date) === calendarYear.format(new Date(now))
}

function parseUploadDate(iso: string) {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}
