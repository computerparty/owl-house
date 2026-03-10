import { LocalVisitorState, OwlStatus } from '@/types'

const STORAGE_KEY = 'owl_visitor'

function generateVisitorId(): string {
  return 'v_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

export function getVisitorState(): LocalVisitorState {
  if (typeof window === 'undefined') {
    return { visitorId: '', streak: 0, pendingBet: null, lastStatusSeen: null }
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const fresh: LocalVisitorState = {
      visitorId: generateVisitorId(),
      streak: 0,
      pendingBet: null,
      lastStatusSeen: null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    return fresh
  }
  return JSON.parse(raw) as LocalVisitorState
}

export function saveVisitorState(state: LocalVisitorState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function placeBet(guess: 'YES' | 'NO', currentStatus: OwlStatus): LocalVisitorState {
  const state = getVisitorState()
  const updated = { ...state, pendingBet: guess, lastStatusSeen: currentStatus }
  saveVisitorState(updated)
  return updated
}

// Called when status changes. Resolves pending bet if one exists.
export function resolveOnStatusChange(newStatus: OwlStatus): {
  state: LocalVisitorState
  result: 'win' | 'loss' | 'none'
} {
  const state = getVisitorState()

  if (!state.pendingBet) {
    const updated = { ...state, lastStatusSeen: newStatus }
    saveVisitorState(updated)
    return { state: updated, result: 'none' }
  }

  const won = state.pendingBet === newStatus
  const updated: LocalVisitorState = {
    ...state,
    streak: won ? state.streak + 1 : 0,
    pendingBet: null,
    lastStatusSeen: newStatus,
  }
  saveVisitorState(updated)
  return { state: updated, result: won ? 'win' : 'loss' }
}
