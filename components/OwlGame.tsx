'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useOwlAudio } from '@/lib/useOwlAudio'
import OwlScene from './OwlScene'
import { OwlStatus } from '@/types'

interface LeaderEntry {
  player_name: string
  score: number
  rounds: number
}

const RESULT_LABEL: Record<OwlStatus, string> = {
  YES:   'THE OWL IS HOME',
  NO:    'THE OWL IS NOT HOME',
  MISTY: 'THE MIST IS UNCLEAR',
}

const RESULT_FLAVOR: Record<OwlStatus, string> = {
  YES:   'warm. feathery. home.',
  NO:    'just wind. just the window.',
  MISTY: 'something stirs... or does it?',
}

type Phase = 'idle' | 'guessing' | 'result'

export default function OwlGame() {
  const [playerName,    setPlayerName]    = useState<string | null>(null)
  const [nameInput,     setNameInput]     = useState('')
  const [phase,         setPhase]         = useState<Phase>('idle')
  const [result,        setResult]        = useState<OwlStatus | null>(null)
  const [correct,       setCorrect]       = useState<boolean | null>(null)
  const [score,         setScore]         = useState(0)
  const [rounds,        setRounds]        = useState(0)
  const [leaderboard,   setLeaderboard]   = useState<LeaderEntry[]>([])
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [flashScene,    setFlashScene]    = useState(false)

  const { unlock } = useOwlAudio(audioUnlocked ? result : null)

  // Load player from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('owl_player')
    if (saved) {
      try {
        const { name, score: s, rounds: r } = JSON.parse(saved)
        setPlayerName(name)
        setScore(s  ?? 0)
        setRounds(r ?? 0)
      } catch { /* ignore */ }
    }
  }, [])

  const fetchLeaderboard = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('scores')
      .select('player_name, score, rounds')
      .eq('date', today)
      .order('score', { ascending: false })
      .limit(10)
    if (data) setLeaderboard(data)
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Live leaderboard via realtime
  useEffect(() => {
    const channel = supabase
      .channel('scores-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        fetchLeaderboard()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLeaderboard])

  const handleLogout = () => {
    localStorage.removeItem('owl_player')
    setPlayerName(null)
    setNameInput('')
    setScore(0)
    setRounds(0)
    setResult(null)
    setPhase('idle')
  }

  const handleNameSubmit = () => {
    const trimmed = nameInput.trim().slice(0, 16)
    if (!trimmed) return
    setPlayerName(trimmed)
    localStorage.setItem('owl_player', JSON.stringify({ name: trimmed, score: 0, rounds: 0 }))
  }

  const handleGuess = useCallback(async (guess: 'YES' | 'NO') => {
    if (phase !== 'idle' || !playerName) return
    setPhase('guessing')

    try {
      const res  = await fetch('/api/guess', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: playerName, guess }),
      })
      const data = await res.json()

      setResult(data.result)
      setCorrect(data.correct)
      setScore(data.score)
      setRounds(data.rounds)
      localStorage.setItem('owl_player', JSON.stringify({
        name:   playerName,
        score:  data.score,
        rounds: data.rounds,
      }))

      setFlashScene(true)
      setTimeout(() => setFlashScene(false), 700)
      setPhase('result')
      setTimeout(() => setPhase('idle'), 2800)
    } catch {
      setPhase('idle')
    }
  }, [phase, playerName])

  const handleUnlockAudio = () => {
    setAudioUnlocked(true)
    unlock()
  }

  // ── Name entry screen ──────────────────────────────────────────────────────
  if (!playerName) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ color: 'var(--text)' }}
      >
        <div className="window w-full max-w-sm">
          <div className="title-bar">
            <span className="title-bar-text">WHO IS WATCHING?</span>
          </div>
          <div className="p-6 text-center">
            <div
              className="window-inset mb-6"
              style={{ padding: 0, overflow: 'hidden', lineHeight: 0 }}
            >
              <OwlScene status="YES" flash={false} />
            </div>
            <div className="text-[8px] mb-4" style={{ color: 'var(--text-dim)' }}>
              ENTER YOUR NAME TO BEGIN
            </div>
            <input
              type="text"
              maxLength={16}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              className="window-inset w-full px-3 py-2 text-[10px] text-center mb-4 outline-none"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                color:      'var(--text)',
                background: 'var(--bg-deep)',
              }}
              placeholder="YOUR NAME"
              autoFocus
            />
            <button className="btn" onClick={handleNameSubmit}>
              ENTER
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Main game ──────────────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start p-3 pt-6"
      style={{ color: 'var(--text)' }}
      onClick={!audioUnlocked ? handleUnlockAudio : undefined}
    >
      {/* Marquee header */}
      <div className="w-full max-w-2xl mb-4 window" style={{ padding: '4px 0' }}>
        <div className="title-bar mb-1">
          <span className="title-bar-text">computerparty.fun</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 window flex items-center justify-center text-[8px]">_</div>
            <div className="w-4 h-4 window flex items-center justify-center text-[8px]">□</div>
            <div className="w-4 h-4 window flex items-center justify-center text-[8px]">✕</div>
          </div>
        </div>
        <div className="marquee-wrap px-2">
          <span className="marquee-inner text-[8px]" style={{ color: 'var(--text-dim)' }}>
            · IS THE OWL IN THE HOUSE? · GUESS CORRECTLY TO SCORE · LEADERBOARD RESETS AT MIDNIGHT · PLEASE DO NOT TURN OFF YOUR COMPUTER · &nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </div>

      {/* Main layout: game + leaderboard */}
      <div className="w-full max-w-2xl flex gap-3">

        {/* ── Game column ── */}
        <div className="flex-1 min-w-0">
          <div className="window">
            <div className="title-bar">
              <span className="title-bar-text">OWL.EXE — Is The Owl In The House?</span>
              <div className="w-4 h-4 window flex items-center justify-center text-[8px]">✕</div>
            </div>

            {/* Owl house scene */}
            <div
              className="window-inset"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              <OwlScene status={result} flash={flashScene} />
            </div>

            <div className="p-3">
              {/* Result / status message */}
              <div
                className="window-inset p-3 mb-3 text-center"
                style={{ minHeight: '58px' }}
              >
                {phase === 'guessing' ? (
                  <div className="text-[9px] blink" style={{ color: 'var(--text-dim)', paddingTop: '8px' }}>
                    CONSULTING THE OWL...
                  </div>
                ) : phase === 'result' && result ? (
                  <>
                    <div className={`text-[10px] mb-1 status-${result}`}>
                      {RESULT_LABEL[result]}
                    </div>
                    {result !== 'MISTY' && (
                      <div
                        className="text-[9px] mb-1"
                        style={{ color: correct ? 'var(--yes-color)' : 'var(--no-color)' }}
                      >
                        {correct ? '[OK] CORRECT' : '[!!] WRONG'}
                      </div>
                    )}
                    <div className="text-[7px] italic" style={{ color: 'var(--text-dim)' }}>
                      {RESULT_FLAVOR[result]}
                    </div>
                  </>
                ) : (
                  <div className="text-[9px]" style={{ color: 'var(--text-dim)', paddingTop: '8px' }}>
                    {result ? RESULT_LABEL[result] : 'IS THE OWL HOME TONIGHT?'}
                  </div>
                )}
              </div>

              {/* Guess buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  className="btn btn-yes flex-1 text-center"
                  style={{ padding: '8px', fontSize: '9px' }}
                  onClick={() => handleGuess('YES')}
                  disabled={phase !== 'idle'}
                >
                  YES — IN THE HOUSE
                </button>
                <button
                  className="btn btn-no flex-1 text-center"
                  style={{ padding: '8px', fontSize: '9px' }}
                  onClick={() => handleGuess('NO')}
                  disabled={phase !== 'idle'}
                >
                  NO — NOT HOME
                </button>
              </div>

              {/* Player stats */}
              <div className="flex gap-2">
                <div className="window-inset flex-1 p-2 text-center" style={{ position: 'relative' }}>
                  <div className="text-[7px] mb-1" style={{ color: 'var(--text-dim)' }}>PLAYER</div>
                  <div
                    className="text-[8px]"
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {playerName}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-[6px] mt-1 block w-full"
                    style={{ color: 'var(--text-dim)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", letterSpacing: 0 }}
                  >
                    [change]
                  </button>
                </div>
                <div className="window-inset flex-1 p-2 text-center">
                  <div className="text-[7px] mb-1" style={{ color: 'var(--text-dim)' }}>SCORE</div>
                  <div className="text-[16px]" style={{ color: 'var(--yes-color)' }}>{score}</div>
                </div>
                <div className="window-inset flex-1 p-2 text-center">
                  <div className="text-[7px] mb-1" style={{ color: 'var(--text-dim)' }}>ROUNDS</div>
                  <div className="text-[16px]">{rounds}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Leaderboard column ── */}
        <div className="w-36 flex-shrink-0">
          <div className="window h-full">
            <div className="title-bar">
              <span className="title-bar-text" style={{ fontSize: '7px' }}>TODAY'S BEST</span>
            </div>
            <div className="p-2">
              {leaderboard.length === 0 ? (
                <div
                  className="text-center text-[7px] mt-6 blink"
                  style={{ color: 'var(--text-dim)' }}
                >
                  NO DATA YET
                </div>
              ) : leaderboard.map((entry, i) => (
                <div
                  key={entry.player_name}
                  className="flex justify-between items-center py-1"
                  style={{
                    borderBottom: `1px solid var(--border-lo)`,
                    color: entry.player_name === playerName
                      ? 'var(--yes-color)'
                      : 'var(--text)',
                  }}
                >
                  <div className="flex gap-1 items-center min-w-0 text-[7px]">
                    <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '64px',
                    }}>
                      {entry.player_name}
                    </span>
                  </div>
                  <div className="text-[8px] flex-shrink-0 ml-1">{entry.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Audio prompt */}
      {!audioUnlocked && (
        <div
          className="mt-3 window px-4 py-2 text-[7px] blink text-center cursor-pointer w-full max-w-2xl"
          style={{ color: 'var(--text-dim)' }}
          onClick={handleUnlockAudio}
        >
          [ CLICK ANYWHERE TO ENABLE AMBIENT AUDIO ]
        </div>
      )}

      {/* Footer */}
      <div
        className="mt-4 text-[7px] text-center"
        style={{ color: 'var(--text-dim)', opacity: 0.4 }}
      >
        computerparty.fun © 2024 · best viewed at 800×600 · netscape navigator 4.0
      </div>
    </main>
  )
}
