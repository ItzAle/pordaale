"use client"

import { Search, Shuffle, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

import { AudioPlayer } from "@/components/audio-player"
import { BeatRow } from "@/components/beat-row"
import { BrandMark } from "@/components/brand-mark"
import { SocialLinks } from "@/components/social-links"
import { UsageTerms } from "@/components/usage-terms"
import { beatShareHash, beatStreamPath } from "@/lib/beat-url"
import { site } from "@/lib/site"
import {
  isWithinUploadWindow,
  uploadSearchText,
  type UploadWindow,
} from "@/lib/upload-date"
import type { Beat } from "@/types/beat"

const DATE_FILTERS: { id: UploadWindow; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "year", label: "Este año" },
]

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function matches(beat: Beat, query: string, uploaded: UploadWindow) {
  if (!isWithinUploadWindow(beat.createdTime, uploaded)) return false
  const needle = normalize(query.trim())
  if (!needle) return true
  return [
    beat.title,
    beat.filename,
    beat.bpm,
    beat.key,
    `${beat.bpm} bpm`,
    uploadSearchText(beat.createdTime),
  ].some((value) => normalize(value).includes(needle))
}

function pickRandom(pool: Beat[], avoidId: string | null) {
  if (pool.length === 0) return null
  const others = avoidId ? pool.filter((beat) => beat.id !== avoidId) : pool
  const source = others.length > 0 ? others : pool
  const index = Math.floor(Math.random() * source.length)
  return source[index] ?? null
}

function queueFor(id: string | null, beats: Beat[], visible: Beat[]) {
  if (id && visible.some((beat) => beat.id === id)) return visible
  return beats
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function subscribeHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange)
  return () => window.removeEventListener("hashchange", onStoreChange)
}

