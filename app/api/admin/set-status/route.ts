import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { OwlStatus } from '@/types'

const VALID_STATUSES: OwlStatus[] = ['YES', 'NO', 'MISTY']

export async function POST(req: Request) {
  const { password, status } = await req.json()

  // Auth check
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate status
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Insert a new status row (realtime triggers on INSERT)
  const { error } = await supabase
    .from('owl_status')
    .insert({ status })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status })
}
