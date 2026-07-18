'use client'

import React from 'react'
import { HeaderControlsProvider, useHeaderControls } from '@/components/layout/header-controls-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Menu } from 'lucide-react'

function MainHeader() {
  const { title, subtitle, controls } = useHeaderControls()

  return (
    <header className="hidden lg:flex sticky top-0 z-30 h-16 min-h-[64px] border-b border-[#D5C3B6]/10 bg-[#1C1917] px-4 lg:px-8">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="flex h-full items-center gap-3">
          <button className="lg:hidden p-2 rounded-md text-[#D5C3B6] hover:bg-[#2D3C3C]">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-col justify-center">
            <div className="text-lg font-semibold text-[#FAF6F2]">{title ?? 'NeiFe'}</div>
            {subtitle && <div className="text-xs text-[#9C8578] mt-0.5">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">{controls}</div>
      </div>
    </header>
  )
}

export default function BrokerShell({
  children,
  role = 'broker',
  userName,
  userId,
}: {
  children: React.ReactNode
  role?: 'broker' | 'landlord' | 'tenant'
  userName?: string
  userId?: string
}) {
  return (
    <HeaderControlsProvider>
      <div className="flex min-h-screen flex-col bg-background lg:flex-row">
        <Sidebar role={role} userName={userName} userId={userId} />
        <div className="flex-1 flex flex-col">
          <MainHeader />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </HeaderControlsProvider>
  )
}
