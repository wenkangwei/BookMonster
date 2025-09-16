"use client"

import { useState, useCallback, useEffect } from "react"
import { ResponsiveLayout } from "./responsive-layout"
import { InitialPokemonSelection } from "./initial-pokemon-selection"
import { GameSidebar } from "./game-sidebar"
import { CreatePokemonDialog } from "./create-pokemon-dialog"
import { BattleScreen } from "./battle-screen"
import { CaptureSuccess } from "./capture-success"
import { MusicManager } from "./music-manager"
import { GameResultScreen } from "./game-result-screen"
import type {
  Pokemon,
  Skill,
  BattleState,
  CreatePokemonData,
  Player,
  BattleField,
  Item,
  MusicType,
  EnemyActionResponse,
} from "@/types/game"
import { FullscreenDemo } from "./fullscreen-demo"
import { battleLogger } from "@/utils/battle-logger"
import { NetworkStatus } from "./network-status"

const DEFAULT_PLAYER: Player = {
  id: "player-1",
  name: "小智",
  gender: "male",
  description: "来自真新镇的神奇宝贝训练师，梦想成为神奇宝贝大师！",
  avatar: "/placeholder.svg?height=64&width=64",
}

const BATTLE_FIELDS: BattleField[] = [
  {
    id: "field-1",
    name: "草原",
    image: "/placeholder.svg?height=400&width=800",
    description: "绿意盎然的草原，适合草系神奇宝贝",
  },
  {
    id: "field-2",
    name: "海滩",
    image: "/placeholder.svg?height=400&width=800",
    description: "波光粼粼的海滩，适合水系神奇宝贝",
  },
  {
    id: "field-3",
    name: "火山",
    image: "/placeholder.svg?height=400&width=800",
    description: "炽热的火山地带，适合火系神奇宝贝",
  },
]

const DEFAULT_ITEMS: Item[] = [
  {
    id: "potion",
    name: "药水",
    description: "恢复神奇宝贝20点HP",
    remainingUses: 5,
    maxUses: 5,
  },
  {
    id: "super-potion",
    name: "超级药水",
    description: "恢复神奇宝贝50点HP",
    remainingUses: 3,
    maxUses: 3,
  },
]

