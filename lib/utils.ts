/**
 * Count working days (Mon–Fri) between two dates, inclusive.
 */
export function countWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let count = 0
  const current = new Date(start)

  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable format.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Get today's date in YYYY-MM-DD format (local time).
 */
export function todayStr(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * Get an array of YYYY-MM-DD date strings for all working days in a range.
 */
export function getWorkingDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) {
      days.push(current.toISOString().split('T')[0])
    }
    current.setDate(current.getDate() + 1)
  }

  return days
}

/**
 * Clamp a string to a maximum length with an ellipsis.
 */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}
