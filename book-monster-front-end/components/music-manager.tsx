"use client"

import { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MusicType } from "@/types/game"

interface MusicManagerProps {
  currentMusic: MusicType | null
  volume?: number
  onVolumeChange?: (volume: number) => void
}

const MUSIC_FILES: Record<MusicType, string> = {
  "battle-start": "/audio/battle-start.mp3",
  winning: "/audio/winning.mp3",
  losing: "/audio/losing.mp3",
  victory: "/audio/victory.mp3",
}

export function MusicManager({ currentMusic, volume = 0.5, onVolumeChange }: MusicManagerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(volume)

  useEffect(() => {
    if (currentMusic && MUSIC_FILES[currentMusic]) {
      // 停止当前音乐
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      // 创建新的音频实例
      audioRef.current = new Audio(MUSIC_FILES[currentMusic])
      audioRef.current.volume = isMuted ? 0 : currentVolume
      audioRef.current.loop = currentMusic === "battle-start" || currentMusic === "winning" || currentMusic === "losing"

      // 播放音乐
      audioRef.current.play().catch((error) => {
        console.log("Audio play failed:", error)
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [currentMusic, currentVolume, isMuted])

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : currentVolume
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setCurrentVolume(newVolume)
    onVolumeChange?.(newVolume)
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/90 rounded-lg p-2 shadow-lg">
      <Button variant="ghost" size="sm" onClick={toggleMute}>
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={currentVolume}
        onChange={(e) => handleVolumeChange(Number.parseFloat(e.target.value))}
        className="w-20"
      />
    </div>
  )
}
