'use client'
import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Menu, X } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 h-full w-56">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 h-14 px-4 bg-[#1E293B] border-b border-[#334155] flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#263548] rounded-lg transition"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-[#F1F5F9]">AG Perform</span>
        </div>
        {children}
      </main>
    </div>
  )
}
