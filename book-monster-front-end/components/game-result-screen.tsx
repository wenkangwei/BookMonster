"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Heart, Star } from "lucide-react"
import { PokemonStatsRadar } from "./pokemon-stats-radar"
import type { Pokemon } from "@/types/game"

interface GameResultScreenProps {
  result: "win" | "lose" | "capture"
  capturedPokemon?: Pokemon
  onContinue: () => void
  onRestart: () => void
}

export function GameResultScreen({ result, capturedPokemon, onContinue, onRestart }: GameResultScreenProps) {
  if (result === "lose") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96 text-center bg-gradient-to-b from-blue-100 to-purple-100">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Heart className="w-16 h-16 text-blue-500" />
            </div>
            <CardTitle className="text-2xl text-blue-700">别灰心！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-lg text-gray-700">失败是成功之母</p>
              <p className="text-sm text-gray-600">每一次失败都是成长的机会，继续努力吧！</p>
              <p className="text-sm text-gray-600">相信你下次一定能获得胜利！</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={onRestart} className="flex-1 bg-blue-600 hover:bg-blue-700">
                再试一次
              </Button>
              <Button onClick={onContinue} variant="outline" className="flex-1 bg-transparent">
                返回主菜单
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result === "win") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96 text-center bg-gradient-to-b from-yellow-100 to-orange-100">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Trophy className="w-16 h-16 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl text-yellow-700">恭喜获胜！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-lg text-gray-700">太棒了！</p>
              <p className="text-sm text-gray-600">你成功击败了对手的神奇宝贝！</p>
              <p className="text-sm text-gray-600">继续保持这种状态，成为神奇宝贝大师吧！</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={onContinue} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                继续游戏
              </Button>
              <Button onClick={onRestart} variant="outline" className="flex-1 bg-transparent">
                再来一局
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result === "capture" && capturedPokemon) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-[500px] text-center bg-gradient-to-b from-green-100 to-emerald-100">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Star className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">捕获成功！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-lg text-gray-700">太棒了！你成功捕获了新的神奇宝贝！</p>
            </div>

            {/* 捕获的神奇宝贝信息 */}
            <Card className="bg-white/80">
              <CardContent className="p-4">
                <div className="flex gap-4 items-start">
                  <img
                    src={capturedPokemon.image || "/placeholder.svg"}
                    alt={capturedPokemon.name}
                    className="w-24 h-24 object-contain"
                  />
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-bold text-gray-800">{capturedPokemon.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">等级 {capturedPokemon.level}</p>
                    <p className="text-sm text-gray-700 mb-3">{capturedPokemon.description}</p>

                    {/* 技能列表 */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-gray-700">技能：</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {capturedPokemon.skills.map((skill) => (
                          <div key={skill.id} className="bg-blue-100 px-2 py-1 rounded text-xs">
                            {skill.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 能力值雷达图 */}
                  <div className="flex-shrink-0">
                    <PokemonStatsRadar stats={capturedPokemon.stats} size={100} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={onContinue} className="flex-1 bg-green-600 hover:bg-green-700">
                继续冒险
              </Button>
              <Button onClick={onRestart} variant="outline" className="flex-1 bg-transparent">
                再来一局
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
