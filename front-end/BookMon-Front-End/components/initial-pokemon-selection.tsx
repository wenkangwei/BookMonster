"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader } from "lucide-react"
import { GameApiService } from "@/services/api"
import type { Pokemon } from "@/types/game"

interface InitialPokemonSelectionProps {
  onSelectPokemon: (pokemon: Pokemon) => void
}

export function InitialPokemonSelection({ onSelectPokemon }: InitialPokemonSelectionProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [starterPokemons, setStarterPokemons] = useState<Pokemon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStarterPokemons = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("Loading starter pokemons from API...")

        const pokemons = await GameApiService.initMonster()
        console.log("Loaded starter pokemons:", pokemons)

        setStarterPokemons(pokemons)
      } catch (error) {
        console.error("Failed to load starter pokemons:", error)
        setError("加载初始神奇宝贝失败，请重试")
      } finally {
        setIsLoading(false)
      }
    }

    loadStarterPokemons()
  }, [])

  const handleRetry = () => {
    setError(null)
    const loadStarterPokemons = async () => {
      try {
        setIsLoading(true)
        const pokemons = await GameApiService.initMonster()
        setStarterPokemons(pokemons)
      } catch (error) {
        console.error("Retry failed:", error)
        setError("重试失败，请检查网络连接")
      } finally {
        setIsLoading(false)
      }
    }
    loadStarterPokemons()
  }

  if (isLoading) {
    return (
      <div className="h-full w-full bg-gradient-to-b from-blue-400 to-green-400 flex items-center justify-center">
        <Card className="w-96 text-center bg-white/95 backdrop-blur">
          <CardContent className="p-8">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">加载中...</h2>
            <p className="text-gray-600">正在从服务器获取初始神奇宝贝</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full bg-gradient-to-b from-blue-400 to-green-400 flex items-center justify-center">
        <Card className="w-96 text-center bg-white/95 backdrop-blur">
          <CardContent className="p-8">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">加载失败</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-gradient-to-b from-blue-400 to-green-400 flex items-center justify-center p-2 overflow-hidden">
      <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
        {/* 标题区域 */}
        <div className="text-center py-2 portrait:py-4 landscape:py-1 flex-shrink-0">
          <h1 className="text-lg portrait:text-2xl landscape:text-lg font-bold text-white drop-shadow-lg">
            选择你的初始神奇宝贝
          </h1>
          <p className="text-sm portrait:text-base landscape:text-sm text-white/80 mt-1">
            从服务器加载了 {starterPokemons.length} 只神奇宝贝
          </p>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 神奇宝贝选择区域 */}
          <div className="flex-1 flex items-center justify-center min-h-0 px-2">
            <div className="w-full max-w-3xl">
              <div className="grid grid-cols-1 portrait:grid-cols-1 landscape:grid-cols-3 gap-3 portrait:gap-4 landscape:gap-2">
                {starterPokemons.map((pokemon) => (
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
                              等级 {pokemon.level} • {pokemon.attribute}属性
                            </p>
                            <div className="grid grid-cols-2 gap-1 text-xs portrait:text-sm landscape:text-xs mt-1 portrait:mt-2 landscape:mt-1">
                              <div>HP: {pokemon.maxHp}</div>
                              <div>攻击: {pokemon.stats.attack}</div>
                              <div>防御: {pokemon.stats.defense}</div>
                              <div>速度: {pokemon.stats.speed}</div>
                            </div>
                            {pokemon.bookName && (
                              <p className="text-xs text-purple-600 mt-1">来自《{pokemon.bookName}》</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 选中神奇宝贝的详细信息 */}
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
                      <div className="flex gap-2 text-xs">
                        <span className="bg-blue-100 px-2 py-1 rounded">{selectedPokemon.attribute}属性</span>
                        <span className="bg-green-100 px-2 py-1 rounded">经验值: {selectedPokemon.exp}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 确认按钮区域 */}
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
