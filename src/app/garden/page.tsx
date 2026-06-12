import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GardenClient from './GardenClient'

export default async function GardenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: sessions }, { data: profile }] = await Promise.all([
    supabase
      .from('deep_work_sessions')
      .select('id, goal, planned_duration_min, created_at')
      .eq('user_id', user.id)
      .eq('completed', true)
      .lte('time_away_seconds', 30)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single(),
  ])

  return (
    <GardenClient
      sessions={sessions ?? []}
      points={profile?.points ?? 0}
    />
  )
}
