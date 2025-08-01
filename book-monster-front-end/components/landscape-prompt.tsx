"use client"

import { useEffect, useState } from "react"
import { Maximize, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function LandscapePrompt() {
  const [showFullscreenTip, setShowFullscreenTip] = useState(false)
  const [hasShownTip, setHasShownTip] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight

      // 只在横屏且高度较小时显示全屏提示，不再强制横屏
      if (isLandscapeMode && window.innerHeight < 600 && !hasShownTip) {
        setTimeout(() => {
          setShowFullscreenTip(true)
        }, 2000) // 延迟2秒显示，给用户时间适应
      }
    }

    // 初始检查
    checkOrientation()

    // 监听屏幕方向变化
    window.addEventListener("resize", checkOrientation)
    window.addEventListener("orientationchange", () => {
      setTimeout(checkOrientation, 100)
    })

    return () => {
      window.removeEventListener("resize", checkOrientation)
      window.removeEventListener("orientationchange", checkOrientation)
    }
  }, [hasShownTip])

  const requestFullscreen = async () => {
    try {
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
      setShowFullscreenTip(false)
      setHasShownTip(true)
    } catch (error) {
      console.log("Fullscreen request failed:", error)
    }
  }

  const dismissTip = () => {
    setShowFullscreenTip(false)
    setHasShownTip(true)
  }

  // 只显示全屏提示，不再显示横屏强制提示
  if (showFullscreenTip) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9998] p-4">
        <Card className="w-full max-w-md text-center bg-white relative">
          <Button
            onClick={dismissTip}
            className="absolute top-2 right-2 w-6 h-6 p-0 bg-gray-200 hover:bg-gray-300 text-gray-600"
            variant="ghost"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-center">
              <Maximize className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-800">建议全屏游玩</h2>
              <p className="text-gray-600 text-sm">全屏模式可以获得更好的游戏体验</p>
              <p className="text-gray-500 text-xs">
                全屏按钮位于屏幕右上角 <Maximize className="w-3 h-3 inline" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={requestFullscreen} className="flex-1 bg-green-600 hover:bg-green-700">
                <Maximize className="w-4 h-4 mr-2" />
                立即全屏
              </Button>
              <Button onClick={dismissTip} variant="outline" className="flex-1 bg-transparent">
                稍后
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
