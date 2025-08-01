"use client"

import { useState } from "react"
import { Plus, User, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PokemonStatsRadar } from "./pokemon-stats-radar"
import type { Pokemon, Player, BattleField } from "@/types/game"

interface GameSidebarProps {
  playerPokemon: Pokemon | null
  capturedPokemons: Pokemon[]
  enemyPokemons: Pokemon[]
  player: Player
  battleFields: BattleField[]
  selectedField: BattleField
  onCreateEnemyClick: () => void
  onSelectEnemyPokemon: (pokemon: Pokemon) => void
  onSelectBattleField: (field: BattleField) => void
  onEditPlayer: () => void
}

export function GameSidebar({
  playerPokemon,
  capturedPokemons,
  enemyPokemons,
  player,
  battleFields,
  selectedField,
  onCreateEnemyClick,
  onSelectEnemyPokemon,
  onSelectBattleField,
  onEditPlayer,
}: GameSidebarProps) {
  const [activeTab, setActiveTab] = useState<"captured" | "enemies">("enemies")
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* 移动端可折叠侧边栏 - 优化横屏显示 */}
      <div
        className={`
        ${isCollapsed ? "w-8 landscape:w-10" : "w-64 landscape:w-72"} 
        bg-amber-100 border-r-4 border-amber-800 h-full overflow-y-auto transition-all duration-300
        flex-shrink-0
      `}
      >
        {/* 折叠按钮 */}
        <div className="p-1 landscape:p-2 border-b border-amber-200">
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="sm"
            className="w-full justify-center h-6 landscape:h-8"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3 landscape:w-4 landscape:h-4" />
            ) : (
              <ChevronLeft className="w-3 h-3 landscape:w-4 landscape:h-4" />
            )}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="p-1 landscape:p-2 space-y-2 landscape:space-y-3">
            {/* 第一组：首只神奇宝贝和能力值雷达图 */}
            <Card>
              <CardHeader className="pb-1 landscape:pb-2">
                <CardTitle className="text-xs landscape:text-sm">我的神奇宝贝</CardTitle>
              </CardHeader>
              <CardContent className="p-1 landscape:p-2">
                {playerPokemon ? (
                  <div className="space-y-1 landscape:space-y-2">
                    <div className="flex items-center gap-1 landscape:gap-2">
                      <img
                        src={playerPokemon.image || "/placeholder.svg"}
                        alt={playerPokemon.name}
                        className="w-8 h-8 landscape:w-12 landscape:h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xs landscape:text-sm truncate">{playerPokemon.name}</h3>
                        <p className="text-xs text-gray-600">Lv.{playerPokemon.level}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1 landscape:h-1.5 mt-0.5">
                          <div
                            className="bg-green-500 h-1 landscape:h-1.5 rounded-full"
                            style={{ width: `${(playerPokemon.hp / playerPokemon.maxHp) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <PokemonStatsRadar stats={playerPokemon.stats} size={60} />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center text-xs">请先选择初始神奇宝贝</p>
                )}
              </CardContent>
            </Card>

            {/* 第二组：神奇宝贝图鉴 */}
            <Card>
              <CardHeader className="pb-1 landscape:pb-2">
                <CardTitle className="text-xs landscape:text-sm">神奇宝贝图鉴</CardTitle>
              </CardHeader>
              <CardContent className="p-1 landscape:p-2">
                <div className="space-y-1 landscape:space-y-2">
                  <div className="flex gap-0.5 landscape:gap-1">
                    <Button
                      variant={activeTab === "captured" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTab("captured")}
                      className="flex-1 text-xs h-6 landscape:h-7 px-1"
                    >
                      已捕捉 ({capturedPokemons.length})
                    </Button>
                    <Button
                      variant={activeTab === "enemies" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTab("enemies")}
                      className="flex-1 text-xs h-6 landscape:h-7 px-1"
                    >
                      敌方 ({enemyPokemons.length})
                    </Button>
                  </div>

                  {activeTab === "enemies" && (
                    <Button
                      onClick={onCreateEnemyClick}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-6 landscape:h-7"
                    >
                      <Plus className="w-2 h-2 landscape:w-3 landscape:h-3 mr-1" />
                      创建敌方神奇宝贝
                    </Button>
                  )}

                  <div className="space-y-0.5 landscape:space-y-1 max-h-20 landscape:max-h-24 overflow-y-auto">
                    {(activeTab === "captured" ? capturedPokemons : enemyPokemons).map((pokemon) => (
                      <Card
                        key={pokemon.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => activeTab === "enemies" && onSelectEnemyPokemon(pokemon)}
                      >
                        <CardContent className="p-1">
                          <div className="flex items-center gap-1">
                            <img
                              src={pokemon.image || "/placeholder.svg"}
                              alt={pokemon.name}
                              className="w-6 h-6 landscape:w-8 landscape:h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs truncate">{pokemon.name}</p>
                              <p className="text-xs text-gray-600">Lv.{pokemon.level}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 第三组：对战场地选择 */}
            <Card>
              <CardHeader className="pb-1 landscape:pb-2">
                <CardTitle className="text-xs landscape:text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3 landscape:w-4 landscape:h-4" />
                  对战场地
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1 landscape:p-2">
                <div className="space-y-0.5 landscape:space-y-1">
                  {battleFields.map((field) => (
                    <Card
                      key={field.id}
                      className={`cursor-pointer transition-all ${
                        selectedField.id === field.id ? "ring-1 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => onSelectBattleField(field)}
                    >
                      <CardContent className="p-1">
                        <div className="flex items-center gap-1">
                          <img
                            src={field.image || "/placeholder.svg"}
                            alt={field.name}
                            className="w-8 h-4 landscape:w-10 landscape:h-6 rounded object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs">{field.name}</p>
                            <p className="text-xs text-gray-600 truncate">{field.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 第四组：玩家信息 */}
            <Card>
              <CardHeader className="pb-1 landscape:pb-2">
                <CardTitle className="text-xs landscape:text-sm flex items-center gap-1">
                  <User className="w-3 h-3 landscape:w-4 landscape:h-4" />
                  训练师信息
                </CardTitle>
              </CardHeader>
              <CardContent className="p-1 landscape:p-2">
                <div className="space-y-1 landscape:space-y-2">
                  <div className="flex items-center gap-1 landscape:gap-2">
                    <img
                      src={player.avatar || "/placeholder.svg"}
                      alt={player.name}
                      className="w-8 h-8 landscape:w-12 landscape:h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xs landscape:text-sm truncate">{player.name}</h3>
                      <p className="text-xs text-gray-600 capitalize">{player.gender}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">{player.description}</p>
                  <Button
                    onClick={onEditPlayer}
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent text-xs h-6 landscape:h-7"
                  >
                    编辑信息
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
