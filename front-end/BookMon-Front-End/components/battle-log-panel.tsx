"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { battleLogger } from "@/utils/battle-logger"

interface BattleLogPanelProps {
  logs: string[]
  isAnimating: boolean
}

export function BattleLogPanel({ logs, isAnimating }: BattleLogPanelProps) {
  const logContainerRef = useRef<HTMLDivElement>(null)

  // 自动滚动到最新日志
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  const handleExportLogs = () => {
    battleLogger.exportLogs()
  }

  const getLogTypeColor = (log: string) => {
    if (log.includes("使用了")) {
      if (log.includes("造成了") && log.includes("点伤害")) {
        return "text-red-600 font-medium" // 攻击日志
      }
      return "text-blue-600 font-medium" // 技能使用
    }
    if (log.includes("被击败了") || log.includes("失败")) {
      return "text-red-700 font-bold" // 失败/击败
    }
    if (log.includes("恢复了") || log.includes("治愈")) {
      return "text-green-600 font-medium" // 恢复
    }
    if (log.includes("进入战斗") || log.includes("出现了")) {
      return "text-purple-600 font-medium" // 战斗开始
    }
    return "text-gray-700" // 默认
  }

  return (
    <div className="h-full p-2">
      <div className="bg-white rounded-lg p-2 h-full flex flex-col">
        {/* 日志标题栏 - 紧凑设计 */}
        <div className="flex items-center justify-between mb-1 pb-1 border-b border-gray-200">
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">战斗日志</span>
          </div>
          <Button
            onClick={handleExportLogs}
            variant="outline"
            size="sm"
            className="text-xs px-1 py-0.5 h-auto bg-transparent"
          >
            <Download className="w-2 h-2 mr-0.5" />
            导出
          </Button>
        </div>

        {/* 日志内容 - 紧凑显示 */}
        <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-0.5 text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-2 text-xs">战斗日志...</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`transition-all duration-300 ${
                  index === logs.length - 1 && isAnimating ? "animate-pulse bg-yellow-50 px-1 py-0.5 rounded" : ""
                }`}
              >
                <p className={`${getLogTypeColor(log)} leading-tight`}>
                  <span className="text-gray-400 text-xs mr-1">[{new Date().toLocaleTimeString().slice(0, 5)}]</span>
                  <span className="break-words">{log}</span>
                </p>
              </div>
            ))
          )}
        </div>

        {/* 状态指示器 - 紧凑设计 */}
        {isAnimating && (
          <div className="mt-1 pt-1 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span>战斗中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
