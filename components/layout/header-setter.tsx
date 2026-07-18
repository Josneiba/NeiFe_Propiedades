'use client'

import React, { type ReactNode } from 'react'
import { usePageHeader } from '@/components/layout/header-controls-context'

export default function HeaderSetter({ title, subtitle, controls, children }: { title?: string; subtitle?: string; controls?: ReactNode; children?: ReactNode }) {
  usePageHeader({ title: title ?? null, subtitle: subtitle ?? null, controls: controls ?? null }, [title, subtitle, controls])
  return <>{children}</>
}
