"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FullscreenManagerProps {
  children: React.ReactNode
}

export function FullscreenManager({ children }: FullscreenManagerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [canFullscreen, setCanFullscreen] = useState(false)

  useEffect(() => {
    // 检查是否支持全屏API
    const checkFullscreenSupport = () => {
      return !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
      )
    }

    setCanFullscreen(checkFullscreenSupport())

    // 监听全屏状态变化
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // 进入全屏
        const element = document.documentElement
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen()
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen()
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen()
        }
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (error) {
      console.log("Fullscreen toggle failed:", error)
    }
  }

  return (
    <div className="game-container relative">
      {/* 全屏按钮 - 确保在所有页面都显示 */}
      <Button
        onClick={toggleFullscreen}
        className="fixed top-2 right-2 z-[9999] w-10 h-10 p-0 bg-black/70 hover:bg-black/90 text-white border-none rounded-full shadow-lg"
        variant="ghost"
        size="sm"
        title={isFullscreen ? "退出全屏" : "进入全屏"}
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </Button>

      {/* 全屏状态指示器 */}
      {isFullscreen && (
        <div className="fixed top-14 right-2 z-[9998] bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg">
          全屏模式
        </div>
      )}

      {children}
    </div>
  )
}
