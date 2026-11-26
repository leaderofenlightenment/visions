import { useId } from 'react'

export function BrandMark({ size = 36 }: { size?: number }) {
  const gradient = useId()
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className="brand-mark">
    <defs><linearGradient id={gradient} x1="12" y1="53" x2="50" y2="13" gradientUnits="userSpaceOnUse">
      <stop stopColor="#66efff"/><stop offset=".22" stopColor="#497bff"/><stop offset=".42" stopColor="#9162ff"/>
      <stop offset=".62" stopColor="#fc62d9"/><stop offset=".83" stopColor="#ff906a"/><stop offset="1" stopColor="#ffe498"/>
    </linearGradient></defs>
    <g stroke={`url(#${gradient})`} strokeWidth="2.8" strokeLinejoin="round">
      <path d="M32 8 58 53H6Z"/><circle cx="32" cy="38" r="9.5"/>
    </g>
  </svg>
}
