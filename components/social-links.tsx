import { SiInstagram, SiSoundcloud } from "react-icons/si"
import type { IconType } from "react-icons"

import { socials } from "@/lib/site"

const icons: Record<(typeof socials)[number]["id"], IconType> = {
  soundcloud: SiSoundcloud,
  instagram: SiInstagram,
}

export function SocialLinks({ className = "" }: { className?: string }) {
  if (socials.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {socials.map((social) => {
        const Icon = icons[social.id]
        return (
          <li key={social.href}>
            <a
              href={social.href}
              target="_blank"
              rel="noreferrer"
              aria-label={social.label}
              title={social.label}
              className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-200 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
            >
              <Icon className="size-[18px]" aria-hidden />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
