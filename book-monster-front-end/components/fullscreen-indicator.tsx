"use client"

import { useEffect, useState } from "react"
import { Maximize, Minimize } from "lucide-react"

export function FullscreenIndicator() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )

      setIsFullscreen(isCurrentlyFullscreen)

      // 显示状态变化指示器
      setShowIndicator(true)
      setTimeout(() => setShowIndicator(false), 2000)
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

  if (!showIndicator) return null

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-out">
      {isFullscreen ? (
        <>
          <Minimize className="w-5 h-5" />
          <span>已进入全屏模式</span>
        </>
      ) : (
        <>
          <Maximize className="w-5 h-5" />
          <span>已退出全屏模式</span>
        </>
      )}
    </div>
  )
}
