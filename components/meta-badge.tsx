export function MetaBadge({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: "bpm" | "key"
}) {
  const toneClass =
    tone === "bpm"
      ? "bg-emerald-400/10 text-emerald-300"
      : "bg-violet-400/10 text-violet-200"

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] tracking-wide ${toneClass}`}
    >
      {children}
    </span>
  )
}
