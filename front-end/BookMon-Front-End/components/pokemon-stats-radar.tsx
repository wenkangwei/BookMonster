"use client"

import type { PokemonStats } from "@/types/game"

interface PokemonStatsRadarProps {
  stats: PokemonStats
  size?: number
}

export function PokemonStatsRadar({ stats, size = 120 }: PokemonStatsRadarProps) {
  const center = size / 2
  const radius = size / 2 - 20
  const maxStat = 100

  const statLabels = [
    { key: "attack", label: "攻击", angle: 0 },
    { key: "defense", label: "防御", angle: 60 },
    { key: "speed", label: "速度", angle: 120 },
    { key: "hp", label: "HP", angle: 180 },
    { key: "special", label: "特攻", angle: 240 },
    { key: "accuracy", label: "命中", angle: 300 },
  ]

  const getPoint = (value: number, angle: number) => {
    const radian = (angle * Math.PI) / 180
    const distance = (value / maxStat) * radius
    return {
      x: center + distance * Math.cos(radian),
      y: center + distance * Math.sin(radian),
    }
  }

  const statPoints = statLabels.map(({ key, angle }) => {
    const value = stats[key as keyof PokemonStats]
    return getPoint(value, angle)
  })

  const pathData = statPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z"

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景网格 */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
          <polygon
            key={scale}
            points={statLabels
              .map(({ angle }) => {
                const point = getPoint(maxStat * scale, angle)
                return `${point.x},${point.y}`
              })
              .join(" ")}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* 轴线 */}
        {statLabels.map(({ angle }) => {
          const point = getPoint(maxStat, angle)
          return <line key={angle} x1={center} y1={center} x2={point.x} y2={point.y} stroke="#e5e7eb" strokeWidth="1" />
        })}

        {/* 数据区域 */}
        <path d={pathData} fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" strokeWidth="2" />

        {/* 数据点 */}
        {statPoints.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="3" fill="#3b82f6" />
        ))}
      </svg>

      {/* 标签 */}
      {statLabels.map(({ key, label, angle }) => {
        const labelPoint = getPoint(maxStat + 15, angle)
        return (
          <div
            key={key}
            className="absolute text-xs font-medium transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: labelPoint.x,
              top: labelPoint.y,
              transform: "translate(-50%, -50%) rotate(90deg)",
            }}
          >
            {label}
          </div>
        )
      })}
    </div>
  )
}