function readHashId() {
  try {
    return decodeURIComponent(window.location.hash.replace(/^#/, ""))
  } catch {
    return ""
  }
}

export function BeatCatalog({ beats }: { beats: Beat[] }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const seekingRef = useRef(false)
  const copyTimer = useRef<number | null>(null)

  const [query, setQuery] = useState("")
  const [uploaded, setUploaded] = useState<UploadWindow>("all")
  const [shuffle, setShuffle] = useState(false)
  const [overrideId, setOverrideId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [muted, setMuted] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const hashId = useSyncExternalStore(subscribeHash, readHashId, () => "")
  const currentId =
    overrideId ?? (beats.some((beat) => beat.id === hashId) ? hashId : null)

  const filtered = useMemo(
    () => beats.filter((beat) => matches(beat, query, uploaded)),
    [beats, query, uploaded],
  )
  const queue = queueFor(currentId, beats, filtered)
  const currentIndex = queue.findIndex((beat) => beat.id === currentId)
  const current = beats.find((beat) => beat.id === currentId) ?? null

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume
  }, [muted, volume, currentId])

  useEffect(() => {
    const audio = audioRef.current
    const beat = beats.find((item) => item.id === currentId)
    if (!audio || !beat) return
    if (audio.dataset.beatId === beat.id) return
    audio.dataset.beatId = beat.id
    audio.src = new URL(beatStreamPath(beat), window.location.origin).href
  }, [beats, currentId])

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code !== "Space" || !currentId) return
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      const tag = target.tagName
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "BUTTON" ||
        tag === "A" ||
        target.isContentEditable
      ) {
        return
      }
      event.preventDefault()
      const beat = beats.find((item) => item.id === currentId)
      if (beat) toggleBeat(beat)
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  function absoluteSrc(beat: Beat) {
    return new URL(beatStreamPath(beat), window.location.origin).href
  }

  function remember(beat: Beat) {
    const hash = beatShareHash(beat.id)
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash)
    }
  }

  async function playAudio() {
    const audio = audioRef.current
    if (!audio) return
    setAudioError(false)
    setBuffering(true)
    setIsPlaying(true)
    try {
      await audio.play()
    } catch (error) {
      if (isAbort(error)) return
      setIsPlaying(false)
      setBuffering(false)
      setAudioError(true)
    }
  }

  function startBeat(beat: Beat) {
    const audio = audioRef.current
    if (!audio) return
    remember(beat)
    setOverrideId(beat.id)
    setAudioError(false)
    const nextSrc = absoluteSrc(beat)
    if (audio.dataset.beatId !== beat.id) {
      setCurrentTime(0)
      setDuration(0)
      audio.dataset.beatId = beat.id
      audio.src = nextSrc
    }
    void playAudio()
  }

  function toggleBeat(beat: Beat) {
    const audio = audioRef.current
    if (!audio) return
    if (currentId === beat.id && audio.dataset.beatId === beat.id) {
      if (audio.paused) void playAudio()
      else audio.pause()
      return
    }
    startBeat(beat)
  }

  function playStep(offset: number) {
    if (shuffle) {
      const beat = pickRandom(queue, currentId)
      if (beat) startBeat(beat)
      return
    }
    const next = queue[currentIndex + offset]
    if (!next) return
    startBeat(next)
  }

  function toggleShuffle() {
    if (shuffle) {
      setShuffle(false)
      return
    }
    setShuffle(true)
    if (!current) {
      const beat = pickRandom(filtered, null)
      if (beat) startBeat(beat)
    }
  }

  async function copyLink(beat: Beat) {
    const url = `${window.location.origin}${window.location.pathname}${beatShareHash(beat.id)}`
    const markCopied = () => {
      setCopiedId(beat.id)
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => {
        setCopiedId((value) => (value === beat.id ? null : value))
      }, 1600)
    }

    try {
      await navigator.clipboard.writeText(url)
      markCopied()
      return
    } catch {
      const field = document.createElement("textarea")
      field.value = url
      field.setAttribute("readonly", "")
      field.style.position = "fixed"
      field.style.left = "-9999px"
      document.body.appendChild(field)
      field.select()
      const copied = document.execCommand("copy")
      field.remove()
      if (copied) markCopied()
    }
  }

  function syncDuration() {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    setDuration(audio.duration)
  }

  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return
    const album = [current.bpm !== "--" ? `${current.bpm} BPM` : null, current.key !== "--" ? current.key : null]
      .filter(Boolean)
      .join(" · ")

    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: site.name,
      album,
    })

    const bind = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // El navegador no ofrece esa acción.
      }
    }

    bind("play", () => {
      void playAudio()
    })
    bind("pause", () => {
      audioRef.current?.pause()
    })
    bind("previoustrack", () => {
      playStep(-1)
    })
    bind("nexttrack", () => {
      playStep(1)
    })

    return () => {
      bind("play", null)
      bind("pause", null)
      bind("previoustrack", null)
      bind("nexttrack", null)
    }
  })

  const filtering = query.trim().length > 0 || uploaded !== "all"
  const countLabel = filtering
    ? `${filtered.length} de ${beats.length}`
    : beats.length === 1
      ? "1 beat disponible"
      : `${beats.length} beats disponibles`

  return (
    <section className={current ? "pb-36" : undefined}>
      <div>
        <div className="flex items-end justify-between gap-4">
          <BrandMark />
          <p className="pb-1 text-right text-sm tabular-nums text-zinc-400">
            <span className="font-medium text-white">{countLabel}</span>
          </p>
        </div>
        <SocialLinks className="mt-4 sm:justify-end" />
      </div>

      <div className="relative mt-6">
        <label htmlFor="beat-search" className="sr-only">
          Buscar por nombre, BPM, key o fecha
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500" />
        <input
          id="beat-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre, BPM, key o fecha"
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pr-11 pl-11 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-300/50 focus:bg-white/[0.05]"
        />
        {query ? (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-zinc-400 hover:bg-white/8 hover:text-white"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por fecha de subida">
        {DATE_FILTERS.map((filter) => {
          const selected = uploaded === filter.id
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setUploaded(filter.id)}
              className={`h-8 rounded-full border px-3 text-xs font-medium transition ${
                selected
                  ? "border-violet-300/50 bg-violet-400/15 text-violet-100"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          )
        })}
        </div>
        <button
          type="button"
          aria-pressed={shuffle}
          disabled={filtered.length === 0}
          onClick={toggleShuffle}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition disabled:opacity-40 ${
            shuffle
              ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100"
              : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
          }`}
        >
          <Shuffle className="size-3.5" />
          Aleatorio
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="hidden grid-cols-[2.75rem_minmax(0,1fr)_5.5rem_3.75rem_6.5rem_5.25rem] gap-3 border-b border-white/8 px-4 py-2.5 text-[11px] font-medium tracking-[0.16em] text-zinc-500 uppercase sm:grid">
          <span aria-hidden />
          <span>Beat</span>
          <span>BPM</span>
          <span>Key</span>
          <span>Subido</span>
          <span aria-hidden />
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm leading-6 text-zinc-400">
            {beats.length === 0
              ? "Todavía no hay beats en la carpeta. Sube archivos con el formato Nombre_BPM_Key.mp3."
              : "Ningún beat coincide con el filtro."}
          </p>
        ) : (
          <ul className="divide-y divide-white/8">
            {filtered.map((beat) => (
              <BeatRow
                key={beat.id}
                beat={beat}
                active={beat.id === currentId}
                playing={beat.id === currentId && isPlaying}
                buffering={beat.id === currentId && buffering}
                copied={copiedId === beat.id}
                onToggle={() => toggleBeat(beat)}
                onCopy={() => {
                  void copyLink(beat)
                }}
              />
            ))}
          </ul>
        )}
      </div>

      <UsageTerms />

      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        onTimeUpdate={(event) => {
          if (seekingRef.current) return
          setCurrentTime(event.currentTarget.currentTime)
        }}
        onLoadedMetadata={syncDuration}
        onDurationChange={syncDuration}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => {
          setBuffering(false)
          setIsPlaying(true)
          setAudioError(false)
        }}
        onPause={() => {
          setIsPlaying(false)
          setBuffering(false)
        }}
        onEnded={() => {
          playStep(1)
        }}
        onError={() => {
          setAudioError(true)
          setIsPlaying(false)
          setBuffering(false)
        }}
      />

      {current ? (
        <AudioPlayer
          beat={current}
          isPlaying={isPlaying}
          buffering={buffering}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          muted={muted}
          error={audioError}
          shuffle={shuffle}
          hasPrev={shuffle ? queue.length > 1 : currentIndex > 0}
          hasNext={
            shuffle ? queue.length > 1 : currentIndex >= 0 && currentIndex < queue.length - 1
          }
          onToggle={() => toggleBeat(current)}
          onToggleShuffle={toggleShuffle}
          onPrev={() => playStep(-1)}
          onNext={() => playStep(1)}
          onSeekStart={() => {
            seekingRef.current = true
          }}
          onSeekEnd={() => {
            seekingRef.current = false
          }}
          onSeek={(time) => {
            const audio = audioRef.current
            if (audio) audio.currentTime = time
            setCurrentTime(time)
          }}
          onVolume={(value) => {
            setVolume(value)
            setMuted(value === 0)
          }}
          onToggleMute={() => {
            if (muted) {
              if (volume === 0) setVolume(0.85)
              setMuted(false)
              return
            }
            setMuted(true)
          }}
        />
      ) : null}
    </section>
  )
}
