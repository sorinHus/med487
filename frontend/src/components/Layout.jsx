const AVATAR_COLORS = ['#3a7bd5','#e05c7a','#f5a623','#50c878','#9b59b6','#1abc9c','#e67e22']

function getInitials(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?'
}

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0]
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: IconDashboard },
  { id: 'pacienti',    label: 'Pacienti',    icon: IconPacienti },
  { id: 'programari',  label: 'Programari',  icon: IconProgramari },
  { id: 'consultatii', label: 'Consultatii', icon: IconConsultatii },
  { id: 'rapoarte',    label: 'Rapoarte',    icon: IconRapoarte },
]

const PAGE_TITLES = {
  dashboard:   () => `Dashboard — ${new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
  pacienti:    () => 'Lista pacienti',
  programari:  () => 'Programari',
  consultatii: () => 'Consultatii',
  rapoarte:    () => 'Rapoarte & Grafice',
}

export default function Layout({ children, activePage, onNavigate, onLogout, user }) {
  const firstName = user?.first_name || ''
  const lastName  = user?.last_name  || ''
  const fullName  = `Dr. ${firstName} ${lastName}`.trim()
  const initials  = getInitials(firstName, lastName)
  const avatarBg  = getAvatarColor(fullName)
  const rol       = user?.rol || 'medic'
  const title     = PAGE_TITLES[activePage]?.() || ''

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f1117', color: '#e2e8f0', fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: '210px', minWidth: '210px', background: '#161b27', borderRight: '1px solid #1e2535', display: 'flex', flexDirection: 'column' }}>

        {/* Logo */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1e2535' }}>
          <img src="/logo.png" alt="MED487" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px' }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activePage === id
            return (
              <button key={id} onClick={() => onNavigate(id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  marginBottom: '2px', textAlign: 'left',
                  background: active ? 'rgba(58,123,213,0.15)' : 'transparent',
                  color: active ? '#60a5fa' : '#7a8499',
                  fontSize: '16px', fontWeight: active ? '600' : '400',
                  transition: 'background 0.15s, color 0.15s',
                  borderLeft: active ? '3px solid #3a7bd5' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#c0c8d8' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7a8499' } }}
              >
                <Icon size={15} color={active ? '#60a5fa' : '#4b5563'} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '15px 14px', borderTop: '1px solid #1e2535' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName}</div>
              <div style={{ fontSize: '14px', color: '#4b5563', textTransform: 'capitalize' }}>{rol}</div>
            </div>
          </div>
          <button onClick={onLogout}
            style={{ width: '100%', padding: '7px', borderRadius: '7px', border: '1px solid #1e2535', background: 'transparent', color: '#6b7280', fontSize: '15px', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#1e2535' }}
          >
            Deconectare
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ height: '54px', background: '#161b27', borderBottom: '1px solid #1e2535', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', color: '#4b5563' }}>{fullName}</span>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff' }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

// ── Icons ──
function IconDashboard({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function IconPacienti({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  )
}
function IconProgramari({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
    </svg>
  )
}
function IconConsultatii({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
    </svg>
  )
}
function IconRapoarte({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M3 3v18h18v-2H5V3H3zm4 10l3-3 3 3 4-4 1.5 1.5L13 16l-3-3-3 3L7 13z"/>
    </svg>
  )
}