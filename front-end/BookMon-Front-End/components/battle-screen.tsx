"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BattleMenuFloat } from "./battle-menu-float"
import { SpeechBubble } from "./speech-bubble"
import { BattleLogPanel } from "./battle-log-panel"
import { MusicManager } from "./music-manager"
import type { Skill, BattleState, MusicType } from "@/types/game"

interface BattleScreenProps {
  battleState: BattleState
  onUseSkill: (skill: Skill, answerIndex: number) => void
  onUseItem: (itemId: string) => void
  onUsePokeball: () => void
  onBackToMenu: () => void
  onRestart: () => void
  onEnemyAttack: () => void
  currentMusic?: MusicType | null
  musicVolume?: number
  onVolumeChange?: (volume: number) => void
}

export function BattleScreen({
  battleState,
  onUseSkill,
  onUseItem,
  onUsePokeball,
  onBackToMenu,
  onRestart,
  onEnemyAttack,
  currentMusic,
  musicVolume = 0.5,
  onVolumeChange,
}: BattleScreenProps) {
  const [playerShaking, setPlayerShaking] = useState(false)
  const [enemyShaking, setEnemyShaking] = useState(false)
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null) // 跟踪玩家选择的答案
  const [showResult, setShowResult] = useState(false) // 控制是否显示结果颜色

  // 气泡状态管理
  const [enemyBubble, setEnemyBubble] = useState<{
    message: string
    isVisible: boolean
    type: "question" | "result" | "none"
  }>({
    message: "",
    isVisible: false,
    type: "none",
  })

  const [playerBubble, setPlayerBubble] = useState<{
    message: string
    isVisible: boolean
  }>({
    message: "",
    isVisible: false,
  })

  // 战斗开始时的初始化
  useEffect(() => {
    if (
      battleState.gamePhase === "battle" &&
      battleState.playerBookMonster &&
      battleState.enemyBookMonster &&
      battleState.battleLog.length === 2 &&
      battleState.currentTurn === "enemy"
    ) {
      const timer = setTimeout(() => {
        onEnemyAttack()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [battleState.gamePhase, battleState.battleLog.length, battleState.currentTurn, onEnemyAttack])

  // 监听当前问题变化，显示问题气泡
  useEffect(() => {
    if (battleState.currentQuestion && battleState.currentTurn === "player") {
      const questionText = `${battleState.currentQuestion.content}\n\n请选择正确的应对方式：\nA. ${battleState.currentQuestion.answers[0]}\nB. ${battleState.currentQuestion.answers[1]}\nC. ${battleState.currentQuestion.answers[2]}\nD. ${battleState.currentQuestion.answers[3]}\n\n选择错误将受到${battleState.currentQuestion.difficulty}点伤害！`

      setEnemyBubble({
        message: questionText,
        isVisible: true,
        type: "question",
      })

      // 重置选择状态
      setSelectedAnswerIndex(null)
      setShowResult(false)
    } else {
      setEnemyBubble({
        message: "",
        isVisible: false,
        type: "none",
      })
      setSelectedAnswerIndex(null)
      setShowResult(false)
    }
  }, [battleState.currentQuestion, battleState.currentTurn])

  useEffect(() => {
    if (battleState.isAnimating) {
      if (battleState.currentTurn === "enemy") {
        setPlayerShaking(true)
        setTimeout(() => setPlayerShaking(false), 500)
      } else {
        setEnemyShaking(true)
        setTimeout(() => setEnemyShaking(false), 500)
      }
    }
  }, [battleState.isAnimating, battleState.currentTurn])

  // 处理玩家技能使用
  const handlePlayerSkill = (skill: Skill, answerIndex: number) => {
    if (!battleState.currentQuestion) return

    console.log("Player selected answer:", answerIndex, "Correct answer:", battleState.currentQuestion.correctAnswer)

    // 1. 记录玩家选择并显示结果
    setSelectedAnswerIndex(answerIndex)
    setShowResult(true)

    // 2. 立即隐藏敌方问题气泡
    setEnemyBubble({
      message: "",
      isVisible: false,
      type: "none",
    })

    // 3. 显示玩家技能气泡
    setPlayerBubble({
      message: `使用${skill.name}！`,
      isVisible: true,
    })

    // 4. 延迟调用技能处理函数，让用户看到颜色变化
    setTimeout(() => {
      onUseSkill(skill, answerIndex)
    }, 1000)

    // 5. 2.5秒后隐藏玩家气泡和重置选择
    setTimeout(() => {
      setPlayerBubble({
        message: "",
        isVisible: false,
      })
      setSelectedAnswerIndex(null)
      setShowResult(false)
    }, 2500)
  }

  // 处理道具使用
  const handleUseItem = (itemId: string) => {
    if (!battleState.currentQuestion) return

    setEnemyBubble({
      message: "",
      isVisible: false,
      type: "none",
    })

    const item = battleState.items.find((i) => i.id === itemId)
    if (item) {
      setPlayerBubble({
        message: `使用${item.name}！`,
        isVisible: true,
      })
    }

    onUseItem(itemId)

    setTimeout(() => {
      setPlayerBubble({
        message: "",
        isVisible: false,
      })
    }, 1500)
  }

  // 处理精灵球使用
  const handleUsePokeball = () => {
    setEnemyBubble({
      message: "",
      isVisible: false,
      type: "none",
    })

    setPlayerBubble({
      message: "使用精灵球！",
      isVisible: true,
    })

    onUsePokeball()

    setTimeout(() => {
      setPlayerBubble({
        message: "",
        isVisible: false,
      })
    }, 1500)
  }

  // 处理逃跑
  const handleRunAway = () => {
    setPlayerBubble({
      message: "逃跑了！",
      isVisible: true,
    })

    setTimeout(() => {
      setPlayerBubble({
        message: "",
        isVisible: false,
      })
      onBackToMenu()
    }, 1500)
  }

  const handlePlayerBubbleComplete = () => {
    setPlayerBubble({
      message: "",
      isVisible: false,
    })
  }

  const handleEnemyBubbleComplete = () => {
    if (enemyBubble.type === "result") {
      setEnemyBubble({
        message: "",
        isVisible: false,
        type: "none",
      })
    }
  }

  if (!battleState.playerBookMonster || !battleState.enemyBookMonster) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Button onClick={onBackToMenu}>返回主菜单</Button>
      </div>
    )
  }

  const { playerBookMonster, enemyBookMonster } = battleState

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* 音量控制 - 移到屏幕上方中间 */}
      <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={onVolumeChange} inBattle={true} />

      {/* 圆形浮窗菜单 */}
      <BattleMenuFloat onRestart={onRestart} onExit={onBackToMenu} />

      {/* 背景图片 */}
      <img
        src={battleState.selectedField.image || "/placeholder.svg"}
        alt="Battle Field"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 敌方书籍怪兽 - 调整位置，避免被音量控制遮挡 */}
      <div className="absolute top-16 sm:top-20 right-4 sm:right-8 landscape:right-12 max-w-[45%] landscape:max-w-[35%]">
        <div className="text-center relative">
          <Card className="mb-1 sm:mb-2 bg-white/90">
            <CardContent className="p-1.5 sm:p-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold">{enemyBookMonster.name}</span>
                <span>Lv.{enemyBookMonster.level}</span>
              </div>
              {enemyBookMonster.attribute && (
                <div className="text-xs text-center text-purple-600 font-medium">{enemyBookMonster.attribute}属性</div>
              )}
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1">
                <div
                  className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all"
                  style={{ width: `${(enemyBookMonster.hp / enemyBookMonster.maxHp) * 100}%` }}
                />
              </div>
              <div className="text-xs text-right mt-1">
                {enemyBookMonster.hp}/{enemyBookMonster.maxHp} HP
              </div>
              {enemyBookMonster.healthState && (
                <div className="text-xs text-blue-600 mt-1">{enemyBookMonster.healthState}</div>
              )}
            </CardContent>
          </Card>

          <div className="relative flex justify-center">
            <div className="relative">
              <img
                src={enemyBookMonster.image || "/placeholder.svg"}
                alt={enemyBookMonster.name}
                className={`w-20 h-20 sm:w-32 sm:h-32 object-contain transition-transform ${
                  enemyShaking ? "animate-bounce" : ""
                }`}
              />

              {/* 敌方气泡 - 问题或结果 */}
              <SpeechBubble
                message={enemyBubble.message}
                isVisible={enemyBubble.isVisible}
                position="left"
                autoHide={false}
                onComplete={handleEnemyBubbleComplete}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 玩家书籍怪兽 - 调整位置给底栏留出更多空间 */}
      <div className="absolute bottom-40 sm:bottom-48 left-4 sm:left-8 landscape:left-12 max-w-[45%] landscape:max-w-[35%]">
        <div className="text-center relative">
          <img
            src={playerBookMonster.image || "/placeholder.svg"}
            alt={playerBookMonster.name}
            className={`w-20 h-20 sm:w-32 sm:h-32 object-contain transition-transform ${
              playerShaking ? "animate-bounce" : ""
            }`}
          />

          <SpeechBubble
            message={playerBubble.message}
            isVisible={playerBubble.isVisible}
            position="right"
            autoHide={true}
            hideDelay={1500}
            onComplete={handlePlayerBubbleComplete}
          />

          <Card className="mt-1 sm:mt-2 bg-white/90">
            <CardContent className="p-1.5 sm:p-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold">{playerBookMonster.name}</span>
                <span>Lv.{playerBookMonster.level}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1">
                <div
                  className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all"
                  style={{ width: `${(playerBookMonster.hp / playerBookMonster.maxHp) * 100}%` }}
                />
              </div>
              <div className="text-xs text-right mt-1">
                {playerBookMonster.hp}/{playerBookMonster.maxHp} HP
              </div>
              {playerBookMonster.status && (
                <div className="text-xs text-purple-600 mt-1">{playerBookMonster.status}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部对话框和选项 - 增加高度 */}
      <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-48 bg-amber-100 border-t-4 border-amber-800">
        <div className="flex h-full">
          {/* 战斗日志面板 - 缩小宽度 */}
          <div className="w-48 sm:w-56 flex-shrink-0">
            <BattleLogPanel
              logs={battleState.battleLog.slice().reverse().slice(0, 4).reverse()}
              isAnimating={battleState.isAnimating}
            />
          </div>

          {/* 技能选项区域 - 扩大空间 */}
          <div className="flex-1 p-2 sm:p-3">
            <div className="h-full flex flex-col gap-2">
              {/* 4个技能按钮 - 2x2布局，显示答案选项 */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                {battleState.currentQuestion?.answers.slice(0, 4).map((answer, index) => {
                  const optionLabel = ["A", "B", "C", "D"][index]
                  const isCorrect = (index + 1).toString() === battleState.currentQuestion?.correctAnswer
                  const isSelected = selectedAnswerIndex === index
                  const hasSelected = selectedAnswerIndex !== null && showResult

                  // 创建一个虚拟技能对象用于显示
                  const virtualSkill: Skill = {
                    id: `answer_${index}`,
                    name: answer,
                    damage: Number.parseInt(battleState.currentQuestion?.difficulty || "20"),
                    description: `选择答案: ${answer}`,
                    remainingUses: 1,
                    maxUses: 1,
                  }

                  // 颜色逻辑：
                  // 1. 未选择时：所有选项都是普通颜色
                  // 2. 选择后：错误选项变红，正确选项变绿
                  let buttonClasses = "h-full flex flex-col justify-center p-2 text-left transition-all duration-300"

                  if (hasSelected) {
                    if (isSelected && !isCorrect) {
                      // 选中的错误答案 - 红色
                      buttonClasses += " bg-red-100 border-red-400 ring-2 ring-red-400 text-red-800 hover:bg-red-100"
                    } else if (isCorrect) {
                      // 正确答案 - 绿色（无论是否被选中）
                      buttonClasses +=
                        " bg-green-100 border-green-400 ring-2 ring-green-400 text-green-800 hover:bg-green-100"
                    } else {
                      // 其他选项保持普通颜色但稍微变暗
                      buttonClasses += " bg-gray-100 border-gray-300 text-gray-600"
                    }
                  } else {
                    // 未选择时的普通颜色
                    buttonClasses += " bg-white hover:bg-gray-50 border-gray-200"
                  }

                  return (
                    <Button
                      key={index}
                      onClick={() => handlePlayerSkill(virtualSkill, index)}
                      disabled={
                        battleState.currentTurn !== "player" ||
                        battleState.isAnimating ||
                        !battleState.currentQuestion ||
                        hasSelected
                      }
                      className={buttonClasses}
                      variant="outline"
                    >
                      <div className="w-full">
                        <div className="font-semibold text-sm sm:text-base mb-1 leading-tight break-words">
                          {optionLabel}. {answer}
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          威力: {battleState.currentQuestion?.difficulty || 20}
                        </div>
                        <div className="text-xs text-gray-500 leading-tight break-words line-clamp-2">
                          选择这个答案来应对敌方的问题攻击
                        </div>
                        {hasSelected && isCorrect && (
                          <div className="text-xs text-green-600 font-bold mt-1">✓ 正确答案</div>
                        )}
                        {hasSelected && isSelected && !isCorrect && (
                          <div className="text-xs text-red-600 font-bold mt-1">✗ 错误选择</div>
                        )}
                      </div>
                    </Button>
                  )
                }) || (
                  // 如果没有当前问题，显示等待状态
                  <div className="col-span-2 flex items-center justify-center text-gray-500">等待敌方行动...</div>
                )}
              </div>

              {/* 底部操作按钮 - 精灵球和逃跑 */}
              <div className="flex gap-2 h-12">
                <Button
                  onClick={handleUsePokeball}
                  disabled={
                    battleState.currentTurn !== "player" ||
                    battleState.isAnimating ||
                    !enemyBookMonster ||
                    enemyBookMonster.hp <= 0
                  }
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold"
                  variant="default"
                >
                  <span className="text-sm">🥎 精灵球</span>
                </Button>
                <Button
                  onClick={handleRunAway}
                  disabled={battleState.currentTurn !== "player" || battleState.isAnimating}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold"
                  variant="default"
                >
                  <span className="text-sm">💨 逃跑</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 调试信息 */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed top-20 left-4 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
          <div>当前回合: {battleState.currentTurn}</div>
          <div>敌方气泡: {enemyBubble.type}</div>
          <div>当前问题: {battleState.currentQuestion?.content || "无"}</div>
          <div>正确答案: {battleState.currentQuestion?.correctAnswer || "无"}</div>
          <div>选中答案: {selectedAnswerIndex !== null ? selectedAnswerIndex + 1 : "无"}</div>
          <div>显示结果: {showResult ? "是" : "否"}</div>
          <div>Monster ID: {enemyBookMonster.monsterId || "无"}</div>
          <div>属性: {enemyBookMonster.attribute || "无"}</div>
          <div>等待玩家: {battleState.currentQuestion ? "是" : "否"}</div>
        </div>
      )}
    </div>
  )
}
