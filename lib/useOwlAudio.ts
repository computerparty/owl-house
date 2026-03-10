'use client'

import { useEffect, useRef } from 'react'
import { OwlStatus } from '@/types'

// Frequencies (Hz) — C minor / Eb minor pentatonic for spooky atmosphere
const N = {
  C3: 130.8, Eb3: 155.6, F3: 174.6, G3: 196.0, Ab3: 207.7, Bb3: 233.1,
  C4: 261.6, Eb4: 311.1, F4: 349.2, G4: 392.0, Ab4: 415.3, Bb4: 466.2,
  C5: 523.3, Eb5: 622.3,
}

// Each theme: a looping note sequence + rhythm
const THEMES: Record<OwlStatus, {
  melody: number[]
  bass: number[]
  tempo: number       // seconds per step
  wave: OscillatorType
  bassWave: OscillatorType
  vol: number
}> = {
  YES: {
    // Warmer arpeggio — Eb major-ish, hopeful but still muted
    melody: [N.Eb4, N.G4, N.Bb4, N.G4, N.Eb4, N.C4, N.Eb4, N.Ab4],
    bass:   [N.C3,  N.C3, N.Eb3, N.Eb3],
    tempo:  0.38,
    wave:   'square',
    bassWave: 'triangle',
    vol: 0.07,
  },
  NO: {
    // Low, slow, hollow — Ab minor
    melody: [N.Ab3, N.Eb3, N.C3, N.Bb3, N.Ab3, N.G3, N.Ab3, N.Eb3],
    bass:   [N.C3,  0,     N.Ab3, 0],
    tempo:  0.55,
    wave:   'sawtooth',
    bassWave: 'sawtooth',
    vol: 0.055,
  },
  MISTY: {
    // Slow, ambiguous drone — half-steps, unsettling
    melody: [N.Ab3, N.Bb3, N.Ab3, N.G3, N.Ab3, N.F3, N.G3, N.Ab3],
    bass:   [N.Eb3, 0,     N.F3,  0],
    tempo:  0.72,
    wave:   'sine',
    bassWave: 'sine',
    vol: 0.045,
  },
}

export function useOwlAudio(status: OwlStatus | null) {
  const ctxRef      = useRef<AudioContext | null>(null)
  const masterRef   = useRef<GainNode | null>(null)
  const activeRef   = useRef(false)
  const melodyIdxRef = useRef(0)
  const bassIdxRef   = useRef(0)
  const melTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bassTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      masterRef.current = ctxRef.current.createGain()
      masterRef.current.connect(ctxRef.current.destination)
      masterRef.current.gain.value = 0
    }
    return ctxRef.current
  }

  function playTone(freq: number, duration: number, wave: OscillatorType, vol: number) {
    if (!freq) return // rest
    const ctx = getCtx()
    if (!masterRef.current) return

    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = wave
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.setTargetAtTime(0, ctx.currentTime + duration * 0.65, 0.04)

    osc.connect(gain)
    gain.connect(masterRef.current)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  useEffect(() => {
    if (!status) return

    activeRef.current = true
    melodyIdxRef.current = 0
    bassIdxRef.current = 0
    const theme = THEMES[status]

    // Fade master in
    const ctx = getCtx()
    if (masterRef.current) {
      masterRef.current.gain.setTargetAtTime(1, ctx.currentTime, 0.4)
    }

    function tickMelody() {
      if (!activeRef.current) return
      const note = theme.melody[melodyIdxRef.current % theme.melody.length]
      playTone(note, theme.tempo * 0.85, theme.wave, 0.9)
      melodyIdxRef.current++
      melTimerRef.current = setTimeout(tickMelody, theme.tempo * 1000)
    }

    function tickBass() {
      if (!activeRef.current) return
      const note = theme.bass[bassIdxRef.current % theme.bass.length]
      playTone(note, theme.tempo * 1.8, theme.bassWave, 0.7)
      bassIdxRef.current++
      bassTimerRef.current = setTimeout(tickBass, theme.tempo * 2000)
    }

    melTimerRef.current = setTimeout(tickMelody, 100)
    bassTimerRef.current = setTimeout(tickBass, 50)

    return () => {
      activeRef.current = false
      if (melTimerRef.current) clearTimeout(melTimerRef.current)
      if (bassTimerRef.current) clearTimeout(bassTimerRef.current)
      if (masterRef.current && ctxRef.current) {
        masterRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.3)
      }
    }
  }, [status])

  useEffect(() => {
    return () => {
      activeRef.current = false
      if (melTimerRef.current) clearTimeout(melTimerRef.current)
      if (bassTimerRef.current) clearTimeout(bassTimerRef.current)
      ctxRef.current?.close()
    }
  }, [])

  function unlock() {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
  }

  return { unlock }
}
