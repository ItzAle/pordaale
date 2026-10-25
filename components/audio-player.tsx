"use client"

import {
  LoaderCircle,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"

import { MetaBadge } from "@/components/meta-badge"
import { formatBpm, MISSING_META } from "@/lib/parse-beat"
import type { Beat } from "@/types/beat"

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const rest = total % 60
  const minutes = Math.floor(total / 60)
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`
  }
  return `${minutes}:${rest.toString().padStart(2, "0")}`
}

export function AudioPlayer({
  beat,
  isPlaying,
  buffering,
  currentTime,
  duration,
  volume,
  muted,
  error,
  shuffle,
  hasPrev,
  hasNext,
  onToggle,
  onToggleShuffle,
  onPrev,
  onNext,
  onSeek,
  onSeekStart,
  onSeekEnd,
  onVolume,
  onToggleMute,
}: {
  beat: Beat
  isPlaying: boolean
  buffering: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  error: boolean
  shuffle: boolean
  hasPrev: boolean
  hasNext: boolean
  onToggle: () => void
  onToggleShuffle: () => void
  onPrev: () => void
  onNext: () => void
  onSeek: (time: number) => void
  onSeekStart: () => void
  onSeekEnd: () => void
  onVolume: (volume: number) => void
  onToggleMute: () => void
}) {
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  const volumePercent = (muted ? 0 : volume) * 100
  const silent = muted || volume === 0

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0c10]/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={shuffle ? "Desactivar aleatorio" : "Activar aleatorio"}
              aria-pressed={shuffle}
              onClick={onToggleShuffle}
              className={`grid size-9 place-items-center rounded-full transition ${
                shuffle
                  ? "bg-emerald-400/15 text-emerald-200"
                  : "text-zinc-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Shuffle className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Beat anterior"
              disabled={!hasPrev}
              onClick={onPrev}
              className="grid size-9 place-items-center rounded-full text-zinc-300 transition hover:bg-white/8 hover:text-white disabled:opacity-30"
            >
              <SkipBack className="size-4 fill-current" />
            </button>
            <button
              type="button"
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
              onClick={onToggle}
              className="grid size-11 place-items-center rounded-full bg-white text-zinc-950 transition hover:bg-violet-100"
            >
              {buffering ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 translate-x-px fill-current" />
              )}
            </button>
            <button
              type="button"
              aria-label="Beat siguiente"
              disabled={!hasNext}
              onClick={onNext}
              className="grid size-9 place-items-center rounded-full text-zinc-300 transition hover:bg-white/8 hover:text-white disabled:opacity-30"
            >
              <SkipForward className="size-4 fill-current" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{beat.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <MetaBadge tone="bpm">{formatBpm(beat.bpm)}</MetaBadge>
              <MetaBadge tone="key">{beat.key || MISSING_META}</MetaBadge>
              {error ? (
                <span className="text-xs text-rose-300">No se pudo reproducir</span>
              ) : null}
            </div>
          </div>

          <div className="hidden w-32 items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label={silent ? "Activar sonido" : "Silenciar"}
              aria-pressed={silent}
              onClick={onToggleMute}
              className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-300 hover:text-white"
            >
              {silent ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <input
              aria-label="Volumen"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={silent ? 0 : volume}
              onChange={(event) => onVolume(Number(event.target.value))}
              className="player-range w-full"
              style={{
                background: `linear-gradient(to right, #c4b5fd ${volumePercent}%, rgba(255,255,255,0.14) ${volumePercent}%)`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-400">
            {formatTime(currentTime)}
          </span>
          <input
            aria-label="Progreso de la reproducción"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            disabled={!duration}
            onPointerDown={onSeekStart}
            onPointerUp={onSeekEnd}
            onPointerCancel={onSeekEnd}
            onChange={(event) => onSeek(Number(event.target.value))}
            className="player-range min-w-0 flex-1"
            style={{
              background: `linear-gradient(to right, #a78bfa ${progress}%, rgba(255,255,255,0.14) ${progress}%)`,
            }}
          />
          <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-zinc-400">
            {formatTime(duration)}
          </span>
          <button
            type="button"
            aria-label={silent ? "Activar sonido" : "Silenciar"}
            aria-pressed={silent}
            onClick={onToggleMute}
            className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-300 hover:text-white sm:hidden"
          >
            {silent ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <input
            aria-label="Volumen"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={silent ? 0 : volume}
            onChange={(event) => onVolume(Number(event.target.value))}
            className="player-range w-16 sm:hidden"
            style={{
              background: `linear-gradient(to right, #c4b5fd ${volumePercent}%, rgba(255,255,255,0.14) ${volumePercent}%)`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
