import s from '../styles/Layout.module.css'

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
  { id: 'dashboard',       label: 'Dashboard',       icon: IconDashboard },
  { id: 'pacienti',        label: 'Pacienti',        icon: IconPacienti },
  { id: 'programari',      label: 'Programari',      icon: IconProgramari },
  { id: 'consultatii',     label: 'Consultatii',     icon: IconConsultatii },
  { id: 'rapoarte',        label: 'Rapoarte',        icon: IconRapoarte },
  { id: 'cereri-pacienti', label: 'Cereri pacienți', icon: IconCereri },
]

const PAGE_TITLES = {
  dashboard:   () => `Dashboard — ${new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
  pacienti:    () => 'Lista pacienti',
  programari:  () => 'Programari',
  consultatii: () => 'Consultatii',
  rapoarte:    () => 'Rapoarte & Grafice',
}

export default function Layout({ children, activePage, onNavigate, onLogout, user, moduleActive = [], theme = 'dark', onToggleTheme, cereriCount = 0 }) {
  const firstName = user?.first_name || ''
  const lastName  = user?.last_name  || ''
  const prefix    = user?.rol === 'medic' ? 'Dr. ' : ''
  const fullName  = `${prefix}${firstName} ${lastName}`.trim()
  const initials  = getInitials(firstName, lastName)
  const avatarBg  = getAvatarColor(fullName)
  const rol       = user?.rol || 'medic'
  const title     = PAGE_TITLES[activePage]?.() || ''

  return (
    <div className={s.root}>

      {/* ── Sidebar ── */}
      <aside className={s.sidebar}>

        {/* Logo */}
        <div className={s.sidebar__logo}>
          <a href="/" className={s.sidebar__logoLink}>
            <img src="/logo.png" alt="MED487" className={s.sidebar__logoImg} />
          </a>
        </div>

        {/* Nav */}
        <nav className={s.sidebar__nav}>
          {NAV_ITEMS.filter(item => item.id === 'dashboard' || moduleActive.length === 0 || moduleActive.includes(item.id)).map(({ id, label, icon: Icon }) => {
            const active = activePage === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`${s.navBtn} ${active ? s['navBtn--active'] : ''}`}
              >
                <Icon size={15} color={active ? 'var(--accent-light)' : 'var(--text-dim)'} />
                <span className={s.navBtn__label}>{label}</span>
                {id === 'cereri-pacienti' && cereriCount > 0 && (
                  <span className={s.badge}>
                    {cereriCount > 99 ? '99+' : cereriCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className={s.sidebar__footer}>
          <div className={s.userRow}>
            <div className={s.avatar} style={{ background: avatarBg }}>
              {initials}
            </div>
            <div className={s.userInfo}>
              <div className={s.userName}>{fullName}</div>
              <div className={s.userRol}>{rol}</div>
            </div>
          </div>
          <button
            className={s.btnLogout}
            onClick={() => { if (window.confirm('Ești sigur că vrei să te deconectezi?')) onLogout() }}
          >
            Deconectare
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={s.main}>

        {/* Header */}
        <header className={s.header}>
          <span className={s.header__title}>{title}</span>
          <div className={s.header__actions}>
            <a href="/" className={s.header__siteLink}>← Site principal</a>
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Mod luminos' : 'Mod întunecat'}
              className={s.header__themeBtn}
            >
              {theme === 'dark'
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>
              }
            </button>
            <span
              className={s.header__userName}
              onClick={() => onNavigate('profil')}
              title="Profilul meu"
            >{fullName}</span>
            <div className={s.header__avatar} style={{ background: avatarBg }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={s.content}>
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
function IconCereri({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
    </svg>
  )
}