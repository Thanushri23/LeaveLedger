import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOutAction } from '@/app/actions/auth'
import NotificationBell from '@/components/NotificationBell'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Proxy already enforces role-based routing.
  // Here we only hard-block if the JWT role is explicitly 'manager'.
  const role = user.user_metadata?.role as string | undefined
  if (role === 'manager') redirect('/manager/dashboard')

  // Fetch profile + last 20 notifications in parallel
  const [{ data: profile }, { data: rawNotifications }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, department')
      .eq('id', user.id)
      .single(),
    supabase
      .from('notifications')
      .select('id, message, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const notifications = rawNotifications ?? []

  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? 'Employee'
  const displayDept = profile?.department ?? user.user_metadata?.department ?? ''

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-0)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{
          background: 'var(--surface-1)',
          borderRight: '1px solid rgba(99,102,241,0.1)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-6 py-5"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}
        >
          <span className="text-2xl">📋</span>
          <span className="font-bold text-lg gradient-text">LeaveLedger</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { href: '/employee/dashboard', icon: '🏠', label: 'Dashboard' },
            { href: '/employee/apply', icon: '✏️', label: 'Apply Leave' },
            { href: '/employee/history', icon: '📂', label: 'My History' },
            { href: '/employee/calendar', icon: '🗓️', label: 'My Calendar' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-indigo-500/10 hover:text-white"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* User info + sign out */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff' }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {displayDept}
              </p>
            </div>
            <NotificationBell initialNotifications={notifications} />
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="btn btn-secondary w-full text-xs"
              style={{ padding: '0.5rem 1rem' }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
