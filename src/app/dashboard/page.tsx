import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: plant } = await supabase
    .from('attachment_objects')
    .select('health')
    .eq('user_id', user.id)
    .single()

  const health = plant?.health ?? 80

  // Last 30 days of health events
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const { data: events } = await supabase
    .from('health_events')
    .select('delta, created_at')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  const today = new Date()

  // Build delta map: dayIndex (0=30 days ago, 29=today) → sum of deltas
  const deltaByDay: Record<number, number> = {}
  for (const event of events ?? []) {
    const d = new Date(event.created_at)
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    const idx = 29 - diffDays
    if (idx >= 0 && idx <= 29) {
      deltaByDay[idx] = (deltaByDay[idx] ?? 0) + event.delta
    }
  }

  // Build 30 chart points carrying health forward
  let running = 80
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (29 - i))
    const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const isToday = i === 29

    if (deltaByDay[i] !== undefined) {
      running = Math.max(0, Math.min(100, running + deltaByDay[i]))
    }

    const hasData = deltaByDay[i] !== undefined || isToday
    const dayHealth = isToday ? health : (hasData ? running : null)

    return { date: label, health: dayHealth, isToday }
  })

  return (
    <DashboardClient
      email={user.email!}
      initialHealth={health}
      chartData={chartData}
    />
  )
}
