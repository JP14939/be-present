'use client'

import { useState } from 'react'
import Link from 'next/link'
import Plant from '@/components/Plant'

interface Session {
  id: string
  goal: string
  planned_duration_min: number
  created_at: string
}

interface Props {
  sessions: Session[]
  points: number
}

const SHOP_ITEMS = [
  { id: 'plant',  name: 'Houseplant', cost: 0,   owned: true,  description: 'Your faithful companion. Always there.' },
  { id: 'bonsai', name: 'Bonsai',     cost: 100,  owned: false, description: 'Patience and precision in miniature.' },
  { id: 'cactus', name: 'Cactus',     cost: 150,  owned: false, description: 'Resilient. Asks for nothing.' },
  { id: 'orchid', name: 'Orchid',     cost: 250,  owned: false, description: 'Rare. Earned, not bought.' },
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Mini plant: scale down the full Plant SVG using CSS transform
function MiniPlant() {
  return (
    <div style={{ width: 88, height: 106, overflow: 'hidden', position: 'relative' }}>
      <div style={{ transform: 'scale(0.4)', transformOrigin: 'top left', position: 'absolute' }}>
        <Plant health={100} />
      </div>
    </div>
  )
}

export default function GardenClient({ sessions, points }: Props) {
  const [tab, setTab] = useState<'garden' | 'shop'>('garden')

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-200/60">
        <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
          ← Back
        </Link>
        <span className="text-sm font-semibold text-stone-700">Your Garden</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-stone-500">{points}</span>
          <span className="text-xs text-stone-400">pts</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-stone-200/60 px-6">
        {(['garden', 'shop'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-stone-800 text-stone-800'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">

        {/* ── GARDEN TAB ─────────────────────────────────────────── */}
        {tab === 'garden' && (
          <>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <p className="text-4xl">🌱</p>
                <p className="text-stone-600 font-medium">Your garden is empty.</p>
                <p className="text-sm text-stone-400 max-w-xs">
                  Complete a deep work session without leaving to grow your first plant here.
                </p>
                <Link
                  href="/deep-work"
                  className="mt-2 px-6 py-3 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition-colors"
                >
                  Start a session
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-stone-400 mb-6">
                  {sessions.length} plant{sessions.length !== 1 ? 's' : ''} grown from clean sessions.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {sessions.map(s => (
                    <div
                      key={s.id}
                      className="bg-white border border-stone-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-stone-200 transition-colors"
                    >
                      <MiniPlant />
                      <p className="text-xs text-stone-400">{formatDate(s.created_at)}</p>
                      <p className="text-xs font-medium text-stone-700 text-center leading-snug line-clamp-2">
                        {s.goal}
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {s.planned_duration_min} min
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── SHOP TAB ───────────────────────────────────────────── */}
        {tab === 'shop' && (
          <div className="space-y-6">
            <p className="text-sm text-stone-400">
              Spend points to unlock new companions. You have <span className="font-medium text-stone-700">{points} pts</span>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SHOP_ITEMS.map(item => {
                const canAfford = points >= item.cost
                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 ${
                      item.owned ? 'border-green-200' : 'border-stone-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-stone-800">{item.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{item.description}</p>
                      </div>
                      {item.owned ? (
                        <span className="text-[10px] font-mono text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          owned
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-stone-400">
                          {item.cost} pts
                        </span>
                      )}
                    </div>

                    {!item.owned && (
                      <button
                        disabled
                        className={`w-full py-2 rounded-xl text-xs font-medium transition-colors ${
                          canAfford
                            ? 'bg-stone-800 text-white opacity-60 cursor-not-allowed'
                            : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Coming soon' : `Need ${item.cost - points} more pts`}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
