'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Plant from '@/components/Plant'
import Link from 'next/link'

interface Props {
  initialHealth: number
  userId: string
}

export default function DebugClient({ initialHealth, userId }: Props) {
  const [health, setHealth] = useState(initialHealth)
  const [loading, setLoading] = useState(false)

  async function adjustHealth(delta: number) {
    if (loading) return
    setLoading(true)
    const newHealth = Math.max(0, Math.min(100, health + delta))
    const supabase = createClient()
    await supabase
      .from('attachment_objects')
      .update({ health: newHealth, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    await supabase
      .from('health_events')
      .insert({ user_id: userId, delta, source: 'debug', reason: 'manual test' })
    setHealth(newHealth)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center gap-6 px-6">
      <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">Debug panel</p>
      <Plant health={health} />
      <p className="text-xl font-semibold text-stone-700">Health: {health} / 100</p>
      <div className="flex gap-3">
        <button
          onClick={() => adjustHealth(5)}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-green-100 text-green-800 font-medium text-sm hover:bg-green-200 transition-colors disabled:opacity-40"
        >
          +5
        </button>
        <button
          onClick={() => adjustHealth(-5)}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-red-100 text-red-800 font-medium text-sm hover:bg-red-200 transition-colors disabled:opacity-40"
        >
          −5
        </button>
      </div>
      <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
        ← Back to dashboard
      </Link>
    </main>
  )
}
