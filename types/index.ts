export type OwlStatus = 'YES' | 'NO' | 'MISTY'

export interface OwlState {
  id: number
  status: OwlStatus
  updated_at: string
}

export interface Bet {
  id: string
  visitor_id: string
  guess: 'YES' | 'NO'
  status_at_bet: OwlStatus
  resolved: boolean
  won: boolean | null
  created_at: string
}

export interface LocalVisitorState {
  visitorId: string
  streak: number
  pendingBet: 'YES' | 'NO' | null
  lastStatusSeen: OwlStatus | null
}
