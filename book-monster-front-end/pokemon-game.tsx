"use client"

import { useState, useCallback } from "react"
import { PokemonSidebar } from "./components/pokemon-sidebar"
import { CreatePokemonDialog } from "./components/create-pokemon-dialog"
import { BattleScreen } from "./components/battle-screen"
import { CaptureSuccess } from "./components/capture-success"
import type { Pokemon, Skill, BattleState, CreatePokemonData } from "./types/game"

// 模拟API调用
const generatePokemon = async (data: CreatePokemonData): Promise<Pokemon> => {
  // 这里应该调用你的大模型API
  const response = await fetch("/api/generate-pokemon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    // 模拟生成神奇宝贝
    return {
      id: Date.now().toString(),
      name: data.title,
      level: Math.floor(Math.random() * 50) + 1,
      hp: 100,
      maxHp: 100,
      image: `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(data.title + " pokemon")}`,
      skills: [
        { id: "1", name: "撞击", damage: 20, description: "用身体撞击对手" },
        { id: "2", name: "叫声", damage: 0, description: "降低对手攻击力" },
        { id: "3", name: "电击", damage: 30, description: "用电流攻击对手" },
        { id: "4", name: "治愈", damage: -20, description: "恢复自己的HP" },
      ],
      description: data.description,
    }
  }

  return response.json()
}

const generateEnemyPokemon = (): Pokemon => {
  const names = ["皮卡丘", "小火龙", "杰尼龟", "妙蛙种子", "波波"]
  const name = names[Math.floor(Math.random() * names.length)]

  return {
    id: "enemy-" + Date.now(),
    name,
    level: Math.floor(Math.random() * 30) + 10,
    hp: 80,
    maxHp: 80,
    image: `/placeholder.svg?height=128&width=128&query=${encodeURIComponent(name + " pokemon")}`,
    skills: [
      { id: "e1", name: "撞击", damage: 15, description: "用身体撞击对手" },
      { id: "e2", name: "抓挠", damage: 18, description: "用爪子抓挠对手" },
    ],
  }
}

export default function PokemonGame() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [capturedPokemon, setCapturedPokemon] = useState<Pokemon | null>(null)

  const [battleState, setBattleState] = useState<BattleState>({
    playerPokemon: null,
    enemyPokemon: null,
    currentTurn: "player",
    battleLog: [],
    isAnimating: false,
    gamePhase: "menu",
  })

  const handleCreatePokemon = useCallback(async (data: CreatePokemonData) => {
    try {
      const newPokemon = await generatePokemon(data)
      setPokemons((prev) => [...prev, newPokemon])
    } catch (error) {
      console.error("Failed to create pokemon:", error)
    }
  }, [])

  const startBattle = useCallback((playerPokemon: Pokemon) => {
    const enemyPokemon = generateEnemyPokemon()
    setBattleState({
      playerPokemon: { ...playerPokemon },
      enemyPokemon,
      currentTurn: "player",
      battleLog: [`${playerPokemon.name} 进入战斗！`, `野生的 ${enemyPokemon.name} 出现了！`],
      isAnimating: false,
      gamePhase: "battle",
    })
  }, [])

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
        battleLog: [...prev.battleLog, playerLog],
        currentTurn: "enemy",
      }))

      // 检查敌方是否被击败
      if (newEnemyHp <= 0) {
        setTimeout(() => {
          setBattleState((prev) => ({
            ...prev,
            battleLog: [...prev.battleLog, `${prev.enemyPokemon?.name} 被击败了！`],
            isAnimating: false,
          }))
        }, 1000)
        return
      }

      // 敌方回合
      setTimeout(async () => {
        if (!battleState.playerPokemon || !battleState.enemyPokemon) return

        // 这里应该调用你的AI API来决定敌方行动
        const enemySkill =
          battleState.enemyPokemon.skills[Math.floor(Math.random() * battleState.enemyPokemon.skills.length)]
        const newPlayerHp = Math.max(0, battleState.playerPokemon.hp - enemySkill.damage)

        setBattleState((prev) => ({
          ...prev,
          playerPokemon: prev.playerPokemon ? { ...prev.playerPokemon, hp: newPlayerHp } : null,
          battleLog: [...prev.battleLog, `${prev.enemyPokemon?.name} 使用了 ${enemySkill.name}！`],
          currentTurn: "player",
          isAnimating: false,
        }))

        if (newPlayerHp <= 0) {
          setBattleState((prev) => ({
            ...prev,
            battleLog: [...prev.battleLog, `${prev.playerPokemon?.name} 被击败了！`],
            gamePhase: "menu",
          }))
        }
      }, 1500)
    },
    [battleState],
  )

  const handleUsePokeball = useCallback(() => {
    if (!battleState.enemyPokemon) return

    const captureSuccess = Math.random() > 0.3 // 70% 成功率

    if (captureSuccess) {
      const capturedPokemon = { ...battleState.enemyPokemon }
      setPokemons((prev) => [...prev, capturedPokemon])
      setCapturedPokemon(capturedPokemon)
      setBattleState((prev) => ({ ...prev, gamePhase: "capture" }))
    } else {
      setBattleState((prev) => ({
        ...prev,
        battleLog: [...prev.battleLog, "精灵球摇了几下后打开了..."],
      }))
    }
  }, [battleState.enemyPokemon])

  const handleBackToMenu = useCallback(() => {
    setBattleState({
      playerPokemon: null,
      enemyPokemon: null,
      currentTurn: "player",
      battleLog: [],
      isAnimating: false,
      gamePhase: "menu",
    })
    setCapturedPokemon(null)
  }, [])

  if (battleState.gamePhase === "capture" && capturedPokemon) {
    return <CaptureSuccess pokemon={capturedPokemon} onConfirm={handleBackToMenu} />
  }

  if (battleState.gamePhase === "battle") {
    return (
      <div className="h-screen flex">
        <BattleScreen
          battleState={battleState}
          onUseSkill={handleUseSkill}
          onUseItem={() => {}}
          onUsePokeball={handleUsePokeball}
          onBackToMenu={handleBackToMenu}
        />
      </div>
    )
  }

  return (
    <div className="h-screen flex">
      <PokemonSidebar
        pokemons={pokemons}
        selectedPokemon={selectedPokemon}
        onCreateClick={() => setShowCreateDialog(true)}
        onSelectPokemon={(pokemon) => {
          setSelectedPokemon(pokemon)
          startBattle(pokemon)
        }}
      />

      <div className="flex-1 bg-gradient-to-b from-sky-200 to-green-200 flex items-center justify-center">
        {pokemons.length === 0 ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-700 mb-4">神奇宝贝对战游戏</h1>
            <p className="text-gray-600">点击左侧的加号创建你的第一只神奇宝贝！</p>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-700 mb-4">选择神奇宝贝开始战斗</h1>
            <p className="text-gray-600">点击左侧的神奇宝贝开始对战</p>
          </div>
        )}
      </div>

      <CreatePokemonDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreatePokemon={handleCreatePokemon}
      />
    </div>
  )
}
