import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const body = await req.json()
  const { name, guess } = body

  if (!name || !['YES', 'NO'].includes(guess)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const cleanName = String(name).trim().slice(0, 16)
  if (!cleanName) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  // Server-side random result — client can't predict or influence this
  const result: 'YES' | 'NO' = Math.random() < 0.5 ? 'YES' : 'NO'
  const correct = guess === result

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  // Fetch existing score for today
  const { data: existing } = await supabase
    .from('scores')
    .select('score, rounds')
    .eq('player_name', cleanName)
    .eq('date', today)
    .single()

  const newScore  = (existing?.score  ?? 0) + (correct ? 1 : 0)
  const newRounds = (existing?.rounds ?? 0) + 1

  await supabase.from('scores').upsert(
    {
      player_name: cleanName,
      date:        today,
      score:       newScore,
      rounds:      newRounds,
      updated_at:  new Date().toISOString(),
    },
    { onConflict: 'player_name,date' }
  )

  // Insert into owl_status so realtime shows community activity
  await supabase.from('owl_status').insert({ status: result })

  return NextResponse.json({ result, correct, score: newScore, rounds: newRounds })
}
