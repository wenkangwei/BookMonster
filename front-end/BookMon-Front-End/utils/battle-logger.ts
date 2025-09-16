export interface BattleLogEntry {
  timestamp: string
  type: "player" | "enemy" | "system"
  pokemon: string
  action: string
  details?: string
  damage?: number
}

class BattleLogger {
  private logs: BattleLogEntry[] = []
  private logFileName = ""
  private isClient = false

  constructor() {
    // 检查是否在客户端环境
    this.isClient = typeof window !== "undefined"
  }

  // 初始化日志文件
  initBattle(playerPokemon: string, enemyPokemon: string) {
    if (!this.isClient) return

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    this.logFileName = `battle_${playerPokemon}_vs_${enemyPokemon}_${timestamp}.log`
    this.logs = []

    this.addLog({
      timestamp: new Date().toISOString(),
      type: "system",
      pokemon: "System",
      action: `战斗开始: ${playerPokemon} vs ${enemyPokemon}`,
    })
  }

  // 添加日志条目
  addLog(entry: BattleLogEntry) {
    if (!this.isClient) return

    this.logs.push(entry)
    this.saveToFile()
  }

  // 添加玩家动作日志
  logPlayerAction(pokemon: string, skillName: string, damage: number, target: string) {
    if (!this.isClient) return

    this.addLog({
      timestamp: new Date().toISOString(),
      type: "player",
      pokemon,
      action: `使用技能: ${skillName}`,
      details: `对 ${target} 造成 ${damage} 点伤害`,
      damage,
    })
  }

  // 添加敌方动作日志
  logEnemyAction(pokemon: string, skillName: string, damage: number, target: string) {
    if (!this.isClient) return

    this.addLog({
      timestamp: new Date().toISOString(),
      type: "enemy",
      pokemon,
      action: `使用技能: ${skillName}`,
      details: `对 ${target} 造成 ${damage} 点伤害`,
      damage,
    })
  }

  // 添加系统日志
  logSystemEvent(event: string) {
    if (!this.isClient) return

    this.addLog({
      timestamp: new Date().toISOString(),
      type: "system",
      pokemon: "System",
      action: event,
    })
  }

  // 保存到文件
  private saveToFile() {
    if (!this.isClient) return

    try {
      const logContent = this.logs
        .map((log) => {
          const time = new Date(log.timestamp).toLocaleString()
          const details = log.details ? ` - ${log.details}` : ""
          return `[${time}] [${log.type.toUpperCase()}] ${log.pokemon}: ${log.action}${details}`
        })
        .join("\n")

      // 保存到本地存储，以便后续访问
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(`battle_log_${this.logFileName}`, logContent)
      }
    } catch (error) {
      console.error("保存日志文件失败:", error)
    }
  }

  // 获取所有日志
  getLogs(): BattleLogEntry[] {
    return [...this.logs]
  }

  // 获取最近的日志
  getRecentLogs(count = 5): BattleLogEntry[] {
    return this.logs.slice(-count)
  }

  // 导出日志文件
  exportLogs() {
    if (!this.isClient) return

    const logContent = this.logs
      .map((log) => {
        const time = new Date(log.timestamp).toLocaleString()
        const details = log.details ? ` - ${log.details}` : ""
        return `[${time}] [${log.type.toUpperCase()}] ${log.pokemon}: ${log.action}${details}`
      })
      .join("\n")

    const blob = new Blob([logContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = this.logFileName
    a.click()
    URL.revokeObjectURL(url)
  }
}

// 创建全局日志实例
export const battleLogger = new BattleLogger()
