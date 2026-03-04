import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Building2, ClipboardList, Settings,
  PanelLeftClose, PanelLeft, LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/condomini', icon: Building2, label: 'Condomini' },
  { to: '/attivita', icon: ClipboardList, label: 'Attività' },
]

const BOTTOM_ITEMS = [
  { to: '/impostazioni', icon: Settings, label: 'Impostazioni' },
]

function SidebarLink({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
        ${isActive
          ? 'bg-white/15 text-white shadow-sm'
          : 'text-white/60 hover:text-white hover:bg-white/8'
        }
        ${collapsed ? 'justify-center' : ''}`
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}

export default function AppLayout({ children }) {
  const { studio, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-primary flex flex-col z-40 transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <img src="/logo.png" alt="Domus Agent" className="w-9 h-9 rounded-lg shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm tracking-tight truncate">Domus Agent</h1>
              <p className="text-white/40 text-xs truncate">{studio?.nome || ''}</p>
            </div>
          )}
        </div>

        {/* Nav principale */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <SidebarLink key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Separatore + nav bottom */}
        <div className="px-3 pb-3 space-y-1">
          <div className="border-t border-white/10 mb-3" />
          {BOTTOM_ITEMS.map(item => (
            <SidebarLink key={item.to} {...item} collapsed={collapsed} />
          ))}

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200 w-full ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Esci' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Esci</span>}
          </button>

          {/* Toggle collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-white/30 hover:text-white/60 transition-all duration-200 w-full ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Espandi menu' : 'Comprimi menu'}
          >
            {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            {!collapsed && <span className="text-xs">Comprimi</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'ml-[68px]' : 'ml-[240px]'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
