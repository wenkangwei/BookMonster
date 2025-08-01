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
import type { Pokemon, Skill, BattleState, CreatePokemonData, Player, BattleField, Item, MusicType } from "@/types/game"
import { FullscreenDemo } from "./fullscreen-demo"

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

// 模拟API调用生成敌方神奇宝贝
const generateEnemyPokemon = async (data: CreatePokemonData): Promise<Pokemon> => {
  const response = await fetch("/api/generate-pokemon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    // 模拟生成敌方神奇宝贝
    return {
      id: Date.now().toString(),
      name: data.title,
      level: Math.floor(Math.random() * 50) + 1,
      hp: 100,
      maxHp: 100,
      image: data.imageFile
        ? URL.createObjectURL(data.imageFile)
        : `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(data.title + " pokemon")}`,
      skills: [
        { id: "1", name: "撞击", damage: 20, description: "用身体撞击对手", remainingUses: 35, maxUses: 35 },
        { id: "2", name: "叫声", damage: 0, description: "降低对手攻击力", remainingUses: 40, maxUses: 40 },
        {
          id: "3",
          name: "特殊攻击",
          damage: 35,
          description: "基于描述生成的特殊技能",
          remainingUses: 15,
          maxUses: 15,
        },
        { id: "4", name: "防御", damage: 0, description: "提高自己的防御力", remainingUses: 20, maxUses: 20 },
      ],
      stats: {
        attack: Math.floor(Math.random() * 50) + 30,
        defense: Math.floor(Math.random() * 50) + 30,
        speed: Math.floor(Math.random() * 50) + 30,
        hp: 100,
        special: Math.floor(Math.random() * 50) + 30,
        accuracy: Math.floor(Math.random() * 20) + 70,
      },
      description: data.description,
      isPlayerOwned: false,
    }
  }

  return response.json()
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
    currentTurn: "player",
    battleLog: [],
    isAnimating: false,
    gamePhase: "initial",
    selectedField: BATTLE_FIELDS[0],
    items: DEFAULT_ITEMS,
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
      // 按F键显示全屏测试
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
      const newEnemyPokemon = await generateEnemyPokemon(data)
      setEnemyPokemons((prev) => [...prev, newEnemyPokemon])
    } catch (error) {
      console.error("Failed to create enemy pokemon:", error)
    }
  }, [])

  const startBattle = useCallback(
    (enemyPokemon: Pokemon) => {
      if (!playerPokemon) return

      setBattleState({
        playerPokemon: { ...playerPokemon },
        enemyPokemon: { ...enemyPokemon },
        currentTurn: "player",
        battleLog: [`${playerPokemon.name} 进入战斗！`, `野生的 ${enemyPokemon.name} 出现了！`],
        isAnimating: false,
        gamePhase: "battle",
        selectedField,
        items: DEFAULT_ITEMS,
      })
      setGamePhase("battle")
    },
    [playerPokemon, selectedField],
  )

  const handleUseSkill = useCallback(
    async (skill: Skill) => {
      if (!battleState.playerPokemon || !battleState.enemyPokemon) return

      setBattleState((prev) => ({ ...prev, isAnimating: true }))

      // 玩家回合
      const newEnemyHp = Math.max(0, battleState.enemyPokemon.hp - skill.damage)
      const playerLog = `${battleState.playerPokemon.name} 使用了 ${skill.name}！`

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
      }))

      // 检查敌方是否被击败
      if (newEnemyHp <= 0) {
        setTimeout(() => {
          setBattleState((prev) => ({
            ...prev,
            battleLog: [`${prev.enemyPokemon?.name} 被击败了！`, ...prev.battleLog],
            isAnimating: false,
            battleResult: "win",
          }))
          setGamePhase("victory")
        }, 1000)
        return
      }

      // 敌方回合
      setTimeout(async () => {
        if (!battleState.playerPokemon || !battleState.enemyPokemon) return

        const enemySkill =
          battleState.enemyPokemon.skills[Math.floor(Math.random() * battleState.enemyPokemon.skills.length)]
        const newPlayerHp = Math.max(0, battleState.playerPokemon.hp - enemySkill.damage)

        setBattleState((prev) => ({
          ...prev,
          playerPokemon: prev.playerPokemon ? { ...prev.playerPokemon, hp: newPlayerHp } : null,
          battleLog: [`${prev.enemyPokemon?.name} 使用了 ${enemySkill.name}！`, ...prev.battleLog],
          currentTurn: "player",
          isAnimating: false,
        }))

        if (newPlayerHp <= 0) {
          setBattleState((prev) => ({
            ...prev,
            battleLog: [`${prev.playerPokemon?.name} 被击败了！`, ...prev.battleLog],
            battleResult: "lose",
          }))
          setTimeout(() => setGamePhase("defeat"), 1000)
        }
      }, 1500)
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

      setBattleState((prev) => ({
        ...prev,
        playerPokemon: prev.playerPokemon ? { ...prev.playerPokemon, hp: newHp } : null,
        battleLog: [`使用了${item.name}！${prev.playerPokemon?.name}恢复了${healAmount}点HP！`, ...prev.battleLog],
        items: prev.items.map((i) => (i.id === itemId ? { ...i, remainingUses: i.remainingUses - 1 } : i)),
      }))
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
      }))
    }
  }, [battleState.enemyPokemon])

  const handleBackToMenu = useCallback(() => {
    setGamePhase("menu")
    setCapturedPokemon(null)
    setBattleState((prev) => ({ ...prev, battleResult: undefined }))
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
    setBattleState((prev) => ({ ...prev, battleResult: undefined }))
  }, [playerPokemon])

  if (gamePhase === "initial") {
    return (
      <ResponsiveLayout className="h-full">
        <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={setMusicVolume} />
        <InitialPokemonSelection onSelectPokemon={handleSelectInitialPokemon} />
      </ResponsiveLayout>
    )
  }

  if (gamePhase === "capture" && capturedPokemon) {
    return (
      <ResponsiveLayout className="h-full">
        <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={setMusicVolume} />
        <CaptureSuccess pokemon={capturedPokemon} onConfirm={handleBackToMenu} />
      </ResponsiveLayout>
    )
  }

  if (gamePhase === "battle") {
    return (
      <ResponsiveLayout className="h-full">
        <MusicManager currentMusic={currentMusic} volume={musicVolume} onVolumeChange={setMusicVolume} />
        <div className="h-full w-full flex">
          <BattleScreen
            battleState={battleState}
            onUseSkill={handleUseSkill}
            onUseItem={handleUseItem}
            onUsePokeball={handleUsePokeball}
            onBackToMenu={handleBackToMenu}
            onRestart={handleRestart}
          />
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout className="h-full">
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

      {/* 游戏结果界面 */}
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
