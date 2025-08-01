"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Pokemon } from "@/types/game"

interface InitialPokemonSelectionProps {
  onSelectPokemon: (pokemon: Pokemon) => void
}

const STARTER_POKEMONS: Pokemon[] = [
  {
    id: "starter-1",
    name: "小火龙",
    level: 5,
    hp: 39,
    maxHp: 39,
    image: "/placeholder.svg?height=128&width=128",
    skills: [
      { id: "s1", name: "撞击", damage: 20, description: "用身体撞击对手", remainingUses: 35, maxUses: 35 },
      { id: "s2", name: "叫声", damage: 0, description: "降低对手攻击力", remainingUses: 40, maxUses: 40 },
      { id: "s3", name: "火花", damage: 25, description: "喷出小火焰攻击对手", remainingUses: 25, maxUses: 25 },
      { id: "s4", name: "烟幕", damage: 0, description: "降低对手命中率", remainingUses: 20, maxUses: 20 },
    ],
    stats: { attack: 52, defense: 43, speed: 65, hp: 39, special: 60, accuracy: 85 },
    description: "尾巴上的火焰表达了它的情感。当它高兴时，火焰会摇曳，生气时火焰会猛烈燃烧。",
    isPlayerOwned: true,
  },
  {
    id: "starter-2",
    name: "杰尼龟",
    level: 5,
    hp: 44,
    maxHp: 44,
    image: "/placeholder.svg?height=128&width=128",
    skills: [
      { id: "s5", name: "撞击", damage: 20, description: "用身体撞击对手", remainingUses: 35, maxUses: 35 },
      { id: "s6", name: "缩入壳中", damage: 0, description: "提高自己的防御力", remainingUses: 40, maxUses: 40 },
      { id: "s7", name: "水枪", damage: 25, description: "喷射水流攻击对手", remainingUses: 25, maxUses: 25 },
      { id: "s8", name: "泡沫", damage: 15, description: "吹出泡沫降低对手速度", remainingUses: 30, maxUses: 30 },
    ],
    stats: { attack: 48, defense: 65, speed: 43, hp: 44, special: 50, accuracy: 80 },
    description: "龟壳不仅用于保护身体。它圆润的形状和表面的沟槽能够减少水的阻力，让它游得更快。",
    isPlayerOwned: true,
  },
  {
    id: "starter-3",
    name: "妙蛙种子",
    level: 5,
    hp: 45,
    maxHp: 45,
    image: "/placeholder.svg?height=128&width=128",
    skills: [
      { id: "s9", name: "撞击", damage: 20, description: "用身体撞击对手", remainingUses: 35, maxUses: 35 },
      { id: "s10", name: "叫声", damage: 0, description: "降低对手攻击力", remainingUses: 40, maxUses: 40 },
      { id: "s11", name: "藤鞭", damage: 25, description: "用藤蔓抽打对手", remainingUses: 25, maxUses: 25 },
      { id: "s12", name: "生长", damage: 0, description: "提高自己的攻击和特攻", remainingUses: 20, maxUses: 20 },
    ],
    stats: { attack: 49, defense: 49, speed: 45, hp: 45, special: 65, accuracy: 85 },
    description: "出生后的一段时间内，它会从背上的种子中获取养分长大。种子和身体一起成长。",
    isPlayerOwned: true,
  },
]

export function InitialPokemonSelection({ onSelectPokemon }: InitialPokemonSelectionProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)

  return (
    <div className="h-full w-full bg-gradient-to-b from-blue-400 to-green-400 flex items-center justify-center p-2 overflow-hidden">
      <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
        {/* 标题区域 - 响应式调整 */}
        <div className="text-center py-2 portrait:py-4 landscape:py-1 flex-shrink-0">
          <h1 className="text-lg portrait:text-2xl landscape:text-lg font-bold text-white drop-shadow-lg">
            选择你的初始神奇宝贝
          </h1>
        </div>

        {/* 主要内容区域 - 使用flex布局确保按钮可见 */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 神奇宝贝选择区域 */}
          <div className="flex-1 flex items-center justify-center min-h-0 px-2">
            <div className="w-full max-w-3xl">
              {/* 响应式布局：竖屏时垂直排列，横屏时水平排列 */}
              <div className="grid grid-cols-1 portrait:grid-cols-1 landscape:grid-cols-3 gap-3 portrait:gap-4 landscape:gap-2">
                {STARTER_POKEMONS.map((pokemon) => (
                  <div
                    key={pokemon.id}
                    className={`cursor-pointer transition-all ${
                      selectedPokemon?.id === pokemon.id ? "ring-2 ring-yellow-400 ring-offset-2" : ""
                    }`}
                    onClick={() => setSelectedPokemon(pokemon)}
                  >
                    <Card className="text-center hover:shadow-lg bg-white/95 backdrop-blur">
                      <CardContent className="p-3 portrait:p-4 landscape:p-2">
                        <div className="flex portrait:flex-row landscape:flex-col items-center portrait:gap-4 landscape:gap-2">
                          <img
                            src={pokemon.image || "/placeholder.svg"}
                            alt={pokemon.name}
                            className="w-16 h-16 portrait:w-20 portrait:h-20 landscape:w-16 landscape:h-16 object-contain flex-shrink-0"
                          />
                          <div className="flex-1 portrait:text-left landscape:text-center">
                            <h3 className="text-base portrait:text-lg landscape:text-sm font-bold">{pokemon.name}</h3>
                            <p className="text-sm portrait:text-base landscape:text-xs text-gray-600">
                              等级 {pokemon.level}
                            </p>
                            <div className="grid grid-cols-2 gap-1 text-xs portrait:text-sm landscape:text-xs mt-1 portrait:mt-2 landscape:mt-1">
                              <div>HP: {pokemon.maxHp}</div>
                              <div>攻击: {pokemon.stats.attack}</div>
                              <div>防御: {pokemon.stats.defense}</div>
                              <div>速度: {pokemon.stats.speed}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 选中神奇宝贝的详细信息 - 竖屏时显示更多信息 */}
          {selectedPokemon && (
            <div className="flex-shrink-0 px-2 py-2 portrait:py-3 landscape:py-1">
              <Card className="bg-white/95 backdrop-blur">
                <CardContent className="p-3 portrait:p-4 landscape:p-2">
                  <div className="flex flex-col portrait:flex-row landscape:flex-row gap-3 portrait:gap-4 landscape:gap-2 items-center">
                    <img
                      src={selectedPokemon.image || "/placeholder.svg"}
                      alt={selectedPokemon.name}
                      className="w-12 h-12 portrait:w-16 portrait:h-16 landscape:w-12 landscape:h-12 object-contain flex-shrink-0"
                    />
                    <div className="flex-1 text-center portrait:text-left landscape:text-left min-w-0">
                      <h3 className="text-sm portrait:text-base landscape:text-sm font-bold mb-1">
                        {selectedPokemon.name}
                      </h3>
                      <p className="text-xs portrait:text-sm landscape:text-xs text-gray-700 mb-2 line-clamp-2 portrait:line-clamp-3 landscape:line-clamp-2">
                        {selectedPokemon.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 确认按钮区域 - 确保始终可见 */}
          <div className="flex-shrink-0 p-2 portrait:p-3 landscape:p-1">
            <Button
              onClick={() => selectedPokemon && onSelectPokemon(selectedPokemon)}
              disabled={!selectedPokemon}
              size="lg"
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 portrait:py-4 landscape:py-2 text-sm portrait:text-base landscape:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedPokemon ? `确认选择 ${selectedPokemon.name}` : "请选择一只神奇宝贝"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
