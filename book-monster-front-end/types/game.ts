export interface Pokemon {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  image: string
  skills: Skill[]
  status?: string
  description?: string
  stats: PokemonStats
  isPlayerOwned: boolean
}

export interface PokemonStats {
  attack: number
  defense: number
  speed: number
  hp: number
  special: number
  accuracy: number
}

export interface Skill {
  id: string
  name: string
  damage: number
  description: string
  remainingUses: number
  maxUses: number
}

export interface Item {
  id: string
  name: string
  description: string
  remainingUses: number
  maxUses: number
}

export interface Player {
  id: string
  name: string
  gender: "male" | "female"
  description: string
  avatar: string
}

export interface BattleField {
  id: string
  name: string
  image: string
  description: string
}

export interface BattleState {
  playerPokemon: Pokemon | null
  enemyPokemon: Pokemon | null
  currentTurn: "player" | "enemy"
  battleLog: string[]
  isAnimating: boolean
  gamePhase: "initial" | "menu" | "battle" | "capture" | "victory" | "defeat" | "congratulations"
  selectedField: BattleField
  items: Item[]
  battleResult?: "win" | "lose" | "capture"
}

export interface CreatePokemonData {
  title: string
  description: string
  pdfFile?: File
  imageFile?: File
}

export type MusicType = "battle-start" | "winning" | "losing" | "victory"
