import { speak } from '../lib/audio'
import { IconSpeaker, IconTurtle } from './icons'

type Props = { text: string; size?: 'sm' | 'md' | 'lg'; slow?: boolean; label?: string }

const SIZES = {
  sm: 'h-9 w-9 rounded-xl [&_svg]:h-5 [&_svg]:w-5',
  md: 'h-12 w-12 rounded-2xl [&_svg]:h-6 [&_svg]:w-6',
  lg: 'h-20 w-20 rounded-3xl [&_svg]:h-10 [&_svg]:w-10',
}

export function AudioButton({ text, size = 'md', slow = false, label }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        speak(text, { slow })
      }}
      aria-label={label ?? (slow ? 'Escuchar despacio' : 'Escuchar')}
      className={`inline-flex shrink-0 items-center justify-center bg-sky text-white shadow-[0_4px_0_var(--color-sky-dark)] transition-transform duration-75 active:translate-y-[3px] active:shadow-[0_1px_0_var(--color-sky-dark)] ${SIZES[size]}`}
    >
      {slow ? <IconTurtle /> : <IconSpeaker />}
    </button>
  )
}
