"use client"

import { useEffect } from "react"

export function ViewportManager() {
  useEffect(() => {
    // 设置动态视口高度和自动缩放
    const setVHAndScale = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty("--vh", `${vh}px`)

      // 计算缩放因子
      let scaleFactor = 1
      const width = window.innerWidth
      const height = window.innerHeight
      const isLandscape = width > height

      if (isLandscape) {
        // 横屏模式下的自动缩放
        if (height < 400) {
          scaleFactor = Math.max(0.7, height / 500)
        } else if (height < 500) {
          scaleFactor = Math.max(0.8, height / 600)
        } else if (height < 600) {
          scaleFactor = Math.max(0.9, height / 700)
        }

        // 考虑宽度因素
        if (width < 800) {
          scaleFactor = Math.min(scaleFactor, width / 900)
        }
      } else {
        // 竖屏模式下的缩放
        if (width < 400) {
          scaleFactor = Math.max(0.8, width / 500)
        }
      }

      // 确保缩放因子在合理范围内
      scaleFactor = Math.max(0.6, Math.min(1, scaleFactor))

      document.documentElement.style.setProperty("--scale-factor", scaleFactor.toString())
    }

    // 初始设置
    setVHAndScale()

    // 监听窗口大小变化
    const handleResize = () => {
      setVHAndScale()
    }

    // 监听方向变化
    const handleOrientationChange = () => {
      // 延迟执行，等待浏览器完成方向切换
      setTimeout(() => {
        setVHAndScale()
      }, 100)
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleOrientationChange)

    // 页面可见性变化时重新计算（解决iOS Safari问题）
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(setVHAndScale, 100)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleOrientationChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return null
}
