"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { ViewportManager } from "./viewport-manager"
import { FullscreenManager } from "./fullscreen-manager"
import { FullscreenIndicator } from "./fullscreen-indicator"
import { LandscapePrompt } from "./landscape-prompt"

interface ResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveLayout({ children, className = "" }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }

    checkDevice()

    // 阻止默认的触摸行为
    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    // 阻止双击缩放
    const preventDoubleClick = (e: Event) => {
      e.preventDefault()
    }

    if (isMobile) {
      document.addEventListener("touchstart", preventDefaultTouch, { passive: false })
      document.addEventListener("dblclick", preventDoubleClick)
    }

    return () => {
      document.removeEventListener("touchstart", preventDefaultTouch)
      document.removeEventListener("dblclick", preventDoubleClick)
    }
  }, [isMobile])

  return (
    <>
      <ViewportManager />
      <FullscreenManager>
        <FullscreenIndicator />
        {/* 只显示全屏提示，不再强制横屏 */}
        <LandscapePrompt />
        <div className={`${isMobile ? "landscape-optimized" : ""} w-full h-full ${className}`}>{children}</div>
      </FullscreenManager>
    </>
  )
}
