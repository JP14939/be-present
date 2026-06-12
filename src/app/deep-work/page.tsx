import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DeepWorkClient from './DeepWorkClient'

export default async function DeepWorkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <DeepWorkClient userId={user.id} />
}
