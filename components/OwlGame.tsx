'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useOwlAudio } from '@/lib/useOwlAudio'
import { getVisitorState, placeBet, resolveOnStatusChange } from '@/lib/visitor'
import { OwlStatus, LocalVisitorState } from '@/types'

// Block glyphs — pixel-precise, no emoji
const STATUS_GLYPH: Record<OwlStatus, string> = {
  YES:   '██',
  NO:    '░░',
  MISTY: '▒▒',
}

const STATUS_LABEL: Record<OwlStatus, string> = {
  YES:   'YES',
  NO:    'NO',
  MISTY: 'MISTY',
}

const STATUS_SUBTITLE: Record<OwlStatus, string> = {
  YES:   'THE OWL IS IN THE HOUSE',
  NO:    'THE OWL IS NOT IN THE HOUSE',
  MISTY: 'WE CANNOT SEE',
}

const STATUS_FLAVOR: Record<OwlStatus, string> = {
  YES:   'warm. feathery. home.',
  NO:    'just wind. just the window.',
  MISTY: 'something stirs... or does it?',
}

export default function OwlGame() {
  const [status, setStatus] = useState<OwlStatus | null>(null)
  const [visitor, setVisitor] = useState<LocalVisitorState | null>(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [flashResult, setFlashResult] = useState<'win' | 'loss' | null>(null)
  const [statusFlash, setStatusFlash] = useState(false)
  const { unlock } = useOwlAudio(audioUnlocked ? status : null)

  useEffect(() => {
    supabase
      .from('owl_status')
      .select('status')
      .order('id', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setStatus(data.status as OwlStatus)
      })
  }, [])

  useEffect(() => {
    setVisitor(getVisitorState())
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('owl-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'owl_status' },
        (payload) => {
          const newStatus = (payload.new as { status: OwlStatus }).status
          setStatus(newStatus)
          setStatusFlash(true)
          setTimeout(() => setStatusFlash(false), 1200)

          const { result, state } = resolveOnStatusChange(newStatus)
          setVisitor(state)
          if (result !== 'none') {
            setFlashResult(result)
            setTimeout(() => setFlashResult(null), 3000)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleBet = useCallback((guess: 'YES' | 'NO') => {
    if (!status || !visitor) return
    if (visitor.pendingBet) return
    const updated = placeBet(guess, status)
    setVisitor(updated)
  }, [status, visitor])

  const handleUnlockAudio = () => {
    setAudioUnlocked(true)
    unlock()
  }

  const hasBet = visitor?.pendingBet !== null && visitor?.pendingBet !== undefined

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start p-4 pt-8"
      style={{ color: 'var(--text)' }}
      onClick={!audioUnlocked ? handleUnlockAudio : undefined}
    >
      {/* Marquee header */}
      <div className="w-full mb-6 window" style={{ padding: '4px 0' }}>
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
            ·  WELCOME TO COMPUTERPARTY.FUN  ·  THE PREMIER DESTINATION FOR OWL STATUS INFORMATION  ·  LOADING  ·  PLEASE DO NOT TURN OFF YOUR COMPUTER  ·  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </div>

      {/* Main game window */}
      <div className="window w-full max-w-xl">
        <div className="title-bar">
          <span className="title-bar-text">OWL.EXE — Is The Owl In The House?</span>
          <div className="w-4 h-4 window flex items-center justify-center text-[8px]">✕</div>
        </div>

        <div className="p-4">
          {/* Status display */}
          <div className="window-inset p-4 mb-4 text-center">
            {status === null ? (
              <div className="text-[10px] blink" style={{ color: 'var(--text-dim)' }}>
                CONNECTING TO OWL NETWORK...
              </div>
            ) : (
              <>
                {/* Block glyph — pixel art stand-in for the owl state */}
                <div
                  className={`text-[56px] mb-3 status-${status}`}
                  style={{
                    lineHeight: 1,
                    letterSpacing: '0.15em',
                    transition: 'transform 0.1s',
                    transform: statusFlash ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  {STATUS_GLYPH[status]}
                </div>
                <div className={`text-[22px] mb-2 status-${status}`}>
                  {STATUS_LABEL[status]}
                </div>
                <div className="text-[8px] mb-1">{STATUS_SUBTITLE[status]}</div>
                <div className="text-[7px] italic" style={{ color: 'var(--text-dim)' }}>
                  {STATUS_FLAVOR[status]}
                </div>
              </>
            )}
          </div>

          {/* Bet result flash */}
          {flashResult && (
            <div
              className="window-inset p-2 mb-4 text-center text-[10px]"
              style={flashResult === 'win'
                ? { color: 'var(--yes-color)', background: '#1b2e1b' }
                : { color: 'var(--no-color)', background: '#1a2232' }
              }
            >
              {flashResult === 'win'
                ? `[OK] CORRECT. STREAK: ${visitor?.streak ?? 0}`
                : `[!!] WRONG. STREAK RESET.`}
            </div>
          )}

          {/* Betting panel */}
          <div className="window mb-4">
            <div className="title-bar">
              <span className="title-bar-text">Place Your Bet</span>
            </div>
            <div className="p-3">
              {!hasBet ? (
                <>
                  <div className="text-[8px] mb-3 text-center" style={{ color: 'var(--text-dim)' }}>
                    What will the owl do NEXT?
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      className="btn btn-yes"
                      onClick={() => handleBet('YES')}
                      disabled={!status}
                    >
                      BET YES
                    </button>
                    <button
                      className="btn btn-no"
                      onClick={() => handleBet('NO')}
                      disabled={!status}
                    >
                      BET NO
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-[8px]">
                  <div className="mb-1" style={{ color: 'var(--text-dim)' }}>YOUR BET:</div>
                  <div
                    className="text-[14px]"
                    style={{ color: visitor?.pendingBet === 'YES' ? 'var(--yes-color)' : 'var(--no-color)' }}
                  >
                    {visitor?.pendingBet}
                  </div>
                  <div className="text-[7px] mt-1 blink" style={{ color: 'var(--text-dim)' }}>
                    awaiting owl...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Streak + visitor info */}
          <div className="flex gap-2">
            <div className="window-inset flex-1 p-2 text-center">
              <div className="text-[7px] mb-1" style={{ color: 'var(--text-dim)' }}>STREAK</div>
              <div className="text-[18px]">{visitor?.streak ?? 0}</div>
            </div>
            <div className="window-inset flex-1 p-2 text-center">
              <div className="text-[7px] mb-1" style={{ color: 'var(--text-dim)' }}>STATUS</div>
              <div className="text-[8px]">
                {status ? (
                  <span className={`status-${status}`}>LIVE</span>
                ) : (
                  <span className="blink">...</span>
                )}
              </div>
            </div>
            <div className="window-inset flex-1 p-2 text-center">
              <div className="text-[7px] mb-1" style={{ color: 'var(--text-dim)' }}>AUDIO</div>
              <div className="text-[8px]">
                {audioUnlocked ? (
                  <span style={{ color: 'var(--yes-color)' }}>ON</span>
                ) : (
                  <span style={{ color: 'var(--text-dim)' }}>CLICK</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio prompt */}
      {!audioUnlocked && (
        <div
          className="mt-4 window px-4 py-2 text-[8px] blink text-center cursor-pointer"
          style={{ color: 'var(--text-dim)' }}
          onClick={handleUnlockAudio}
        >
          [ CLICK ANYWHERE TO ENABLE AMBIENT AUDIO ]
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-[7px] text-center" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
        <div>computerparty.fun © 2024</div>
        <div className="mt-1">best viewed at 800×600 · netscape navigator 4.0</div>
      </div>
    </main>
  )
}
