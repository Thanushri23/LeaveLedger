'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Mark all of the current user's notifications as read ────────────────────
export async function markAllNotificationsReadAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  // Revalidate both layout trees so the server-rendered badge count refreshes
  // on the next navigation.
  revalidatePath('/employee/dashboard')
  revalidatePath('/employee/apply')
  revalidatePath('/employee/history')
  revalidatePath('/employee/calendar')
  revalidatePath('/manager/dashboard')
  revalidatePath('/manager/approvals')
  revalidatePath('/manager/calendar')
}
