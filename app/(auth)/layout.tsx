export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{
          background:
            'linear-gradient(135deg, #0f0f1a 0%, #16162a 40%, #1e1e35 70%, #312e81 100%)',
        }}
      >
        {/* Glow orbs */}
        <div
          className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
        />
        <div
          className="absolute bottom-20 right-20 w-56 h-56 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }}
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-sm">
          <div className="mb-8">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center text-4xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))',
                border: '1px solid rgba(99,102,241,0.4)',
                boxShadow: '0 0 40px rgba(99,102,241,0.2)',
              }}
            >
              📋
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ color: '#f0f0ff' }}>
              Leave<span className="gradient-text">Ledger</span>
            </h1>
            <p className="text-base leading-relaxed" style={{ color: '#9999cc' }}>
              Streamlined leave management for modern teams. Track balances, approve
              requests, and plan coverage — all in one place.
            </p>
          </div>

          <div className="space-y-3 text-left">
            {[
              { icon: '✅', text: 'Real-time leave balance tracking' },
              { icon: '🗓️', text: 'Team calendar with coverage view' },
              { icon: '⚡', text: 'One-click approvals & rejections' },
              { icon: '🔔', text: 'In-app notifications for every update' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm" style={{ color: '#c7d2fe' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth form panel */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-12"
        style={{ background: 'var(--surface-0)' }}
      >
        <div className="w-full max-w-md fade-in">{children}</div>
      </div>
    </div>
  )
}
