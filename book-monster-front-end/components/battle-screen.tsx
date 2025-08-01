"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BattleMenuFloat } from "./battle-menu-float"
import type { Skill, BattleState } from "@/types/game"

interface BattleScreenProps {
  battleState: BattleState
  onUseSkill: (skill: Skill) => void
  onUseItem: (itemId: string) => void
  onUsePokeball: () => void
  onBackToMenu: () => void
  onRestart: () => void
}

export function BattleScreen({
  battleState,
  onUseSkill,
  onUseItem,
  onUsePokeball,
  onBackToMenu,
  onRestart,
}: BattleScreenProps) {
  const [playerShaking, setPlayerShaking] = useState(false)
  const [enemyShaking, setEnemyShaking] = useState(false)

  useEffect(() => {
    if (battleState.isAnimating) {
      if (battleState.currentTurn === "player") {
        setEnemyShaking(true)
        setTimeout(() => setEnemyShaking(false), 500)
      } else {
        setPlayerShaking(true)
        setTimeout(() => setPlayerShaking(false), 500)
      }
    }
  }, [battleState.isAnimating, battleState.currentTurn])

  if (!battleState.playerPokemon || !battleState.enemyPokemon) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Button onClick={onBackToMenu}>返回主菜单</Button>
      </div>
    )
  }

  const { playerPokemon, enemyPokemon } = battleState

  return (
    <div className="flex-1 relative">
      {/* 圆形浮窗菜单 */}
      <BattleMenuFloat onRestart={onRestart} onExit={onBackToMenu} />

      {/* 背景图片 */}
      <img
        src={battleState.selectedField.image || "/placeholder.svg"}
        alt="Battle Field"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 敌方神奇宝贝 - 移动端适配 */}
      <div className="absolute top-4 sm:top-8 right-4 sm:right-8">
        <div className="text-center">
          <Card className="mb-1 sm:mb-2 bg-white/90">
            <CardContent className="p-1.5 sm:p-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold">{enemyPokemon.name}</span>
                <span>Lv.{enemyPokemon.level}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1">
                <div
                  className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all"
                  style={{ width: `${(enemyPokemon.hp / enemyPokemon.maxHp) * 100}%` }}
                />
              </div>
              <div className="text-xs text-right mt-1">
                {enemyPokemon.hp}/{enemyPokemon.maxHp} HP
              </div>
              {enemyPokemon.status && <div className="text-xs text-purple-600 mt-1">{enemyPokemon.status}</div>}
            </CardContent>
          </Card>
          <img
            src={enemyPokemon.image || "/placeholder.svg"}
            alt={enemyPokemon.name}
            className={`w-20 h-20 sm:w-32 sm:h-32 object-contain transition-transform ${enemyShaking ? "animate-bounce" : ""}`}
          />
        </div>
      </div>

      {/* 玩家神奇宝贝 - 移动端适配 */}
      <div className="absolute bottom-24 sm:bottom-32 left-4 sm:left-8">
        <div className="text-center">
          <img
            src={playerPokemon.image || "/placeholder.svg"}
            alt={playerPokemon.name}
            className={`w-20 h-20 sm:w-32 sm:h-32 object-contain transition-transform ${playerShaking ? "animate-bounce" : ""}`}
          />
          <Card className="mt-1 sm:mt-2 bg-white/90">
            <CardContent className="p-1.5 sm:p-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold">{playerPokemon.name}</span>
                <span>Lv.{playerPokemon.level}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1">
                <div
                  className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all"
                  style={{ width: `${(playerPokemon.hp / playerPokemon.maxHp) * 100}%` }}
                />
              </div>
              <div className="text-xs text-right mt-1">
                {playerPokemon.hp}/{playerPokemon.maxHp} HP
              </div>
              {playerPokemon.status && <div className="text-xs text-purple-600 mt-1">{playerPokemon.status}</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部对话框和选项 - 移动端优化 */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-amber-100 border-t-4 border-amber-800">
        <div className="flex h-full">
          {/* 对话框 */}
          <div className="flex-1 p-2 sm:p-4">
            <div className="bg-white rounded-lg p-2 sm:p-3 h-full overflow-y-auto">
              <div className="space-y-0.5 sm:space-y-1">
                {battleState.battleLog
                  .slice()
                  .reverse()
                  .slice(0, 3)
                  .reverse()
                  .map((log, index) => (
                    <p key={index} className="text-xs sm:text-sm">
                      {log}
                    </p>
                  ))}
              </div>
            </div>
          </div>

          {/* 选项栏 - 移动端优化 */}
          <div className="w-48 sm:w-64 p-2 sm:p-4">
            <div className="grid grid-cols-2 gap-1 sm:gap-2 h-full">
              {/* 技能按钮 */}
              {playerPokemon.skills.slice(0, 4).map((skill) => (
                <Button
                  key={skill.id}
                  onClick={() => onUseSkill(skill)}
                  disabled={battleState.currentTurn !== "player" || battleState.isAnimating || skill.remainingUses <= 0}
                  className="text-xs p-1 sm:p-2 h-auto flex flex-col"
                  variant="outline"
                >
                  <span className="truncate w-full">{skill.name}</span>
                  <span className="text-xs text-gray-500">
                    {skill.remainingUses}/{skill.maxUses}
                  </span>
                </Button>
              ))}

              {/* 道具按钮 */}
              {battleState.items.slice(0, 2).map((item) => (
                <Button
                  key={item.id}
                  onClick={() => onUseItem(item.id)}
                  disabled={battleState.currentTurn !== "player" || battleState.isAnimating || item.remainingUses <= 0}
                  className="text-xs p-1 sm:p-2 h-auto flex flex-col"
                  variant="outline"
                >
                  <span className="truncate w-full">{item.name}</span>
                  <span className="text-xs text-gray-500">
                    {item.remainingUses}/{item.maxUses}
                  </span>
                </Button>
              ))}

              {/* 精灵球按钮 */}
              <Button
                onClick={onUsePokeball}
                disabled={battleState.currentTurn !== "player" || battleState.isAnimating || enemyPokemon.hp > 0}
                className="text-xs p-1 sm:p-2 h-auto flex flex-col"
                variant="outline"
              >
                <span>精灵球</span>
                <span className="text-xs text-gray-500">∞</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
