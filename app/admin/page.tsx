'use client'

import { useState } from 'react'
import { OwlStatus } from '@/types'

const STATUS_OPTIONS: OwlStatus[] = ['YES', 'NO', 'MISTY']

const STATUS_DESC: Record<OwlStatus, string> = {
  YES: 'owl is home — warm, cozy music',
  NO: 'owl is out — wind, emptiness',
  MISTY: 'cannot see — eerie, unresolved',
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<OwlStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastSet, setLastSet] = useState<OwlStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError(false)

    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      setAuthed(true)
      // Load current status
      const statusRes = await fetch('/api/owl')
      if (statusRes.ok) {
        const data = await statusRes.json()
        setCurrentStatus(data.status)
      }
    } else {
      setAuthError(true)
    }
  }

  async function handleSetStatus(status: OwlStatus) {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/set-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, status }),
    })

    if (res.ok) {
      setCurrentStatus(status)
      setLastSet(status)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
    }
    setLoading(false)
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="window w-full max-w-sm">
          <div className="title-bar">
            <span className="title-bar-text">🔐 Admin Login</span>
          </div>
          <div className="p-4">
            <form onSubmit={handleLogin}>
              <div className="window-inset p-3 mb-4">
                <label className="block text-[8px] mb-2">PASSWORD:</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full window-inset px-2 py-1 text-[10px] font-mono bg-white outline-none"
                  autoFocus
                />
              </div>
              {authError && (
                <div className="text-[8px] text-red-700 mb-3 text-center">ACCESS DENIED</div>
              )}
              <div className="flex justify-end">
                <button type="submit" className="btn">LOGIN</button>
              </div>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="window w-full max-w-md">
        <div className="title-bar">
          <span className="title-bar-text">🦉 Owl Status Control Panel</span>
        </div>
        <div className="p-4">
          {/* Current status */}
          <div className="window-inset p-3 mb-4 text-center">
            <div className="text-[8px] opacity-60 mb-1">CURRENT STATUS</div>
            {currentStatus ? (
              <div className={`text-[20px] status-${currentStatus}`}>{currentStatus}</div>
            ) : (
              <div className="text-[10px] blink">...</div>
            )}
          </div>

          {/* Status buttons */}
          <div className="text-[8px] mb-3">SET NEW STATUS:</div>
          <div className="flex flex-col gap-2 mb-4">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                className={`btn text-left flex justify-between items-center ${loading ? '' : ''}`}
                onClick={() => handleSetStatus(s)}
                disabled={loading || currentStatus === s}
              >
                <span className={`status-${s}`}>{s}</span>
                <span className="text-[6px] opacity-60 normal-case">{STATUS_DESC[s]}</span>
              </button>
            ))}
          </div>

          {lastSet && (
            <div className="text-[8px] text-green-700 text-center mb-2">
              ✓ STATUS SET TO: {lastSet}
            </div>
          )}
          {error && (
            <div className="text-[8px] text-red-700 text-center mb-2">
              ERROR: {error}
            </div>
          )}

          {loading && (
            <div className="text-[8px] text-center blink">UPDATING...</div>
          )}
        </div>
      </div>
    </main>
  )
}
