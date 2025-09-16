"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Maximize, Minimize, Monitor, Smartphone } from "lucide-react"

export function FullscreenDemo() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    availWidth: 0,
    availHeight: 0,
  })

  useEffect(() => {
    const updateScreenInfo = () => {
      setScreenInfo({
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
      })
    }

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    updateScreenInfo()
    window.addEventListener("resize", updateScreenInfo)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      window.removeEventListener("resize", updateScreenInfo)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
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
      console.error("Fullscreen toggle failed:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 z-[9997]">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isFullscreen ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            全屏功能测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${isFullscreen ? "text-green-600" : "text-orange-600"}`}>
              {isFullscreen ? "✅ 全屏模式" : "📱 窗口模式"}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>窗口宽度:</span>
              <span>{window.innerWidth}px</span>
            </div>
            <div className="flex justify-between">
              <span>窗口高度:</span>
              <span>{window.innerHeight}px</span>
            </div>
            <div className="flex justify-between">
              <span>屏幕宽度:</span>
              <span>{screenInfo.width}px</span>
            </div>
            <div className="flex justify-between">
              <span>屏幕高度:</span>
              <span>{screenInfo.height}px</span>
            </div>
          </div>

          <Button onClick={toggleFullscreen} className="w-full" size="lg">
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4 mr-2" />
                退出全屏
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4 mr-2" />
                进入全屏
              </>
            )}
          </Button>

          <div className="text-xs text-gray-600 text-center">
            {isFullscreen
              ? "现在您处于全屏模式，可以享受完整的游戏体验！"
              : "点击按钮进入全屏模式，或使用右上角的全屏按钮"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
