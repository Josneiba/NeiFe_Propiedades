import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#FAF6F2] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[#9C8578] leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
