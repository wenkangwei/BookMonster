// 后端接口类型定义
export interface BackendMonsterState {
  monster_id: number
  monster_name: string
  monster_image: string
  attribute: string
  book_name: string
  book_id: string
  level: number
  exp: number
  maxHp: number
  currentHp: number
  attack: number
  defense: number
  speed: number
  skills?: BackendSkill[]
}

export interface BackendSkill {
  question: [string, string, string] // [question_id, content, difficulty]
  answer1: string
  answer2: string
  answer3: string
  answer4: string
  correct_answer: string // "1", "2", "3", "4"
}

// 初始化角色接口
export type InitMonsterRequest = {}

export interface InitMonsterResponse {
  monster: BackendMonsterState[]
}

// 生成角色接口
export interface GenerateBookMonsterRequest {
  pdf?: string
  image?: string
  description: string
  title: string
  is_player: boolean
}

export interface GenerateBookMonsterResponse extends BackendMonsterState {}

// 对战接口
export interface EnemyActionRequest {
  monster_id: number
  current_hp: number
  health_state: string
  player_monster_id: number
  player_hp: number
  player_state: string
  player_win: boolean
}

export interface EnemyActionResponse extends BackendSkill {}

// 前端游戏类型定义 - 改名为BookMonster
export interface BookMonster {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  image: string
  skills: Skill[]
  status?: string
  description?: string
  stats: BookMonsterStats
  isPlayerOwned: boolean
  // 后端相关字段
  monsterId: number
  attribute: string
  bookName?: string
  bookId?: string
  exp: number
  attack: number
  defense: number
  speed: number
  healthState: string
}

export interface BookMonsterStats {
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
  // 后端问题相关
  questionId?: string
  answers?: string[]
  correctAnswer?: string
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
  // 新增字段
  age?: number
  hometown?: string
  favoriteType?: string
  badges?: string[]
  achievements?: string[]
}

export interface BattleField {
  id: string
  name: string
  image: string
  description: string
}

export interface BattleState {
  playerBookMonster: BookMonster | null
  enemyBookMonster: BookMonster | null
  currentTurn: "player" | "enemy"
  battleLog: string[]
  isAnimating: boolean
  gamePhase: "initial" | "menu" | "battle" | "capture" | "victory" | "defeat" | "congratulations"
  selectedField: BattleField
  items: Item[]
  battleResult?: "win" | "lose" | "capture"
  // 当前问题信息
  currentQuestion?: {
    questionId: string
    content: string
    difficulty: string
    answers: string[]
    correctAnswer: string
  }
}

export interface CreateBookMonsterData {
  title: string
  description: string
  pdfFile?: File
  imageFile?: File
}

export type MusicType = "battle-start" | "winning" | "losing" | "victory"

// 文件类型
export interface File {
  name: string
  size: number
  type: string
  lastModified: number
}
