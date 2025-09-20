"use client"

import { useState, useCallback, useEffect } from "react"
import { ResponsiveLayout } from "./responsive-layout"
import { InitialBookMonsterSelection } from "./initial-bookmonster-selection"
import { GameSidebar } from "./game-sidebar"
import { CreateBookMonsterDialog } from "./create-bookmonster-dialog"
import { BattleScreen } from "./battle-screen"
import { CaptureSuccess } from "./capture-success"
import { MusicManager } from "./music-manager"
import { GameResultScreen } from "./game-result-screen"
import { TrainerProfileDialog } from "./trainer-profile-dialog"
import type {
  BookMonster,
  Skill,
  BattleState,
  CreateBookMonsterData,
  Player,
  BattleField,
  Item,
  MusicType,
} from "@/types/game"
import { FullscreenDemo } from "./fullscreen-demo"
import { battleLogger } from "@/utils/battle-logger"
import { NetworkStatus } from "./network-status"
import { GameApiService } from "@/services/api"

const DEFAULT_PLAYER: Player = {
  id: "player-1",
  name: "小智",
  gender: "male",
  description: "来自真新镇的书籍怪兽训练师，梦想成为书籍怪兽大师！",
  avatar: "/placeholder.svg?height=64&width=64",
}

const BATTLE_FIELDS: BattleField[] = [
  {
    id: "field-1",
    name: "草原",
    image: "/field_images/grassland.png?height=400&width=800",
    description: "绿意盎然的草原，适合草系书籍怪兽",
  },
  {
    id: "field-2",
    name: "海滩",
    image: "/field_images/beach.png?height=400&width=800",
    description: "波光粼粼的海滩，适合水系书籍怪兽",
  },
  {
    id: "field-3",
    name: "火山",
    image: "/field_images/volcano.png?height=400&width=800",
    description: "炽热的火山地带，适合火系书籍怪兽",
  },
]

const DEFAULT_ITEMS: Item[] = [
  {
    id: "potion",
    name: "药水",
    description: "恢复书籍怪兽20点HP",
    remainingUses: 5,
    maxUses: 5,
  },
  {
    id: "super-potion",
    name: "超级药水",
    description: "恢复书籍怪兽50点HP",
    remainingUses: 3,
    maxUses: 3,
  },
]

