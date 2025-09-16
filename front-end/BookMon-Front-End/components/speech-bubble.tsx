"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface SpeechBubbleProps {
  message: string
  isVisible: boolean
  position: "left" | "right"
  autoHide?: boolean
  hideDelay?: number
  onComplete?: () => void
  onTypingComplete?: () => void
}

export function SpeechBubble({
  message,
  isVisible,
  position,
  autoHide = true,
  hideDelay = 3000,
  onComplete,
  onTypingComplete,
}: SpeechBubbleProps) {
  const [displayedMessage, setDisplayedMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (isVisible && message) {
      setIsTyping(true)
      setDisplayedMessage("")

      // 打字机效果
      let index = 0
      const typingInterval = setInterval(() => {
        if (index < message.length) {
          setDisplayedMessage((prev) => prev + message[index])
          index++
        } else {
          clearInterval(typingInterval)
          setIsTyping(false)

          // 通知打字完成
          onTypingComplete?.()

          // 只有在autoHide为true时才自动消失
          if (autoHide) {
            setTimeout(() => {
              onComplete?.()
            }, hideDelay)
          }
        }
      }, 50) // 每50ms显示一个字符

      return () => clearInterval(typingInterval)
    } else {
      setDisplayedMessage("")
      setIsTyping(false)
    }
  }, [isVisible, message, onComplete, onTypingComplete, autoHide, hideDelay])

  if (!isVisible || !message) return null

  // 根据消息长度动态调整宽度
  const getWidth = () => {
    const messageLength = message.length
    if (messageLength <= 20) return "w-48 sm:w-56" // 短消息
    if (messageLength <= 40) return "w-56 sm:w-72" // 中等消息
    if (messageLength <= 80) return "w-72 sm:w-96" // 长消息
    return "w-80 sm:w-[28rem]" // 超长消息
  }

  // 根据屏幕方向调整最大宽度
  const getMaxWidth = () => {
    return "max-w-[85vw] landscape:max-w-[45vw]" // 竖屏85%，横屏45%
  }

  return (
    <div
      className={`absolute z-30 transition-all duration-300 ${
        position === "left"
          ? "right-full mr-2 sm:mr-4 top-1/2 -translate-y-1/2"
          : "left-full ml-2 sm:ml-4 top-1/2 -translate-y-1/2"
      } ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
    >
      <Card
        className={`relative bg-white/95 backdrop-blur shadow-lg border-2 border-gray-300 ${getWidth()} ${getMaxWidth()}`}
      >
        <CardContent className="p-3 sm:p-4">
          <p className="text-sm sm:text-base font-medium text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
            {displayedMessage}
            {isTyping && <span className="animate-pulse">|</span>}
          </p>
        </CardContent>

        {/* 气泡箭头 */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 ${
            position === "left"
              ? "right-0 -mr-2 border-t-[10px] border-b-[10px] border-l-[10px] border-t-transparent border-b-transparent border-l-white"
              : "left-0 -ml-2 border-t-[10px] border-b-[10px] border-r-[10px] border-t-transparent border-b-transparent border-r-white"
          }`}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 ${
            position === "left"
              ? "right-0 -mr-3 border-t-[11px] border-b-[11px] border-l-[11px] border-t-transparent border-b-transparent border-l-gray-300"
              : "left-0 -ml-3 border-t-[11px] border-b-[11px] border-r-[11px] border-t-transparent border-b-transparent border-r-gray-300"
          }`}
        />
      </Card>
    </div>
  )
}
