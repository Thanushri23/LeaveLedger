'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { markAllNotificationsReadAction } from '@/app/actions/notifications'

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotificationRow = {
  id: string
  message: string
  is_read: boolean
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function notifIcon(message: string): string {
  if (message.includes('approved')) return '✅'
  if (message.includes('rejected')) return '❌'
  if (message.includes('cancelled')) return '🚫'
  if (message.includes('submitted')) return '📋'
  return '🔔'
}

// ─── Bell Button + Dropdown ───────────────────────────────────────────────────
export default function NotificationBell({
  initialNotifications,
}: {
  initialNotifications: NotificationRow[]
}) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [, startTransition] = useTransition()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // ── Toggle: open → mark all read optimistically ─────────────────────────────
  function handleToggle() {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening && unreadCount > 0) {
      // Optimistic UI update — flip all to read immediately
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      // Sync with DB in background
      startTransition(() => markAllNotificationsReadAction())
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flexShrink: 0 }}>

      {/* ── Bell button ──────────────────────────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        style={{
          position: 'relative',
          width: 34,
          height: 34,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.07)',
          border: `1px solid ${isOpen ? 'rgba(99,102,241,0.45)' : 'rgba(99,102,241,0.18)'}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: isOpen ? 'var(--brand-400)' : 'var(--text-secondary)',
        }}
      >
        {/* Bell SVG */}
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              minWidth: 17,
              height: 17,
              borderRadius: 999,
              background: '#ef4444',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              border: '2px solid var(--surface-1)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ───────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="glass"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: 0,
            width: 296,
            maxHeight: 380,
            overflowY: 'auto',
            zIndex: 200,
            boxShadow: '0 -12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2)',
            borderRadius: 14,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(99,102,241,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              background: 'rgba(30,30,53,0.95)',
              backdropFilter: 'blur(16px)',
              borderRadius: '14px 14px 0 0',
            }}
          >
            <span
              style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em' }}
            >
              🔔 Notifications
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {notifications.length === 0
                ? 'None'
                : unreadCount === 0
                ? '✓ All read'
                : `${unreadCount} unread`}
            </span>
          </div>

          {/* Body */}
          {notifications.length === 0 ? (
            /* Empty state */
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 30, marginBottom: 8 }}>🔕</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
                No notifications yet
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                Updates about leave requests will appear here.
              </p>
            </div>
          ) : (
            /* Notification rows */
            <div>
              {notifications.map((n, idx) => (
                <div
                  key={n.id}
                  style={{
                    padding: '11px 14px',
                    borderBottom:
                      idx < notifications.length - 1
                        ? '1px solid rgba(99,102,241,0.07)'
                        : 'none',
                    background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.07)',
                    transition: 'background 0.3s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>
                    {notifIcon(n.message)}
                  </span>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)',
                        lineHeight: 1.45,
                        margin: 0,
                        fontWeight: n.is_read ? 400 : 500,
                      }}
                    >
                      {n.message}
                    </p>
                    <p
                      style={{
                        fontSize: 10.5,
                        color: 'var(--text-muted)',
                        marginTop: 4,
                        margin: '4px 0 0',
                      }}
                    >
                      {timeAgo(n.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#6366f1',
                        flexShrink: 0,
                        marginTop: 6,
                        boxShadow: '0 0 6px rgba(99,102,241,0.8)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
