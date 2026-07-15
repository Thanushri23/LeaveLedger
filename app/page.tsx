import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Read role from JWT metadata — no DB query, no RLS, no recursion
  const role = user.user_metadata?.role as string | undefined
  redirect(role === 'manager' ? '/manager/dashboard' : '/employee/dashboard')
}
