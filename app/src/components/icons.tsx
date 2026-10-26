import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
})

export const IconPath = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20c4 0 4-4 8-4s4 4 8 4" />
    <circle cx="12" cy="8" r="4" />
  </svg>
)
export const IconReview = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="14" height="14" rx="3" />
    <path d="M7 3h11a3 3 0 0 1 3 3v11" />
  </svg>
)
export const IconBrush = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 4.5l5 5L10 19H5v-5z" />
    <path d="M12.5 6.5l5 5" />
  </svg>
)
export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
)
export const IconSpeaker = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 10v4h4l5 4V6L8 10z" fill="currentColor" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
)
export const IconTurtle = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 15c0-4 3.5-7 7.5-7S19 11 19 15z" />
    <path d="M19 13.5h2M6 15v2.5M16 15v2.5M11.5 8v7M6 12h11" />
  </svg>
)
export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const IconCheck = (p: P) => (
  <svg {...base({ strokeWidth: 3, ...p })}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" fill="currentColor" stroke="none" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)
export const IconStar = (p: P) => (
  <svg {...base({ strokeWidth: 1.5, ...p })}>
    <path
      d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z"
      fill="currentColor"
    />
  </svg>
)
export const IconFlame = (p: P) => (
  <svg {...base({ strokeWidth: 0, ...p })}>
    <path
      d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.6 1 2.6 2 3 0-3.5-1-6 1-9.5z"
      fill="currentColor"
    />
  </svg>
)
export const IconTrophy = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0z" fill="currentColor" />
    <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7" />
  </svg>
)
