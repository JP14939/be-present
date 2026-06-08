'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-6 py-2 rounded-xl border border-stone-300 text-stone-600 text-sm hover:bg-stone-100 transition-colors"
    >
      Sign out
    </button>
  )
}
