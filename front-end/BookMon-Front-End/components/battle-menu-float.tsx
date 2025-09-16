"use client"

import { useState } from "react"
import { Menu, RotateCcw, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BattleMenuFloatProps {
  onRestart: () => void
  onExit: () => void
}

export function BattleMenuFloat({ onRestart, onExit }: BattleMenuFloatProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed top-4 left-4 z-40">
      {/* 圆形菜单按钮 */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
        size="sm"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* 展开的菜单选项 */}
      {isOpen && (
        <Card className="absolute top-14 left-0 w-48 bg-white/95 shadow-xl">
          <CardContent className="p-2 space-y-2">
            <Button
              onClick={() => {
                onRestart()
                setIsOpen(false)
              }}
              variant="outline"
              className="w-full justify-start"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重新开始
            </Button>
            <Button
              onClick={() => {
                onExit()
                setIsOpen(false)
              }}
              variant="outline"
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出游戏
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
