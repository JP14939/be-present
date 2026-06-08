import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-semibold text-stone-800">Be Present</h1>
        <p className="text-stone-500">A plant that grows when you focus.</p>
        <Link
          href="/login"
          className="inline-block px-8 py-3 rounded-xl bg-stone-800 text-white font-medium hover:bg-stone-700 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