// 调用大模型API生成敌方神奇宝贝
const generateEnemyPokemon = async (data: CreatePokemonData): Promise<Pokemon> => {
  try {
    const formData = new FormData()
    formData.append("title", data.title)
    formData.append("description", data.description)

    if (data.pdfFile) {
      formData.append("pdfFile", data.pdfFile)
    }

    if (data.imageFile) {
      formData.append("imageFile", data.imageFile)
    }

    console.log("Calling generate-pokemon API...")
    const response = await fetch("/api/generate-pokemon", {
      method: "POST",
      body: formData,
    })

    console.log("API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error:", errorText)
      throw new Error(`API returned ${response.status}: ${errorText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text()
      console.error("Non-JSON response:", responseText)
      throw new Error("API did not return JSON")
    }

    const pokemon = await response.json()
    console.log("Generated pokemon:", pokemon)
    return pokemon
  } catch (error) {
    console.error("Error in generateEnemyPokemon:", error)
    throw error
  }
}

// 调用AI获取战斗决策
const getAIBattleDecision = async (
  enemyPokemon: Pokemon,
  playerPokemon: Pokemon,
  battleContext: string,
  usedQuestionIds: string[] = [],
): Promise<EnemyActionResponse> => {
  try {
    console.log("Calling AI battle decision API...")
    const response = await fetch("/api/ai-battle-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enemyPokemon,
        playerPokemon,
        battleContext,
        usedQuestionIds,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("AI API Error:", errorText)
      throw new Error(`AI API returned ${response.status}: ${errorText}`)
    }

    const decision = await response.json()
    console.log("AI Decision:", decision)
    return decision
  } catch (error) {
    console.error("Error in getAIBattleDecision:", error)
    throw error
  }
}

export default function PokemonGame() {
  const [gamePhase, setGamePhase] = useState<
    "initial" | "menu" | "battle" | "capture" | "defeat" | "victory" | "congratulations"
  >("initial")
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null)
  const [capturedPokemons, setCapturedPokemons] = useState<Pokemon[]>([])
  const [enemyPokemons, setEnemyPokemons] = useState<Pokemon[]>([])
  const [player, setPlayer] = useState<Player>(DEFAULT_PLAYER)
  const [selectedField, setSelectedField] = useState<BattleField>(BATTLE_FIELDS[0])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [capturedPokemon, setCapturedPokemon] = useState<Pokemon | null>(null)
  const [currentMusic, setCurrentMusic] = useState<MusicType | null>(null)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [showFullscreenDemo, setShowFullscreenDemo] = useState(false)

  const [battleState, setBattleState] = useState<BattleState>({
    playerPokemon: null,
    enemyPokemon: null,
    currentTurn: "enemy",
    battleLog: [],
    isAnimating: false,
    gamePhase: "initial",
    selectedField: BATTLE_FIELDS[0],
    items: DEFAULT_ITEMS,
    usedQuestionIds: [], // 跟踪已使用的问题ID
  })

  // 音乐管理逻辑
  useEffect(() => {
    if (gamePhase === "battle" && battleState.playerPokemon && battleState.enemyPokemon) {
      const playerHpRatio = battleState.playerPokemon.hp / battleState.playerPokemon.maxHp
      const enemyHpRatio = battleState.enemyPokemon.hp / battleState.enemyPokemon.maxHp

      if (playerHpRatio > enemyHpRatio) {
        setCurrentMusic("winning")
      } else if (playerHpRatio < enemyHpRatio) {
        setCurrentMusic("losing")
      } else {
        setCurrentMusic("battle-start")
      }
    } else if (gamePhase === "victory" || gamePhase === "congratulations") {
      setCurrentMusic("victory")
    } else if (gamePhase === "defeat") {
      setCurrentMusic("victory")
    } else if (gamePhase === "battle") {
      setCurrentMusic("battle-start")
    } else {
      setCurrentMusic(null)
    }
  }, [gamePhase, battleState.playerPokemon, battleState.enemyPokemon])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        setShowFullscreenDemo(!showFullscreenDemo)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [showFullscreenDemo])

  const handleSelectInitialPokemon = useCallback((pokemon: Pokemon) => {
    setPlayerPokemon(pokemon)
    setGamePhase("menu")
  }, [])

  const handleCreateEnemyPokemon = useCallback(async (data: CreatePokemonData) => {
    try {
      console.log("Creating enemy pokemon:", data.title)
      const newEnemyPokemon = await generateEnemyPokemon(data)
      console.log("Successfully created:", newEnemyPokemon.name)
      setEnemyPokemons((prev) => [...prev, newEnemyPokemon])

      // 显示成功消息
      console.log(`✅ 成功创建敌方神奇宝贝: ${newEnemyPokemon.name}`)
    } catch (error) {
      console.error("Failed to create enemy pokemon:", error)

      // 不显示错误弹窗，因为API内部已经有后备机制
      // 只在控制台记录错误，用户界面会显示创建的角色
      if (error instanceof Error && error.message.includes("fetch")) {
        console.log("⚠️ 网络连接失败，但已使用本地数据创建角色")
      } else {
        console.log("⚠️ 创建过程中出现问题，但已使用后备数据创建角色")
      }
    }
  }, [])

  const startBattle = useCallback(
    (enemyPokemon: Pokemon) => {
      if (!playerPokemon) return

      console.log("Starting battle:", playerPokemon.name, "vs", enemyPokemon.name)

      battleLogger.initBattle(playerPokemon.name, enemyPokemon.name)

      setBattleState({
        playerPokemon: { ...playerPokemon },
        enemyPokemon: { ...enemyPokemon },
        currentTurn: "enemy",
        battleLog: [`${playerPokemon.name} 进入战斗！`, `野生的 ${enemyPokemon.name} 出现了！`],
        isAnimating: false,
        gamePhase: "battle",
        selectedField,
        items: DEFAULT_ITEMS,
        usedQuestionIds: [], // 重置已使用问题ID
      })
      setGamePhase("battle")
    },
    [playerPokemon, selectedField],
  )

  // 敌方攻击处理 - 调用AI决策API
  const handleEnemyAttack = useCallback(async () => {
    if (!battleState.playerPokemon || !battleState.enemyPokemon) return

    console.log("Enemy attacks with AI decision!")
    setBattleState((prev) => ({ ...prev, isAnimating: true }))

    try {
      const aiDecision = await getAIBattleDecision(
        battleState.enemyPokemon,
        battleState.playerPokemon,
        `当前战斗情况：玩家${battleState.playerPokemon.name}剩余HP ${battleState.playerPokemon.hp}/${battleState.playerPokemon.maxHp}，敌方${battleState.enemyPokemon.name}剩余HP ${battleState.enemyPokemon.hp}/${battleState.enemyPokemon.maxHp}`,
        battleState.usedQuestionIds || [],
      )

      // 记录使用的问题ID
      const newUsedQuestionIds = [...(battleState.usedQuestionIds || []), aiDecision.tools.question_id]

      // 敌方发出攻击（问题），但不扣血，等待玩家回答
      setBattleState((prev) => ({
        ...prev,
        battleLog: [
          `AI_DECISION:${JSON.stringify(aiDecision)}`, // 特殊日志格式，用于传递AI决策数据
          `${prev.enemyPokemon?.name} 发出了问题攻击！`,
          ...prev.battleLog,
        ],
        currentTurn: "player", // 切换到玩家回合，等待玩家选择答案
        isAnimating: false,
        usedQuestionIds: newUsedQuestionIds, // 更新已使用问题ID
      }))

      battleLogger.logEnemyAction(
        battleState.enemyPokemon.name,
        aiDecision.tools.question,
        0, // 问题阶段不造成伤害
        battleState.playerPokemon.name,
      )
    } catch (error) {
      console.error("AI decision failed, using fallback:", error)

      // AI失败时的后备逻辑
      setBattleState((prev) => ({
        ...prev,
        battleLog: [`${prev.enemyPokemon?.name} 发出了攻击！`, ...prev.battleLog],
        currentTurn: "player",
        isAnimating: false,
      }))
    }
  }, [battleState])

  // 修改技能处理函数，接收是否正确答案的参数
  const handleUseSkill = useCallback(
    async (skill: Skill, isCorrectAnswer: boolean) => {
      if (!battleState.playerPokemon || !battleState.enemyPokemon) return

      console.log("Player uses skill:", skill.name, "Correct answer:", isCorrectAnswer)
      setBattleState((prev) => ({ ...prev, isAnimating: true }))

      if (isCorrectAnswer) {
        // 答对了：玩家不扣血，敌方扣血
        const newEnemyHp = Math.max(0, battleState.enemyPokemon.hp - skill.damage)
        const playerLog = `${battleState.playerPokemon.name} 使用了 ${skill.name}！答对了问题，对敌方造成了${skill.damage}点伤害！`

        battleLogger.logPlayerAction(
          battleState.playerPokemon.name,
          skill.name,
          skill.damage,
          battleState.enemyPokemon.name,
        )

        setBattleState((prev) => ({
          ...prev,
          enemyPokemon: prev.enemyPokemon ? { ...prev.enemyPokemon, hp: newEnemyHp } : null,
          battleLog: [playerLog, ...prev.battleLog],
          currentTurn: "enemy",
          playerPokemon: prev.playerPokemon
            ? {
                ...prev.playerPokemon,
                skills: prev.playerPokemon.skills.map((s) =>
                  s.id === skill.id ? { ...s, remainingUses: s.remainingUses - 1 } : s,
                ),
              }
            : null,
          isAnimating: false,
        }))

        // 检查敌方是否被击败
        if (newEnemyHp <= 0) {
          setTimeout(() => {
            battleLogger.logSystemEvent(`${battleState.enemyPokemon?.name} 被击败了！`)
            setBattleState((prev) => ({
              ...prev,
              battleLog: [`${prev.enemyPokemon?.name} 被击败了！`, ...prev.battleLog],
              battleResult: "win",
            }))
            setGamePhase("victory")
          }, 1000)
          return
        }
      } else {
        // 答错了：玩家扣血，敌方不扣血
        const enemyDamage = Math.floor(Math.random() * 25) + 15
        const newPlayerHp = Math.max(0, battleState.playerPokemon.hp - enemyDamage)
        const playerLog = `${battleState.playerPokemon.name} 使用了 ${skill.name}！答错了问题，受到了${enemyDamage}点伤害！`

        battleLogger.logPlayerAction(
          battleState.playerPokemon.name,
          skill.name,
          0, // 答错不造成伤害
          battleState.enemyPokemon.name,
        )

        setBattleState((prev) => ({
          ...prev,
          playerPokemon: prev.playerPokemon
            ? {
                ...prev.playerPokemon,
                hp: newPlayerHp,
                skills: prev.playerPokemon.skills.map((s) =>
                  s.id === skill.id ? { ...s, remainingUses: s.remainingUses - 1 } : s,
                ),
              }
            : null,
          battleLog: [playerLog, ...prev.battleLog],
          currentTurn: "enemy",
          isAnimating: false,
        }))

        // 检查玩家是否被击败
        if (newPlayerHp <= 0) {
          setTimeout(() => {
            battleLogger.logSystemEvent(`${battleState.playerPokemon?.name} 被击败了！`)
            setBattleState((prev) => ({
              ...prev,
              battleLog: [`${prev.playerPokemon?.name} 被击败了！`, ...prev.battleLog],
              battleResult: "lose",
            }))
            setGamePhase("defeat")
          }, 1000)
          return
        }
      }
    },
    [battleState],
  )

  const handleUseItem = useCallback(
    (itemId: string) => {
      if (!battleState.playerPokemon) return

      const item = battleState.items.find((i) => i.id === itemId)
      if (!item || item.remainingUses <= 0) return

      let healAmount = 0
      if (itemId === "potion") healAmount = 20
      if (itemId === "super-potion") healAmount = 50

      const newHp = Math.min(battleState.playerPokemon.maxHp, battleState.playerPokemon.hp + healAmount)

      // 使用道具通常不是正确答案，会受到敌方攻击
      const enemyDamage = Math.floor(Math.random() * 20) + 10
      const finalHp = Math.max(0, newHp - enemyDamage)

      setBattleState((prev) => ({
        ...prev,
        playerPokemon: prev.playerPokemon ? { ...prev.playerPokemon, hp: finalHp } : null,
        battleLog: [
          `使用了${item.name}！${prev.playerPokemon?.name}恢复了${healAmount}点HP，但因为答错问题受到了${enemyDamage}点伤害！`,
          ...prev.battleLog,
        ],
        items: prev.items.map((i) => (i.id === itemId ? { ...i, remainingUses: i.remainingUses - 1 } : i)),
        currentTurn: "enemy",
      }))

      if (finalHp <= 0) {
        setTimeout(() => {
          battleLogger.logSystemEvent(`${battleState.playerPokemon?.name} 被击败了！`)
          setBattleState((prev) => ({
            ...prev,
            battleLog: [`${prev.playerPokemon?.name} 被击败了！`, ...prev.battleLog],
            battleResult: "lose",
          }))
          setGamePhase("defeat")
        }, 1000)
      }
    },
    [battleState],
  )

  const handleUsePokeball = useCallback(() => {
    if (!battleState.enemyPokemon) return

    const captureSuccess = Math.random() > 0.3

    if (captureSuccess) {
      const capturedPokemon = { ...battleState.enemyPokemon, isPlayerOwned: true }
      setCapturedPokemons((prev) => [...prev, capturedPokemon])
      setCapturedPokemon(capturedPokemon)
      setBattleState((prev) => ({ ...prev, battleResult: "capture" }))
      setGamePhase("congratulations")
    } else {
      setBattleState((prev) => ({
        ...prev,
        battleLog: ["精灵球摇了几下后打开了...", ...prev.battleLog],
        currentTurn: "enemy",
      }))
    }
  }, [battleState.enemyPokemon])

  const handleBackToMenu = useCallback(() => {
    setGamePhase("menu")
    setCapturedPokemon(null)
    setBattleState((prev) => ({ ...prev, battleResult: undefined, usedQuestionIds: [] }))
  }, [])

  const handleRestart = useCallback(() => {
    if (playerPokemon) {
      const resetPokemon = {
        ...playerPokemon,
        hp: playerPokemon.maxHp,
        skills: playerPokemon.skills.map((skill) => ({ ...skill, remainingUses: skill.maxUses })),
      }
      setPlayerPokemon(resetPokemon)
    }
    setGamePhase("menu")
    setCapturedPokemon(null)
    setBattleState((prev) => ({ ...prev, battleResult: undefined, usedQuestionIds: [] }))
  }, [playerPokemon])

  if (gamePhase === "initial") {
    return (
      <ResponsiveLayout className="h-full">
        <NetworkStatus />
        <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={setMusicVolume} />
        <InitialPokemonSelection onSelectPokemon={handleSelectInitialPokemon} />
      </ResponsiveLayout>
    )
  }

  if (gamePhase === "capture" && capturedPokemon) {
    return (
      <ResponsiveLayout className="h-full">
        <NetworkStatus />
        <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={setMusicVolume} />
        <CaptureSuccess pokemon={capturedPokemon} onConfirm={handleBackToMenu} />
      </ResponsiveLayout>
    )
  }

  if (gamePhase === "battle") {
    return (
      <ResponsiveLayout className="h-full">
        <NetworkStatus />
        <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={setMusicVolume} />
        <div className="h-full w-full flex">
          <BattleScreen
            battleState={battleState}
            onUseSkill={handleUseSkill}
            onUseItem={handleUseItem}
            onUsePokeball={handleUsePokeball}
            onBackToMenu={handleBackToMenu}
            onRestart={handleRestart}
            onEnemyAttack={handleEnemyAttack}
          />
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout className="h-full">
      <NetworkStatus />
      <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={setMusicVolume} />
      <div className="h-full w-full flex">
        <GameSidebar
          playerPokemon={playerPokemon}
          capturedPokemons={capturedPokemons}
          enemyPokemons={enemyPokemons}
          player={player}
          battleFields={BATTLE_FIELDS}
          selectedField={selectedField}
          onCreateEnemyClick={() => setShowCreateDialog(true)}
          onSelectEnemyPokemon={startBattle}
          onSelectBattleField={setSelectedField}
          onEditPlayer={() => {}}
        />

        <div className="flex-1 bg-gradient-to-b from-sky-200 to-green-200 flex items-center justify-center p-2 portrait:p-4 landscape:p-2 min-w-0">
          <div className="text-center max-w-lg">
            <h1 className="text-xl portrait:text-3xl landscape:text-xl font-bold text-gray-700 mb-2 portrait:mb-4 landscape:mb-2">
              神奇宝贝对战游戏
            </h1>
            <p className="text-sm portrait:text-base landscape:text-sm text-gray-600 leading-relaxed">
              选择敌方神奇宝贝开始战斗，或创建新的敌方神奇宝贝！
            </p>
            {enemyPokemons.length === 0 && (
              <div className="mt-4 portrait:mt-6 landscape:mt-4 p-3 portrait:p-4 landscape:p-3 bg-white/80 rounded-lg">
                <p className="text-xs portrait:text-sm landscape:text-xs text-gray-600">
                  💡 提示：点击左侧的"创建敌方神奇宝贝"按钮来创建你的第一个对手！
                </p>
              </div>
            )}
          </div>
        </div>

        <CreatePokemonDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreatePokemon={handleCreateEnemyPokemon}
        />
      </div>

      {(gamePhase === "defeat" || gamePhase === "victory" || gamePhase === "congratulations") && (
        <GameResultScreen
          result={gamePhase === "defeat" ? "lose" : gamePhase === "congratulations" ? "capture" : "win"}
          capturedPokemon={gamePhase === "congratulations" ? capturedPokemon : undefined}
          onContinue={handleBackToMenu}
          onRestart={handleRestart}
        />
      )}
      {showFullscreenDemo && <FullscreenDemo />}
    </ResponsiveLayout>
  )
}
