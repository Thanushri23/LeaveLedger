import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Team Calendar' }

export default async function ManagerCalendarPage() {
  const supabase = await createClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  // All approved/pending team leave this month (RLS scopes to department)
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*, leave_types(name, color)')
    .in('status', ['pending', 'approved'])
    .lte('start_date', monthEnd)
    .gte('end_date', monthStart)
    .order('start_date')

  type RawReq = {
    id: string
    employee_id: string
    leave_types: { name: string; color: string }[] | { name: string; color: string } | null
    start_date: string
    end_date: string
    total_days: number
    status: string
  }

  // Fetch profiles separately to avoid RLS recursion on join
  const empIds = [...new Set((requests ?? []).map((r: { employee_id: string }) => r.employee_id))]
  const { data: profileRows } = empIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', empIds)
    : { data: [] }
  const profileMap = Object.fromEntries(
    (profileRows ?? []).map((p: { id: string; full_name: string }) => [p.id, p])
  )

  const events = ((requests as RawReq[]) ?? []).map((r) => ({
    ...r,
    profiles: profileMap[r.employee_id] ?? null,
    leave_types: Array.isArray(r.leave_types) ? r.leave_types[0] ?? null : r.leave_types,
  }))

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks = Array(firstDay).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.start_date <= dateStr && e.end_date >= dateStr)
  }

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Team Calendar
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Department leave coverage for {monthName}
        </p>
      </div>

      {/* Month grid */}
      <div className="glass p-6 mb-8">
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {monthName}
        </h2>
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

        <div className="grid grid-cols-7 gap-1">
          {blanks.map((_, i) => <div key={`b${i}`} />)}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isToday = day === now.getDate() && month === now.getMonth()
            const isWeekend =
              [0, 6].includes(new Date(year, month, day).getDay())

            return (
              <div
                key={day}
                className="text-center py-1.5 rounded-lg text-sm min-h-[3rem] flex flex-col items-center gap-0.5"
                style={{
                  background: isToday ? 'rgba(99,102,241,0.2)' : 'transparent',
                  border: isToday ? '1px solid rgba(99,102,241,0.5)' : '1px solid transparent',
                  color: isWeekend ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                <span>{day}</span>
                {dayEvents.slice(0, 2).map((e, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: e.leave_types?.color ?? '#6366f1' }}
                    title={`${e.profiles?.full_name} – ${e.leave_types?.name}`}
                  />
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>
                    +{dayEvents.length - 2}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Team leave list */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Team Leave This Month
        </h2>
        {events.length > 0 ? (
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
                  {e.profiles?.full_name ?? '—'}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {e.leave_types?.name} · {formatDate(e.start_date)}
                  {e.start_date !== e.end_date && ` → ${formatDate(e.end_date)}`}
                  {' '}({e.total_days}d)
                </span>
                <span className="ml-auto">
                  <span className={`badge badge-${e.status}`}>{e.status}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-6 text-center" style={{ color: 'var(--text-muted)' }}>
            No team leave scheduled this month.
          </div>
        )}
      </section>
    </div>
  )
}