export default function BookMonsterGame() {
  const [gamePhase, setGamePhase] = useState<
    "initial" | "menu" | "battle" | "capture" | "defeat" | "victory" | "congratulations"
  >("initial")
  const [playerWin, setplayerWin] = useState<true | false>(false)
  const [playerBookMonster, setPlayerBookMonster] = useState<BookMonster | null>(null)
  const [capturedBookMonsters, setCapturedBookMonsters] = useState<BookMonster[]>([])
  const [enemyBookMonsters, setEnemyBookMonsters] = useState<BookMonster[]>([])
  const [player, setPlayer] = useState<Player>(() => {
    // 从localStorage加载训练师信息
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trainer_profile")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (error) {
          console.error("Failed to parse saved trainer profile:", error)
        }
      }
    }
    return DEFAULT_PLAYER
  })
  const [selectedField, setSelectedField] = useState<BattleField>(BATTLE_FIELDS[0])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTrainerDialog, setShowTrainerDialog] = useState(false)
  const [capturedBookMonster, setCapturedBookMonster] = useState<BookMonster | null>(null)
  const [currentMusic, setCurrentMusic] = useState<MusicType | null>(null)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [showFullscreenDemo, setShowFullscreenDemo] = useState(false)

  const [battleState, setBattleState] = useState<BattleState>({
    playerBookMonster: null,
    enemyBookMonster: null,
    currentTurn: "enemy",
    battleLog: [],
    isAnimating: false,
    gamePhase: "initial",
    selectedField: BATTLE_FIELDS[0],
    items: DEFAULT_ITEMS,
    reply: "",
  })



 //请求已经创建的monster列表
 useEffect(() => {
  const fetchEnemyMonsters = async () => {
    const created_eneym_monster_response = await GameApiService.GetEnemyMonster()
    setEnemyBookMonsters(created_eneym_monster_response)  
  }

  fetchEnemyMonsters()
}, []) 
   



  // 音乐管理逻辑
  useEffect(() => {
    if (gamePhase === "battle" && battleState.playerBookMonster && battleState.enemyBookMonster) {
      const playerHpRatio = battleState.playerBookMonster.hp / battleState.playerBookMonster.maxHp
      const enemyHpRatio = battleState.enemyBookMonster.hp / battleState.enemyBookMonster.maxHp

      if (playerHpRatio > 0.3) {
        setCurrentMusic("winning")
      } else if (playerHpRatio < 0.3) {
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
  }, [gamePhase, battleState.playerBookMonster, battleState.enemyBookMonster])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        setShowFullscreenDemo(!showFullscreenDemo)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [showFullscreenDemo])

  const handleSelectInitialBookMonster = useCallback((bookMonster: BookMonster) => {
    setPlayerBookMonster(bookMonster)
    setGamePhase("menu")
  }, [])

  const handleCreateEnemyBookMonster = useCallback(async (data: CreateBookMonsterData) => {
    try {
      console.log("Creating enemy book monster:", data.title)
      const newEnemyBookMonster = await GameApiService.generateBookMonster(data)
      console.log("Successfully created:", newEnemyBookMonster.name)
      setEnemyBookMonsters((prev) => [...prev, newEnemyBookMonster])

      console.log(`✅ 成功创建敌方书籍怪兽: ${newEnemyBookMonster.name}`)
    } catch (error) {
      console.error("Failed to create enemy book monster:", error)

      if (error instanceof Error && error.message.includes("fetch")) {
        console.log("⚠️ 网络连接失败，但已使用本地数据创建角色")
      } else {
        console.log("⚠️ 创建过程中出现问题，但已使用后备数据创建角色")
      }
    }
  }, [])

  const startBattle = useCallback(
    (enemyBookMonster: BookMonster) => {
      if (!playerBookMonster) return

      console.log("Starting battle:", playerBookMonster.name, "vs", enemyBookMonster.name)

      battleLogger.initBattle(playerBookMonster.name, enemyBookMonster.name)

      setBattleState({
        playerBookMonster: { ...playerBookMonster },
        enemyBookMonster: { ...enemyBookMonster },
        currentTurn: "enemy",
        battleLog: [`${playerBookMonster.name} 进入战斗！`, `野生的 ${enemyBookMonster.name} 出现了！`],
        isAnimating: false,
        gamePhase: "battle",
        selectedField,
        items: DEFAULT_ITEMS,
      })
      setGamePhase("battle")
    },
    [playerBookMonster, selectedField],
  )

  // 敌方攻击处理 - 调用AI决策API
  const handleEnemyAttack = useCallback(async () => {
    if (!battleState.playerBookMonster || !battleState.enemyBookMonster) return

    console.log("Enemy attacks with AI decision!")
    setBattleState((prev) => ({ ...prev, isAnimating: true }))

    try {
      const aiDecision = await GameApiService.enemyAction({
        monster_id: battleState.enemyBookMonster.monsterId,
        current_hp: battleState.enemyBookMonster.hp,
        health_state: battleState.enemyBookMonster.healthState,
        player_monster_id: battleState.playerBookMonster.monsterId,
        player_hp: battleState.playerBookMonster.hp,
        player_state: battleState.playerBookMonster.healthState,
        player_win: playerWin, // 初始状态
      })

      // 设置当前问题信息
      setBattleState((prev) => ({
        ...prev,
        battleLog: [`${prev.enemyBookMonster?.name} 发出了问题攻击！`, ...prev.battleLog],
        currentTurn: "player",
        isAnimating: false,
        currentQuestion: {
          questionId: aiDecision.tools.question[0],
          content: aiDecision.tools.question[1],
          difficulty: aiDecision.tools.question[2],
          answers: [aiDecision.tools.answer1, aiDecision.tools.answer2, aiDecision.tools.answer3, aiDecision.tools.answer4],
          correctAnswer: aiDecision.tools.correct_answer,
        },
        reply: aiDecision.reply || "",
      }))

      battleLogger.logEnemyAction(
        battleState.enemyBookMonster.name,
        aiDecision.tools.question[1],
        0, // 问题阶段不造成伤害
        battleState.playerBookMonster.name,
      )
    } catch (error) {
      console.error("AI decision failed, using fallback:", error)

      // AI失败时的后备逻辑
      setBattleState((prev) => ({
        ...prev,
        battleLog: [`${prev.enemyBookMonster?.name} 发出了攻击！`, ...prev.battleLog],
        currentTurn: "player",
        isAnimating: false,
        currentQuestion: {
          questionId: "fallback",
          content: "如何应对这个攻击？",
          difficulty: "25",
          answers: ["防御", "闪避", "反击", "治疗"],
          correctAnswer: "1",
        },
      }))
    }
  }, [battleState])

  // 处理玩家技能使用
  const handleUseSkill = useCallback(
    async (skill: Skill, answerIndex: number) => {
      if (!battleState.playerBookMonster || !battleState.enemyBookMonster || !battleState.currentQuestion) return

      console.log("Player uses skill:", skill.name, "Answer index:", answerIndex)
      setBattleState((prev) => ({ ...prev, isAnimating: true }))

      const isCorrect = (answerIndex + 1).toString() === battleState.currentQuestion?.correctAnswer
      setplayerWin(isCorrect)
      if (isCorrect) {
        // 答对了：玩家不扣血，敌方扣血
        const damage = Number.parseInt(battleState.currentQuestion.difficulty) || 20
        const newEnemyHp = Math.max(0, battleState.enemyBookMonster.hp - damage)
        const playerLog = `${battleState.playerBookMonster.name} 使用了 ${skill.name}！答对了问题，对敌方造成了${damage}点伤害！`

        battleLogger.logPlayerAction(
          battleState.playerBookMonster.name,
          skill.name,
          damage,
          battleState.enemyBookMonster.name,
        )

        setBattleState((prev) => ({
          ...prev,
          enemyBookMonster: prev.enemyBookMonster ? { ...prev.enemyBookMonster, hp: newEnemyHp } : null,
          battleLog: [playerLog, ...prev.battleLog],
          currentTurn: "enemy",
          playerBookMonster: prev.playerBookMonster
            ? {
                ...prev.playerBookMonster,
                skills: prev.playerBookMonster.skills.map((s) =>
                  s.id === skill.id ? { ...s, remainingUses: s.remainingUses - 1 } : s,
                ),
              }
            : null,
          isAnimating: false,
          currentQuestion: undefined,
        }))

        // 检查敌方是否被击败
        if (newEnemyHp <= 0) {
          setTimeout(() => {
            battleLogger.logSystemEvent(`${battleState.enemyBookMonster?.name} 被击败了！`)
            setBattleState((prev) => ({
              ...prev,
              battleLog: [`${prev.enemyBookMonster?.name} 被击败了！`, ...prev.battleLog],
              battleResult: "win",
            }))
            setGamePhase("victory")
          }, 1000)
          return
        }
      } else {
        // 答错了：玩家扣血，敌方不扣血
        const damage = Number.parseInt(battleState.currentQuestion.difficulty) || 20
        const newPlayerHp = Math.max(0, battleState.playerBookMonster.hp - damage)
        const playerLog = `${battleState.playerBookMonster.name} 使用了 ${skill.name}！答错了问题，受到了${damage}点伤害！`

        battleLogger.logPlayerAction(
          battleState.playerBookMonster.name,
          skill.name,
          0, // 答错不造成伤害
          battleState.enemyBookMonster.name,
        )

        setBattleState((prev) => ({
          ...prev,
          playerBookMonster: prev.playerBookMonster
            ? {
                ...prev.playerBookMonster,
                hp: newPlayerHp,
                skills: prev.playerBookMonster.skills.map((s) =>
                  s.id === skill.id ? { ...s, remainingUses: s.remainingUses - 1 } : s,
                ),
              }
            : null,
          battleLog: [playerLog, ...prev.battleLog],
          currentTurn: "enemy",
          isAnimating: false,
          currentQuestion: undefined,
        }))

        // 检查玩家是否被击败
        if (newPlayerHp <= 0) {
          setTimeout(() => {
            battleLogger.logSystemEvent(`${battleState.playerBookMonster?.name} 被击败了！`)
            setBattleState((prev) => ({
              ...prev,
              battleLog: [`${prev.playerBookMonster?.name} 被击败了！`, ...prev.battleLog],
              battleResult: "lose",
            }))
            setGamePhase("defeat")
          }, 1000)
          return
        }
      }

      // 继续下一轮敌方攻击
      setTimeout(() => {
        handleEnemyAttack()
      }, 2000)
    },
    [battleState, handleEnemyAttack],
  )

  const handleUseItem = useCallback(
    (itemId: string) => {
      if (!battleState.playerBookMonster) return

      const item = battleState.items.find((i) => i.id === itemId)
      if (!item || item.remainingUses <= 0) return

      let healAmount = 0
      if (itemId === "potion") healAmount = 20
      if (itemId === "super-potion") healAmount = 50

      const newHp = Math.min(battleState.playerBookMonster.maxHp, battleState.playerBookMonster.hp + healAmount)

      // 使用道具通常不是正确答案，会受到敌方攻击
      const enemyDamage = Math.floor(Math.random() * 20) + 10
      const finalHp = Math.max(0, newHp - enemyDamage)

      setBattleState((prev) => ({
        ...prev,
        playerBookMonster: prev.playerBookMonster ? { ...prev.playerBookMonster, hp: finalHp } : null,
        battleLog: [
          `使用了${item.name}！${prev.playerBookMonster?.name}恢复了${healAmount}点HP，但因为答错问题受到了${enemyDamage}点伤害！`,
          ...prev.battleLog,
        ],
        items: prev.items.map((i) => (i.id === itemId ? { ...i, remainingUses: i.remainingUses - 1 } : i)),
        currentTurn: "enemy",
        currentQuestion: undefined,
      }))

      if (finalHp <= 0) {
        setTimeout(() => {
          battleLogger.logSystemEvent(`${battleState.playerBookMonster?.name} 被击败了！`)
          setBattleState((prev) => ({
            ...prev,
            battleLog: [`${prev.playerBookMonster?.name} 被击败了！`, ...prev.battleLog],
            battleResult: "lose",
          }))
          setGamePhase("defeat")
        }, 1000)
      } else {
        setTimeout(() => {
          handleEnemyAttack()
        }, 2000)
      }
    },
    [battleState, handleEnemyAttack],
  )

  const handleUsePokeball = useCallback((possbility: number ) => {
    if (!battleState.enemyBookMonster) return false

    const captureSuccess = Math.random() > possbility // 50%捕捉成功率

    if (captureSuccess) {
      const capturedBookMonster = { ...battleState.enemyBookMonster, isPlayerOwned: true }
      setCapturedBookMonsters((prev) => [...prev, capturedBookMonster])
      setCapturedBookMonster(capturedBookMonster)
      setBattleState((prev) => ({ ...prev, battleResult: "capture", currentQuestion: undefined }))
      setGamePhase("congratulations")

      return true
    } else {
      setBattleState((prev) => ({
        ...prev,
        battleLog: ["精灵球摇了几下后打开了...", ...prev.battleLog],
        currentTurn: "enemy",
        currentQuestion: undefined,
      }))
      setTimeout(() => {
        handleEnemyAttack()
      }, 2000)
    }
    return false
  }, [battleState.enemyBookMonster, handleEnemyAttack])

  const handleBackToMenu = useCallback(() => {
    setGamePhase("menu")
    setCapturedBookMonster(null)
    setBattleState((prev) => ({ ...prev, battleResult: undefined, currentQuestion: undefined }))
  }, [])

  const handleRestart = useCallback(() => {
    if (playerBookMonster) {
      const resetBookMonster = {
        ...playerBookMonster,
        hp: playerBookMonster.maxHp,
        skills: playerBookMonster.skills.map((skill) => ({ ...skill, remainingUses: skill.maxUses })),
      }
      setPlayerBookMonster(resetBookMonster)
    }
    setGamePhase("menu")
    setCapturedBookMonster(null)
    setBattleState((prev) => ({ ...prev, battleResult: undefined, currentQuestion: undefined }))
  }, [playerBookMonster])

  const handleSavePlayer = useCallback((updatedPlayer: Player) => {
    setPlayer(updatedPlayer)
  }, [])

  if (gamePhase === "initial") {
    return (
      <ResponsiveLayout className="h-full">
        <NetworkStatus />
        <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={setMusicVolume} />
        <InitialBookMonsterSelection onSelectBookMonster={handleSelectInitialBookMonster} />
      </ResponsiveLayout>
    )
  }

  if (gamePhase === "capture" && capturedBookMonster) {
    return (
      <ResponsiveLayout className="h-full">
        <NetworkStatus />
        <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={setMusicVolume} />
        <CaptureSuccess bookMonster={capturedBookMonster} onConfirm={handleBackToMenu} />
      </ResponsiveLayout>
    )
  }

  if (gamePhase === "battle") {
    return (
      <ResponsiveLayout className="h-full">
        <NetworkStatus />
        <div className="h-full w-full flex">
          <BattleScreen
            battleState={battleState}
            onUseSkill={handleUseSkill}
            onUseItem={handleUseItem}
            onUsePokeball={handleUsePokeball}
            onBackToMenu={handleBackToMenu}
            onRestart={handleRestart}
            onEnemyAttack={handleEnemyAttack}
            currentMusic={currentMusic}
            musicVolume={musicVolume}
            onVolumeChange={setMusicVolume}
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
          playerBookMonster={playerBookMonster}
          capturedBookMonsters={capturedBookMonsters}
          enemyBookMonsters={enemyBookMonsters}
          player={player}
          battleFields={BATTLE_FIELDS}
          selectedField={selectedField}
          onCreateEnemyClick={() => setShowCreateDialog(true)}
          onSelectEnemyBookMonster={startBattle}
          onSelectBattleField={setSelectedField}
          onEditPlayer={() => setShowTrainerDialog(true)}
        />

        <div className="flex-1 bg-gradient-to-b from-sky-200 to-green-200 flex items-center justify-center p-2 portrait:p-4 landscape:p-2 min-w-0">
          <div className="text-center max-w-lg">
            <h1 className="text-xl portrait:text-3xl landscape:text-xl font-bold text-gray-700 mb-2 portrait:mb-4 landscape:mb-2">
              书籍怪兽对战游戏
            </h1>
            <p className="text-sm portrait:text-base landscape:text-sm text-gray-600 leading-relaxed">
              选择敌方书籍怪兽开始战斗，或创建新的敌方书籍怪兽！
            </p>
            {enemyBookMonsters.length === 0 && (
              <div className="mt-4 portrait:mt-6 landscape:mt-4 p-3 portrait:p-4 landscape:p-3 bg-white/80 rounded-lg">
                <p className="text-xs portrait:text-sm landscape:text-xs text-gray-600">
                  💡 提示：点击左侧的"创建敌方书籍怪兽"按钮来创建你的第一个对手！
                </p>
              </div>
            )}
          </div>
        </div>

        <CreateBookMonsterDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateBookMonster={handleCreateEnemyBookMonster}
        />

        <TrainerProfileDialog
          open={showTrainerDialog}
          onOpenChange={setShowTrainerDialog}
          player={player}
          onSave={handleSavePlayer}
        />
      </div>

      {(gamePhase === "defeat" || gamePhase === "victory" || gamePhase === "congratulations") && (
        <GameResultScreen
          result={gamePhase === "defeat" ? "lose" : gamePhase === "congratulations" ? "capture" : "win"}
          capturedBookMonster={gamePhase === "congratulations" ? capturedBookMonster : undefined}
          onContinue={handleBackToMenu}
          onRestart={handleRestart}
        />
      )}
      {showFullscreenDemo && <FullscreenDemo />}
    </ResponsiveLayout>
  )
}
