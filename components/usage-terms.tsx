import { SocialLinks } from "@/components/social-links"
import { socials } from "@/lib/site"
import { terms } from "@/lib/terms"

export function UsageTerms() {
  return (
    <section
      id="terminos"
      className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] px-5 py-5 sm:px-6 sm:py-6"
    >
      <h2 className="text-sm font-medium tracking-tight text-white">
        Términos de uso
      </h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 sm:gap-8">
        <TermList title="Español" items={terms.es} />
        <TermList title="English" items={terms.en} />
      </div>
      {socials.length > 0 ? (
        <div className="mt-6 border-t border-white/8 pt-5">
          <p className="text-[11px] font-medium tracking-[0.16em] text-zinc-500 uppercase">
            Redes
          </p>
          <SocialLinks className="mt-3" />
        </div>
      ) : null}
    </section>
  )
}

function TermList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.16em] text-zinc-500 uppercase">
        {title}
      </p>
      <ol className="mt-3 space-y-3 text-sm leading-6 text-zinc-300">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3">
            <span className="mt-0.5 text-xs font-medium text-violet-200/80 tabular-nums">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
