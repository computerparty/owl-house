'use client'

import { useEffect, useRef } from 'react'
import { OwlStatus } from '@/types'

// Gameboy-style note frequencies — C minor pentatonic / Eb major
const N = {
  C2: 65.4, G2: 98.0,
  C3: 130.8, Eb3: 155.6, F3: 174.6, G3: 196.0, Ab3: 207.7, Bb3: 233.1,
  C4: 261.6, Eb4: 311.1, F4: 349.2, G4: 392.0, Ab4: 415.3, Bb4: 466.2,
  C5: 523.3, Eb5: 622.3,
}

// Ambient themes — slow, dreamy, gameboy-esque
// 0 = rest
const THEMES: Record<OwlStatus, {
  melody: number[]
  pad:    number[]
  bass:   number[]
  tempo:  number   // seconds per melody step
}> = {
  YES: {
    // Warm, hopeful — Eb major arpeggio, very slow and gentle
    melody: [N.Eb4, 0, N.G4, 0, N.Bb4, 0, N.G4, 0, N.Eb4, 0, N.C4, 0, N.G4, 0, 0, 0],
    pad:    [N.Eb3, 0, 0, 0, N.G3,  0, 0, 0],
    bass:   [N.C3,  0, 0, 0, N.Eb3, 0, 0, 0],
    tempo:  0.30,
  },
  NO: {
    // Hollow, lonely — Ab minor, sparse
    melody: [N.Ab3, 0, 0, 0, N.Eb3, 0, N.C3, 0, N.Bb3, 0, 0, 0, N.Ab3, 0, 0, 0],
    pad:    [N.Ab3, 0, 0, 0, N.Eb3, 0, 0, 0],
    bass:   [N.C3,  0, 0, 0, 0,     0, 0, 0],
    tempo:  0.38,
  },
  MISTY: {
    // Drifting, ambiguous — chromatic, very slow
    melody: [N.Ab3, 0, 0, 0, N.Bb3, 0, 0, 0, N.Ab3, 0, 0, 0, N.G3, 0, 0, 0],
    pad:    [N.Eb3, 0, 0, 0, N.F3,  0, 0, 0],
    bass:   [N.C3,  0, 0, 0, 0,     0, 0, 0],
    tempo:  0.46,
  },
}

function createDelay(ctx: AudioContext, master: GainNode) {
  const delay     = ctx.createDelay(2.0)
  const delayGain = ctx.createGain()
  const feedback  = ctx.createGain()

  delay.delayTime.value = 0.4
  delayGain.gain.value  = 0.18
  feedback.gain.value   = 0.32

  delay.connect(feedback)
  feedback.connect(delay)
  delay.connect(delayGain)
  delayGain.connect(master)

  return delay
}

export function useOwlAudio(status: OwlStatus | null) {
  const ctxRef     = useRef<AudioContext | null>(null)
  const masterRef  = useRef<GainNode | null>(null)
  const delayRef   = useRef<DelayNode | null>(null)
  const activeRef  = useRef(false)
  const melIdxRef  = useRef(0)
  const padIdxRef  = useRef(0)
  const bassIdxRef = useRef(0)
  const timersRef  = useRef<ReturnType<typeof setTimeout>[]>([])

  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      masterRef.current = ctxRef.current.createGain()
      masterRef.current.gain.value = 0
      masterRef.current.connect(ctxRef.current.destination)
      delayRef.current = createDelay(ctxRef.current, masterRef.current)
    }
    return ctxRef.current
  }

  function playTone(
    freq: number,
    duration: number,
    wave: OscillatorType,
    vol: number,
    sendDelay = false,
  ) {
    if (!freq) return
    const ctx = getCtx()
    if (!masterRef.current) return

    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = wave
    osc.frequency.value = freq

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.06)
    gain.gain.setTargetAtTime(0, ctx.currentTime + duration * 0.5, 0.12)

    osc.connect(gain)
    gain.connect(masterRef.current)
    if (sendDelay && delayRef.current) {
      gain.connect(delayRef.current)
    }

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration + 0.8)
  }

  function clearTimers() {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
  }

  useEffect(() => {
    if (!status) return

    activeRef.current = true
    melIdxRef.current  = 0
    padIdxRef.current  = 0
    bassIdxRef.current = 0
    const theme = THEMES[status]

    const ctx = getCtx()
    if (masterRef.current) {
      masterRef.current.gain.cancelScheduledValues(ctx.currentTime)
      masterRef.current.gain.setTargetAtTime(1, ctx.currentTime, 0.7)
    }

    function tickMel() {
      if (!activeRef.current) return
      const freq = theme.melody[melIdxRef.current % theme.melody.length]
      playTone(freq, theme.tempo * 2.0, 'square', 0.042, true)
      melIdxRef.current++
      timersRef.current.push(setTimeout(tickMel, theme.tempo * 1000))
    }

    function tickPad() {
      if (!activeRef.current) return
      const freq = theme.pad[padIdxRef.current % theme.pad.length]
      playTone(freq, theme.tempo * 4.0, 'triangle', 0.055, true)
      padIdxRef.current++
      timersRef.current.push(setTimeout(tickPad, theme.tempo * 2000))
    }

    function tickBass() {
      if (!activeRef.current) return
      const freq = theme.bass[bassIdxRef.current % theme.bass.length]
      playTone(freq, theme.tempo * 3.5, 'sine', 0.038)
      bassIdxRef.current++
      timersRef.current.push(setTimeout(tickBass, theme.tempo * 4000))
    }

    timersRef.current.push(setTimeout(tickMel,  80))
    timersRef.current.push(setTimeout(tickPad,  350))
    timersRef.current.push(setTimeout(tickBass, 700))

    return () => {
      activeRef.current = false
      clearTimers()
      if (masterRef.current && ctxRef.current) {
        masterRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.6)
      }
    }
  }, [status])

  useEffect(() => {
    return () => {
      activeRef.current = false
      clearTimers()
      ctxRef.current?.close()
    }
  }, [])

  function unlock() {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
  }

  return { unlock }
}
