import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DebugClient from './DebugClient'

export default async function DebugPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: plant } = await supabase
    .from('attachment_objects')
    .select('health')
    .eq('user_id', user.id)
    .single()

  return <DebugClient initialHealth={plant?.health ?? 80} userId={user.id} />
}
