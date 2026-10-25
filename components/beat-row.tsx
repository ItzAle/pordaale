"use client"

import { Check, Copy, Download, LoaderCircle, Pause, Play } from "lucide-react"

import { MetaBadge } from "@/components/meta-badge"
import { beatStreamPath } from "@/lib/beat-url"
import { formatBpm } from "@/lib/parse-beat"
import { formatUploadDate } from "@/lib/upload-date"
import type { Beat } from "@/types/beat"

function EqBars({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-3.5 items-end gap-0.5" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className={
            playing
              ? "eq-bar w-0.5 bg-emerald-300"
              : "h-1.5 w-0.5 bg-emerald-300/70"
          }
          style={playing ? { animationDelay: `${delay}ms` } : undefined}
        />
      ))}
    </span>
  )
}

export function BeatRow({
  beat,
  active,
  playing,
  buffering,
  copied,
  onToggle,
  onCopy,
}: {
  beat: Beat
  active: boolean
  playing: boolean
  buffering: boolean
  copied: boolean
  onToggle: () => void
  onCopy: () => void
}) {
  return (
    <li
      className={`flex items-center gap-3 px-3 py-3 transition-colors sm:grid sm:grid-cols-[2.75rem_minmax(0,1fr)_5.5rem_3.75rem_6.5rem_5.25rem] sm:gap-3 sm:px-4 ${
        active
          ? "bg-violet-400/10 shadow-[inset_3px_0_0_#34d399]"
          : "hover:bg-white/[0.03]"
      }`}
      onClick={(event) => {
        const target = event.target
        if (!(target instanceof HTMLElement)) return
        if (target.closest("a, button")) return
        onToggle()
      }}
    >
      <button
        type="button"
        aria-label={
          active && playing ? `Pausar ${beat.title}` : `Reproducir ${beat.title}`
        }
        aria-pressed={active && playing}
        onClick={onToggle}
        className={`grid size-10 place-items-center rounded-full border transition ${
          active
            ? "border-violet-300/40 bg-violet-400/20 text-white"
            : "border-white/10 bg-white/5 text-zinc-100 hover:border-violet-300/40 hover:bg-violet-400/10"
        }`}
      >
        {active && buffering ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : active && playing ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 translate-x-px fill-current" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {active ? <EqBars playing={playing} /> : null}
          <p
            className={`truncate text-sm font-medium sm:text-[15px] ${
              active ? "text-violet-100" : "text-zinc-100"
            }`}
            title={beat.filename}
          >
            {beat.title}
          </p>
          {active ? (
            <span className="sr-only">{playing ? "Reproduciendo" : "En pausa"}</span>
          ) : null}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
          <MetaBadge tone="bpm">{formatBpm(beat.bpm)}</MetaBadge>
          <MetaBadge tone="key">{beat.key}</MetaBadge>
          <time className="text-[11px] text-zinc-500" dateTime={beat.createdTime}>
            {formatUploadDate(beat.createdTime)}
          </time>
        </div>
      </div>

      <div className="hidden sm:block">
        <MetaBadge tone="bpm">{formatBpm(beat.bpm)}</MetaBadge>
      </div>
      <div className="hidden sm:block">
        <MetaBadge tone="key">{beat.key}</MetaBadge>
      </div>
      <time
        className="hidden text-xs whitespace-nowrap text-zinc-400 tabular-nums sm:block"
        dateTime={beat.createdTime}
      >
        {formatUploadDate(beat.createdTime) || "--"}
      </time>

      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          aria-label={copied ? "Enlace copiado" : `Copiar enlace de ${beat.title}`}
          onClick={onCopy}
          className="grid size-9 place-items-center rounded-full text-zinc-400 transition hover:bg-white/8 hover:text-white"
        >
          {copied ? (
            <Check className="size-4 text-emerald-300" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
        <a
          href={beatStreamPath(beat, true)}
          download={beat.filename}
          aria-label={`Descargar ${beat.title}`}
          className="grid size-9 place-items-center rounded-full text-zinc-400 transition hover:bg-white/8 hover:text-white"
        >
          <Download className="size-4" />
        </a>
      </div>
    </li>
  )
}
