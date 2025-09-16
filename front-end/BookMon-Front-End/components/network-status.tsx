"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)
  const [aiApiStatus, setAiApiStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")
  const [isClient, setIsClient] = useState(false)
  const [showAiStatus, setShowAiStatus] = useState(false)

  useEffect(() => {
    // 标记为客户端渲染
    setIsClient(true)

    // 检测浏览器网络状态
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    // 只在客户端添加事件监听器
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      // 初始检测
      setIsOnline(navigator.onLine)
    }

    // 检测AI API连接状态
    const checkAiApi = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const response = await fetch("http://localhost:8000/generate_bookmonster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "test", description: "test", pdf_path: "", images: [], is_player: false }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        setAiApiStatus("connected")
        setShowAiStatus(true)
        // 连接成功时3秒后隐藏
        setTimeout(() => setShowAiStatus(false), 3000)
      } catch (error) {
        setAiApiStatus("disconnected")
        setShowAiStatus(true)
        // 连接失败时3秒后隐藏
        setTimeout(() => setShowAiStatus(false), 3000)
      }
    }

    // 延迟检测AI API，避免影响页面加载
    const timer = setTimeout(checkAiApi, 2000)

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
      clearTimeout(timer)
    }
  }, [])

  // 在服务端渲染时不显示任何内容
  if (!isClient) {
    return null
  }

  // 只在需要显示状态时才渲染
  if (!showStatus && isOnline && !showAiStatus) return null

  return (
    <div className="fixed top-16 right-4 z-40">
      <Card className="bg-white/95 backdrop-blur shadow-lg border-2">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm">
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-600 font-medium">网络连接断开</span>
              </>
            ) : showAiStatus && aiApiStatus === "disconnected" ? (
              <>
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-orange-600 font-medium">AI服务离线，使用本地模式</span>
              </>
            ) : showAiStatus && aiApiStatus === "connected" ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">AI服务已连接</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-blue-500" />
                <span className="text-blue-600 font-medium">网络已连接</span>
              </>
            )}
          </div>
          {showAiStatus && aiApiStatus === "disconnected" && (
            <div className="text-xs text-gray-600 mt-1">游戏将使用本地数据正常运行</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
