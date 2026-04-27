'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart2,
  Search,
  Activity,
  Users,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useDashboardStore } from '@/store/dashboardStore'
import { useAuth } from '@/hooks/useAuth'
import { useAlertCount } from '@/hooks/useAlerts'
import { useState } from 'react'

interface NavItem {
  href: string
  icon: React.ReactNode
  label: string
  badge?: React.ReactNode
  children?: { href: string; label: string }[]
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  analyst: 'Analista',
  client_view: 'Cliente',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#A855F7',
  analyst: '#3B82F6',
  client_view: '#22C55E',
}

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useDashboardStore()
  const { profile, signOut } = useAuth()
  const { data: alertCount } = useAlertCount()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    )
  }

  const totalAlerts = (alertCount?.critical ?? 0) + (alertCount?.warning ?? 0)

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard size={17} />,
      label: 'Visão Geral',
    },
    {
      href: '/meta',
      icon: <BarChart2 size={17} />,
      label: 'Meta Ads',
      children: [
        { href: '/meta/campanhas', label: 'Campanhas' },
        { href: '/meta/conjuntos', label: 'Conjuntos' },
        { href: '/meta/anuncios', label: 'Anúncios' },
      ],
    },
    {
      href: '/google',
      icon: <Search size={17} />,
      label: 'Google Ads',
      children: [
        { href: '/google/campanhas', label: 'Campanhas' },
        { href: '/google/grupos', label: 'Grupos de Anúncios' },
        { href: '/google/keywords', label: 'Palavras-chave' },
      ],
    },
    {
      href: '/tempo-real',
      icon: <Activity size={17} />,
      label: 'Tempo Real',
      badge: (
        <span className="flex items-center gap-1 bg-danger-bg text-danger text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          <span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse-live" />
          AO VIVO
        </span>
      ),
    },
    {
      href: '/clientes',
      icon: <Users size={17} />,
      label: 'Clientes',
    },
    {
      href: '/alertas',
      icon: <Bell size={17} />,
      label: 'Alertas',
      badge:
        totalAlerts > 0 ? (
          <span className="bg-danger text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            {totalAlerts > 99 ? '99+' : totalAlerts}
          </span>
        ) : undefined,
    },
    {
      href: '/configuracoes',
      icon: <Settings size={17} />,
      label: 'Configurações',
    },
  ]

  const adminItems: NavItem[] = [
    {
      href: '/admin/clientes',
      icon: <ShieldCheck size={17} />,
      label: 'Admin Clientes',
      children: [
        { href: '/admin/clientes', label: 'Lista de Clientes' },
        { href: '/admin/tokens', label: 'Tokens da Agência' },
      ],
    },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const renderNavItem = (item: NavItem, isAdmin = false) => {
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.href)
    const childActive = item.children?.some((c) => pathname.startsWith(c.href))
    const accentColor = isAdmin ? '#A855F7' : '#3B82F6'
    const activeBg = isAdmin ? 'bg-purple-500/12 text-purple-400' : 'bg-active-bg text-info shadow-[inset_0_0_20px_rgba(56,189,248,0.05)]'
    const activeBorder = isAdmin ? 'border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'border-info shadow-[0_0_10px_rgba(56,189,248,0.4)]'
    const activeChildText = isAdmin ? 'text-purple-400' : 'text-info'

    return (
      <div key={item.href}>
        {hasChildren && !sidebarCollapsed ? (
          <button
            onClick={() => toggleExpanded(item.href)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
              active || childActive
                ? `${activeBg} border-l-[3px] ${activeBorder}`
                : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
            )}
          >
            <span className={cn('flex-shrink-0 transition-transform duration-200', (active || childActive) && 'scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]')}>{item.icon}</span>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.badge && <span>{item.badge}</span>}
            <span className="text-[#475569]">
              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </span>
          </button>
        ) : (
          <Link
            href={item.href}
            title={sidebarCollapsed ? item.label : undefined}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
              sidebarCollapsed ? 'justify-center' : '',
              active
                ? `${activeBg} border-l-[3px] ${activeBorder}`
                : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
            )}
          >
            <span className={cn('flex-shrink-0 transition-transform duration-200', active && 'scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]')}>{item.icon}</span>
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && <span>{item.badge}</span>}
              </>
            )}
          </Link>
        )}

        {/* Sub-items */}
        {hasChildren && !sidebarCollapsed && isExpanded && (
          <div className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-3">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'block py-1.5 px-2 rounded text-xs font-medium transition-all duration-200 cursor-pointer',
                  pathname === child.href || pathname.startsWith(child.href + '/')
                    ? `${activeChildText} font-semibold bg-active-bg/50`
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  const roleColor = ROLE_COLORS[profile?.role ?? ''] ?? '#3B82F6'
  const userInitial = profile?.name?.charAt(0).toUpperCase() ?? 'U'

  return (
    <aside
      className={cn(
        'flex flex-col glass-panel-heavy border-r border-border border-y-0 border-l-0 h-screen sticky top-0 transition-all duration-300 flex-shrink-0 z-50',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border flex-shrink-0">
        {sidebarCollapsed ? (
          <div className="w-8 h-8 bg-[#1a2744] border border-[#243355] rounded-lg flex items-center justify-center overflow-hidden">
            <Image
              src="/logo-icon.png"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-surface border border-border shadow-glass rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Guia-se Maringá"
                width={28}
                height={28}
                className="object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[#E2E8F0] leading-tight truncate">Guia-se</p>
              <p className="text-[10px] text-[#475569] leading-tight truncate tracking-wide">Dashboard de Mídia</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {!sidebarCollapsed && (
          <p className="text-[9px] font-bold text-[#334155] uppercase tracking-[0.15em] px-3 pb-2 pt-1">
            Navegação
          </p>
        )}
        {navItems.map((item) => renderNavItem(item, false))}
      </nav>

      {/* Admin section — super_admin only */}
      {profile?.role === 'super_admin' && (
        <div className="px-2 pb-2">
          {!sidebarCollapsed && (
            <div className="border-t border-[#1e2d3d] pt-3 pb-1.5">
              <p className="text-[9px] font-bold text-[#334155] uppercase tracking-[0.15em] px-3">Admin</p>
            </div>
          )}
          {sidebarCollapsed && <div className="border-t border-[#1e2d3d] my-2" />}
          {adminItems.map((item) => renderNavItem(item, true))}
        </div>
      )}

      {/* User info */}
      {!sidebarCollapsed && profile && (
        <div className="border-t border-border px-3 py-3">
          <div className="flex items-center gap-2.5 mb-2.5 cursor-default">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-offset-2 ring-offset-background shadow-glass"
              style={{ backgroundColor: roleColor, '--tw-ring-color': `${roleColor}50` } as React.CSSProperties}
            >
              {userInitial}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{profile.name}</p>
              <span className="text-[10px]" style={{ color: roleColor }}>
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 w-full text-xs font-medium text-text-muted hover:text-danger transition-colors duration-200 px-1 py-2 rounded-lg border border-transparent hover:border-danger/30 hover:bg-danger-bg cursor-pointer"
          >
            <LogOut size={13} />
            Sair da Plataforma
          </button>
        </div>
      )}

      {/* Collapse button */}
      <div className={cn('border-t border-border p-2', sidebarCollapsed ? 'flex justify-center' : '')}>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-text-muted hover:text-info hover:bg-white/5 transition-all duration-200 cursor-pointer"
          title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </aside>
  )
}
