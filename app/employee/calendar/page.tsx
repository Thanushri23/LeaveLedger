import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'My Calendar' }

export default async function EmployeeCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*, leave_types(name, color)')
    .eq('employee_id', user!.id)
    .in('status', ['pending', 'approved'])
    .order('start_date')

  type RawReq = {
    id: string
    leave_types: { name: string; color: string }[] | { name: string; color: string } | null
    start_date: string
    end_date: string
    total_days: number
    status: string
  }

  const events = ((requests as RawReq[]) ?? []).map((r) => ({
    ...r,
    leave_types: Array.isArray(r.leave_types) ? r.leave_types[0] ?? null : r.leave_types,
  }))

  // Build a simple month grid for the current month
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks = Array(firstDay).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function getEventForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.find((e) => e.start_date <= dateStr && e.end_date >= dateStr)
  }

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          My Calendar
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Your pending and approved leave for {monthName}
        </p>
      </div>

      {/* Month grid */}
      <div className="glass p-6 mb-8">
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {monthName}
        </h2>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold py-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {blanks.map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {days.map((day) => {
            const event = getEventForDay(day)
            const isToday =
              day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
            const isWeekend =
              new Date(year, month, day).getDay() === 0 ||
              new Date(year, month, day).getDay() === 6

            return (
              <div
                key={day}
                className="relative text-center py-2 rounded-lg text-sm"
                style={{
                  background: event
                    ? `${event.leave_types?.color ?? '#6366f1'}22`
                    : isToday
                    ? 'rgba(99,102,241,0.2)'
                    : 'transparent',
                  border: isToday ? '1px solid rgba(99,102,241,0.5)' : '1px solid transparent',
                  color: isWeekend
                    ? 'var(--text-muted)'
                    : event
                    ? event.leave_types?.color ?? '#818cf8'
                    : 'var(--text-primary)',
                  fontWeight: isToday ? 700 : 400,
                }}
                title={event ? `${event.leave_types?.name} (${event.status})` : undefined}
              >
                {day}
                {event && (
                  <div
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: event.leave_types?.color ?? '#6366f1' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      {events.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Your Upcoming Leave
          </h2>
          <div className="space-y-2">
            {events.map((e) => (
              <div
                key={e.id}
                className="glass flex items-center gap-4 px-4 py-3"
                style={{ border: `1px solid ${e.leave_types?.color ?? '#6366f1'}33` }}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: e.leave_types?.color ?? '#6366f1' }}
                />
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {e.leave_types?.name} Leave
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(e.start_date)}
                  {e.start_date !== e.end_date && ` → ${formatDate(e.end_date)}`}
                </span>
                <span className="ml-auto">
                  <span className={`badge badge-${e.status}`}>{e.status}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <div className="glass p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          No upcoming leave. <a href="/employee/apply" style={{ color: 'var(--brand-400)' }}>Apply now →</a>
        </div>
      )}
    </div>
  )
}
