import { useId } from 'react'

export function Wave({ colors = ['#8749ff', '#ff62db', '#21ccef'], offset = 0 }: { colors?: string[]; offset?: number }) {
  const id = useId()
  const lines = Array.from({ length: 15 }, (_, row) =>
    Array.from({ length: 81 }, (_, sample) => {
      const x = sample * 4
      const y = 62 + Math.sin(x * .027 + offset + row * .15) * (13 + row * 1.18)
        + Math.sin(x * .054 + row * .06 - offset) * 8 + (row - 7) * 1.1
      return `${sample ? 'L' : 'M'}${x},${y.toFixed(2)}`
    }).join(' '))
  return <svg className="wave" viewBox="0 0 320 104" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id={id}>{colors.map((color, index) => <stop key={color + index} offset={index / (colors.length - 1)} stopColor={color}/>)}</linearGradient></defs>
    <g fill="none" stroke={`url(#${id})`}>
      {lines.map((line, index) => <path key={line} d={line} strokeWidth={index % 7 === 0 ? 1.1 : .69}
        opacity={index % 7 === 0 ? .8 : .42} strokeDasharray={index % 7 === 0 ? undefined : '1 2'}/>)}
    </g>
  </svg>
}
