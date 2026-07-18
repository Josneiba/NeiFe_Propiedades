'use client'

import React from 'react'
import { HeaderControlsProvider, useHeaderControls } from '@/components/layout/header-controls-context'
import { Sidebar } from '@/components/layout/sidebar'

function MainHeader() {
  const { controls } = useHeaderControls()

  return (
    <header className="sticky top-0 z-30 border-b border-[#D5C3B6]/10 bg-[#1C1917] px-4 py-3 lg:px-8">
      <div className="flex items-center justify-between">
        <div />
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
