import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BookOpen, CalendarDays, CheckSquare, CircleUserRound, LayoutDashboard, Lightbulb, Menu, Moon, Sun, Target, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'
import NotificationBell from './NotificationBell'
import { formatDate, todayISO } from '../lib/dates'

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/exams', label: 'Exams', icon: BookOpen },
  { to: '/assignments', label: 'Assignments', icon: CheckSquare },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/profile', label: 'Profile', icon: CircleUserRound },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const { data } = useData()
  const { theme, toggleTheme } = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const initials = (data.profile?.name || user?.displayName || user?.email || 'S').split(/\s|@/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  return <div className="app-shell">
    {drawerOpen && <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />}
    <aside className={`sidebar ${drawerOpen ? 'open' : ''}`}>
      <NavLink className="brand" to="/" onClick={() => setDrawerOpen(false)}><span className="brand-mark"><Lightbulb size={19} /></span><span>Study Space</span></NavLink>
      <div className="nav-label">Workspace</div>
      <nav className="nav-list" aria-label="Main navigation">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} end={end} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setDrawerOpen(false)}><Icon size={17} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-profile"><div className="avatar">{initials}</div><div style={{ minWidth: 0, flex: 1 }}><div className="sidebar-profile-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.profile?.name || user?.email}</div><div className="sidebar-profile-course">{data.profile?.course || 'Student'}</div></div><button className="icon-button" aria-label="Sign out" onClick={signOut}><X size={15} /></button></div></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><button className="icon-button mobile-menu" aria-label={drawerOpen ? 'Close menu' : 'Open menu'} onClick={() => setDrawerOpen((value) => !value)}>{drawerOpen ? <X size={18} /> : <Menu size={18} />}</button><div className="topbar-date">{formatDate(todayISO(), { weekday: 'long', month: 'long', day: 'numeric' })}</div><NotificationBell /><button className="icon-button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onClick={toggleTheme}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button></header>
      <main className="page-content"><Outlet /></main>
    </div>
  </div>
}