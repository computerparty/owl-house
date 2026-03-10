'use client'

import { useEffect, useRef } from 'react'
import { OwlStatus } from '@/types'

const AUDIO_MAP: Record<OwlStatus, string> = {
  YES: '/audio/owl-yes.mp3',
  NO: '/audio/owl-no.mp3',
  MISTY: '/audio/owl-misty.mp3',
}

export function useOwlAudio(status: OwlStatus | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!status) return

    const src = AUDIO_MAP[status]

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = src
    } else {
      audioRef.current = new Audio(src)
    }

    audioRef.current.loop = true
    audioRef.current.volume = 0.5

    // Fade in
    audioRef.current.volume = 0
    audioRef.current.play().catch(() => {
      // Autoplay blocked — user must interact first; we'll handle this in UI
    })

    const audio = audioRef.current
    let vol = 0
    const fadeIn = setInterval(() => {
      vol = Math.min(vol + 0.05, 0.5)
      audio.volume = vol
      if (vol >= 0.5) clearInterval(fadeIn)
    }, 50)

    return () => {
      clearInterval(fadeIn)
    }
  }, [status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  function unlock() {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {})
    }
  }

  return { unlock }
}
