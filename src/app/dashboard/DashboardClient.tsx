'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Plant from '@/components/Plant'
import HealthChart from '@/components/HealthChart'

interface ChartPoint {
  date: string
  health: number | null
  isToday: boolean
}

interface Props {
  email: string
  initialHealth: number
  chartData: ChartPoint[]
}

export default function DashboardClient({ email, initialHealth, chartData }: Props) {
  const [health] = useState(initialHealth)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const initial = email[0].toUpperCase()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col">

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-stone-200/60">
        <span className="text-sm font-semibold tracking-wide text-stone-700">Be Present</span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 text-sm font-semibold flex items-center justify-center hover:bg-stone-300 transition-colors"
          >
            {initial}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-stone-200 rounded-xl shadow-md py-1 z-10">
              <p className="px-4 py-2 text-xs text-stone-400 truncate">{email}</p>
              <hr className="border-stone-100" />
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-6 py-10 max-w-lg mx-auto w-full gap-6">

        {/* Plant */}
        <div className="flex flex-col items-center gap-1">
          <Plant health={health} />
          <p className="text-3xl font-semibold text-stone-800 tabular-nums">
            {health}
            <span className="text-lg font-normal text-stone-400"> / 100</span>
          </p>
        </div>

        {/* 30-day chart */}
        <div className="w-full">
          <p className="text-xs text-stone-400 mb-3 tracking-wide uppercase">Last 30 days</p>
          <HealthChart data={chartData} />
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col items-center gap-3 max-w-xs">
          <Link
            href="/deep-work"
            className="w-full text-center py-4 rounded-2xl bg-stone-800 text-white font-medium tracking-wide hover:bg-stone-700 active:scale-95 transition-all"
          >
            Start Deep Work
          </Link>
          <Link href="/garden" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            🌱 Your garden
          </Link>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="px-6 py-4 border-t border-stone-200/60 text-center">
        <a
          href="mailto:jack.p14370@gmail.com?subject=Be Present feedback"
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          Share feedback
        </a>
      </footer>

    </div>
  )
}
