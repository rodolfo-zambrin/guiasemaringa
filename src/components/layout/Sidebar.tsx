'use client'
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
      icon: <LayoutDashboard size={18} />,
      label: 'Visão Geral',
    },
    {
      href: '/meta',
      icon: <BarChart2 size={18} />,
      label: 'Meta Ads',
      children: [
        { href: '/meta/campanhas', label: 'Campanhas' },
        { href: '/meta/conjuntos', label: 'Conjuntos' },
        { href: '/meta/anuncios', label: 'Anúncios' },
      ],
    },
    {
      href: '/google',
      icon: <Search size={18} />,
      label: 'Google Ads',
      children: [
        { href: '/google/campanhas', label: 'Campanhas' },
        { href: '/google/grupos', label: 'Grupos de Anúncios' },
        { href: '/google/keywords', label: 'Palavras-chave' },
      ],
    },
    {
      href: '/tempo-real',
      icon: <Activity size={18} />,
      label: 'Tempo Real',
      badge: (
        <span className="flex items-center gap-1 bg-[#EF4444]/15 text-[#EF4444] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-pulse-live" />
          AO VIVO
        </span>
      ),
    },
    {
      href: '/clientes',
      icon: <Users size={18} />,
      label: 'Clientes',
    },
    {
      href: '/alertas',
      icon: <Bell size={18} />,
      label: 'Alertas',
      badge:
        totalAlerts > 0 ? (
          <span className="bg-[#EF4444] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
            {totalAlerts > 99 ? '99+' : totalAlerts}
          </span>
        ) : undefined,
    },
    {
      href: '/configuracoes',
      icon: <Settings size={18} />,
      label: 'Configurações',
    },
  ]

  const adminItems: NavItem[] = [
    {
      href: '/admin/clientes',
      icon: <ShieldCheck size={18} />,
      label: 'Admin Clientes',
      children: [
        { href: '/admin/clientes', label: 'Lista de Clientes' },
        { href: '/admin/tokens', label: 'Tokens da Agência' },
      ],
    },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className={cn(
        'flex flex-col bg-[#1E293B] border-r border-[#334155] h-screen sticky top-0 transition-all duration-300 flex-shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[#334155] flex-shrink-0">
        {sidebarCollapsed ? (
          <div className="w-8 h-8 bg-[#263548] rounded-lg flex items-center justify-center overflow-hidden">
            <Image
              src="/logo-icon.png"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#263548] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Guia-se Maringá"
                width={28}
                height={28}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[#F1F5F9] leading-tight truncate">Guia-se</p>
              <p className="text-[10px] text-[#64748B] leading-tight truncate">Dashboard de Mídia</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = expandedItems.includes(item.href)
          const childActive = item.children?.some((c) => pathname.startsWith(c.href))

          return (
            <div key={item.href}>
              {hasChildren && !sidebarCollapsed ? (
                <button
                  onClick={() => toggleExpanded(item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    active || childActive
                      ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-l-2 border-[#3B82F6]'
                      : 'text-[#94A3B8] hover:bg-[#263548] hover:text-[#F1F5F9]'
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && <span>{item.badge}</span>}
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              ) : (
                <Link
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    sidebarCollapsed ? 'justify-center' : '',
                    active
                      ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-l-2 border-[#3B82F6]'
                      : 'text-[#94A3B8] hover:bg-[#263548] hover:text-[#F1F5F9]'
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
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
                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-[#334155] pl-3">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'block py-1.5 px-2 rounded text-xs font-medium transition-all',
                        pathname === child.href || pathname.startsWith(child.href + '/')
                          ? 'text-[#3B82F6]'
                          : 'text-[#64748B] hover:text-[#F1F5F9]'
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Admin section — super_admin only */}
      {profile?.role === 'super_admin' && (
        <>
          {!sidebarCollapsed && (
            <div className="px-3 pt-3 pb-1">
              <span className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Admin</span>
            </div>
          )}
          {adminItems.map((item) => {
            const active = isActive(item.href)
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItems.includes(item.href)
            const childActive = item.children?.some((c) => pathname.startsWith(c.href))
            return (
              <div key={item.href}>
                {hasChildren && !sidebarCollapsed ? (
                  <button
                    onClick={() => toggleExpanded(item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      active || childActive
                        ? 'bg-purple-500/15 text-purple-400 border-l-2 border-purple-400'
                        : 'text-[#94A3B8] hover:bg-[#263548] hover:text-[#F1F5F9]'
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      sidebarCollapsed ? 'justify-center' : '',
                      active
                        ? 'bg-purple-500/15 text-purple-400 border-l-2 border-purple-400'
                        : 'text-[#94A3B8] hover:bg-[#263548] hover:text-[#F1F5F9]'
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                  </Link>
                )}
                {hasChildren && !sidebarCollapsed && isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-[#334155] pl-3">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block py-1.5 px-2 rounded text-xs font-medium transition-all',
                          pathname === child.href || pathname.startsWith(child.href + '/')
                            ? 'text-purple-400'
                            : 'text-[#64748B] hover:text-[#F1F5F9]'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* User info */}
      {!sidebarCollapsed && profile && (
        <div className="border-t border-[#334155] px-3 py-3">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 bg-[#3B82F6]/20 rounded-full flex items-center justify-center text-[#3B82F6] font-bold text-sm flex-shrink-0">
              {profile.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#F1F5F9] truncate">{profile.name}</p>
              <span className="text-[10px] text-[#94A3B8]">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full text-xs text-[#64748B] hover:text-[#EF4444] transition px-1 py-1 rounded hover:bg-[#EF4444]/10"
          >
            <LogOut size={13} />
            Sair
          </button>
        </div>
      )}

      {/* Collapse button */}
      <div className={cn('border-t border-[#334155] p-2', sidebarCollapsed ? 'flex justify-center' : '')}>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-[#475569] hover:text-[#94A3B8] hover:bg-[#263548] transition"
          title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
