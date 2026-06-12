'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Plant from '@/components/Plant'

const SESSION_KEY = 'bp_active_session'

interface StoredSession {
  sessionId: string
  goal: string
  plannedDuration: number
  startTime: number
  endTime: number
  timeAwaySeconds: number
}

type PageState = 'setup' | 'active' | 'complete' | 'orphaned'

interface SummaryData {
  completedNormally: boolean
  timeAwaySeconds: number
  baseDelta: number
  penalty: number
  net: number
  pointsEarned: number
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// -2 health per full 5 minutes away, only if >30s total
function calcPenalty(awaySeconds: number): number {
  if (awaySeconds <= 30) return 0
  return Math.floor(awaySeconds / 300) * 2
}

export default function DeepWorkClient({ userId }: { userId: string }) {
  const [pageState, setPageState] = useState<PageState>('setup')
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState<15 | 30 | 60 | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [totalMs, setTotalMs] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [orphaned, setOrphaned] = useState<StoredSession | null>(null)
  const [currentHealth, setCurrentHealth] = useState(80)
  const [isAway, setIsAway] = useState(false)

  const endTimeRef = useRef(0)
  const startTimeRef = useRef(0)
  const sessionIdRef = useRef('')
  const goalRef = useRef('')
  const plannedRef = useRef(0)
  const timeAwayRef = useRef(0)
  const awayStartRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supabase = createClient()

  // ── Mount: restore or detect orphaned session ────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    try {
      const s: StoredSession = JSON.parse(raw)
      const now = Date.now()
      if (s.endTime > now) {
        endTimeRef.current = s.endTime
        startTimeRef.current = s.startTime
        sessionIdRef.current = s.sessionId
        goalRef.current = s.goal
        plannedRef.current = s.plannedDuration
        timeAwayRef.current = s.timeAwaySeconds
        setGoal(s.goal)
        setDuration(s.plannedDuration as 15 | 30 | 60)
        setTotalMs(s.plannedDuration * 60 * 1000)
        setRemaining(s.endTime - now)
        setPageState('active')
      } else {
        setOrphaned(s)
        setPageState('orphaned')
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
    return () => { document.title = 'Be Present' }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tick interval ────────────────────────────────────────────────────────
  useEffect(() => {
    if (pageState !== 'active') return

    intervalRef.current = setInterval(async () => {
      const rem = endTimeRef.current - Date.now()
      if (rem <= 0) {
        clearInterval(intervalRef.current!)
        setRemaining(0)
        document.title = 'Be Present'
        await finishSession()
        return
      }
      setRemaining(rem)
      if (awayStartRef.current === null) {
        document.title = `${formatTime(rem)} — Be Present`
      }
    }, 500)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [pageState]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Visibility detection ─────────────────────────────────────────────────
  useEffect(() => {
    if (pageState !== 'active') return

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        awayStartRef.current = Date.now()
        document.title = '⚠ Be Present'
        setIsAway(true)
      } else if (document.visibilityState === 'visible' && awayStartRef.current !== null) {
        const awaySec = Math.floor((Date.now() - awayStartRef.current) / 1000)
        awayStartRef.current = null
        timeAwayRef.current += awaySec

        // Persist to DB
        supabase
          .from('deep_work_sessions')
          .update({ time_away_seconds: timeAwayRef.current })
          .eq('id', sessionIdRef.current)
          .then(() => {})

        // Persist to localStorage
        const raw = localStorage.getItem(SESSION_KEY)
        if (raw) {
          try {
            const s: StoredSession = JSON.parse(raw)
            s.timeAwaySeconds = timeAwayRef.current
            localStorage.setItem(SESSION_KEY, JSON.stringify(s))
          } catch {}
        }

        // Banner
        if (awaySec > 0) {
          setBanner(`You left for ${formatDuration(awaySec)}`)
          if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
          bannerTimerRef.current = setTimeout(() => setBanner(null), 3000)
        }

        setIsAway(false)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [pageState]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current) }
  }, [])

  // ── Session actions ──────────────────────────────────────────────────────
  async function applyHealthChange(baseDelta: number, reason: string) {
    const awaySec = timeAwayRef.current
    const penalty = calcPenalty(awaySec)
    const net = baseDelta - penalty

    const { data: plant } = await supabase
      .from('attachment_objects')
      .select('health')
      .eq('user_id', userId)
      .single()

    const newHealth = Math.max(0, Math.min(100, (plant?.health ?? 80) + net))
    await supabase
      .from('attachment_objects')
      .update({ health: newHealth, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    await supabase
      .from('health_events')
      .insert({ user_id: userId, delta: baseDelta, source: 'deep_work', reason })

    if (penalty > 0) {
      await supabase
        .from('health_events')
        .insert({ user_id: userId, delta: -penalty, source: 'deep_work', reason: 'time_away' })
    }

    return { awaySec, penalty, net }
  }

  async function finishSession() {
    localStorage.removeItem(SESSION_KEY)

    await supabase
      .from('deep_work_sessions')
      .update({ completed: true, actual_duration_min: plannedRef.current, time_away_seconds: timeAwayRef.current })
      .eq('id', sessionIdRef.current)

    const { awaySec, penalty, net } = await applyHealthChange(8, 'completed')

    // Award points only for clean completions (no away penalty)
    let pointsEarned = 0
    if (penalty === 0) {
      pointsEarned = Math.round((plannedRef.current / 15) * 10)
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single()
      await supabase.from('profiles').update({ points: (profile?.points ?? 0) + pointsEarned }).eq('id', userId)
    }

    setSummary({ completedNormally: true, timeAwaySeconds: awaySec, baseDelta: 8, penalty, net, pointsEarned })
    setPageState('complete')
  }

  async function handleBegin() {
    if (!goal.trim() || !duration) return

    const startTime = Date.now()
    const endTime = startTime + duration * 60 * 1000

    const { data, error } = await supabase
      .from('deep_work_sessions')
      .insert({ user_id: userId, planned_duration_min: duration, goal: goal.trim(), completed: false, time_away_seconds: 0 })
      .select('id')
      .single()

    if (error || !data) return

    // Fetch current health for plant display
    const { data: plant } = await supabase
      .from('attachment_objects')
      .select('health')
      .eq('user_id', userId)
      .single()
    setCurrentHealth(plant?.health ?? 80)

    const stored: StoredSession = { sessionId: data.id, goal: goal.trim(), plannedDuration: duration, startTime, endTime, timeAwaySeconds: 0 }
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored))

    endTimeRef.current = endTime
    startTimeRef.current = startTime
    sessionIdRef.current = data.id
    goalRef.current = goal.trim()
    plannedRef.current = duration
    timeAwayRef.current = 0

    setTotalMs(duration * 60 * 1000)
    setRemaining(endTime - Date.now())
    setPageState('active')
  }

  async function handleEndEarly() {
    setShowModal(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    localStorage.removeItem(SESSION_KEY)
    document.title = 'Be Present'

    const elapsedMin = Math.floor((Date.now() - startTimeRef.current) / 60000)
    await supabase
      .from('deep_work_sessions')
      .update({ completed: false, actual_duration_min: elapsedMin, time_away_seconds: timeAwayRef.current })
      .eq('id', sessionIdRef.current)

    const { awaySec, penalty, net } = await applyHealthChange(-5, 'ended_early')
    setSummary({ completedNormally: false, timeAwaySeconds: awaySec, baseDelta: -5, penalty, net, pointsEarned: 0 })
    setPageState('complete')
  }

  async function handleOrphanedEnd() {
    if (!orphaned) return
    localStorage.removeItem(SESSION_KEY)

    const elapsedMin = Math.floor((orphaned.endTime - orphaned.startTime) / 60000)
    await supabase
      .from('deep_work_sessions')
      .update({ completed: false, actual_duration_min: elapsedMin, time_away_seconds: orphaned.timeAwaySeconds })
      .eq('id', orphaned.sessionId)

    timeAwayRef.current = orphaned.timeAwaySeconds
    const { awaySec, penalty, net } = await applyHealthChange(-5, 'ended_early')
    setSummary({ completedNormally: false, timeAwaySeconds: awaySec, baseDelta: -5, penalty, net, pointsEarned: 0 })
    setPageState('complete')
  }

  // ── ORPHANED ──────────────────────────────────────────────────────────────
  if (pageState === 'orphaned') {
    return (
      <main className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <p className="text-4xl">🕰</p>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-stone-800">You had a session in progress.</h1>
            <p className="text-sm text-stone-500">It ended while you were away.</p>
          </div>
          <button
            onClick={handleOrphanedEnd}
            className="w-full py-4 rounded-2xl bg-stone-800 text-white font-medium hover:bg-stone-700 transition-colors"
          >
            End it
          </button>
          <button
            onClick={() => { localStorage.removeItem(SESSION_KEY); setPageState('setup') }}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Dismiss without penalty
          </button>
        </div>
      </main>
    )
  }

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (pageState === 'setup') {
    return (
      <main className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <h1 className="text-2xl font-semibold text-stone-800 text-center">Deep Work Session</h1>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-stone-500">What's the one thing you want to do?</label>
              <input
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="Write the first draft of..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-stone-500">How long?</label>
              <div className="flex gap-3">
                {([15, 30, 60] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      duration === d
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleBegin}
              disabled={!goal.trim() || !duration}
              className="w-full py-4 rounded-2xl bg-stone-800 text-white font-medium tracking-wide hover:bg-stone-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Begin
            </button>
            <p className="text-xs text-center text-stone-400 leading-relaxed">
              Leaving this page during a session will cost your plant health.
              Don't open this unless you're ready to commit.
            </p>
          </div>
          <div className="text-center">
            <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">← Back</Link>
          </div>
        </div>
      </main>
    )
  }

  // ── COMPLETE ───────────────────────────────────────────────────────────────
  if (pageState === 'complete' && summary) {
    const { completedNormally, timeAwaySeconds, baseDelta, penalty, net, pointsEarned } = summary
    return (
      <main className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <p className="text-5xl">{completedNormally ? '🌿' : '🍂'}</p>
            <h1 className="text-2xl font-semibold text-stone-800">
              {completedNormally ? 'Session complete.' : 'Session ended.'}
            </h1>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-2xl p-5 space-y-3 border border-stone-100">
            {timeAwaySeconds > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Time away</span>
                <span className="text-stone-700">{formatDuration(timeAwaySeconds)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">{completedNormally ? 'Completed' : 'Ended early'}</span>
              <span className={baseDelta >= 0 ? 'text-green-600' : 'text-red-500'}>
                {baseDelta >= 0 ? '+' : ''}{baseDelta}
              </span>
            </div>
            {penalty > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Time away penalty</span>
                <span className="text-red-500">−{penalty}</span>
              </div>
            )}
            <div className="border-t border-stone-100 pt-3 flex justify-between font-medium">
              <span className="text-stone-700">Net change</span>
              <span className={net >= 0 ? 'text-green-600' : 'text-red-500'}>
                {net >= 0 ? '+' : ''}{net}
              </span>
            </div>
          </div>

          {pointsEarned > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">+{pointsEarned} pts earned</p>
                <p className="text-xs text-green-600 mt-0.5">A plant was added to your garden.</p>
              </div>
              <Link href="/garden" className="text-xs text-green-700 font-medium hover:underline">
                View garden →
              </Link>
            </div>
          )}

          <Link
            href="/dashboard"
            className="block w-full py-4 rounded-2xl bg-stone-800 text-white font-medium text-center tracking-wide hover:bg-stone-700 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  // ── ACTIVE ─────────────────────────────────────────────────────────────────
  const progress = totalMs > 0 ? Math.min(1, 1 - remaining / totalMs) : 0
  const sessionProgress = totalMs > 0 ? Math.min(1, 1 - remaining / totalMs) : 0

  return (
    <main className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-between px-6 py-10">
      {/* Away banner */}
      {banner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50">
          {banner}
        </div>
      )}

      {/* Goal */}
      <p className="text-stone-500 text-center max-w-xs leading-relaxed pt-4">{goalRef.current}</p>

      {/* Plant — grows in real time as session progresses */}
      <div className="flex flex-col items-center gap-2">
        <Plant health={currentHealth} sessionProgress={sessionProgress} isAway={isAway} />
        <span className="text-5xl font-extralight tabular-nums tracking-tight text-stone-800">
          {formatTime(remaining)}
        </span>
        <div className="w-48 h-0.5 bg-stone-200 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-stone-400 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-stone-400 hover:text-red-400 transition-colors pb-4"
      >
        End early
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center px-6 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs space-y-4 shadow-xl">
            <h2 className="font-semibold text-stone-800">End early?</h2>
            <p className="text-sm text-stone-500">Your plant will lose health.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndEarly}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
              >
                End anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
