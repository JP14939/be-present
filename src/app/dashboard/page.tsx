import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

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

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold text-stone-800">
        Welcome {user.email}
      </h1>
      <p className="text-xl text-stone-600">
        Your plant&#39;s health: <span className="font-bold text-stone-800">{health}/100</span>
      </p>
      <SignOutButton />
    </main>
  )
}
