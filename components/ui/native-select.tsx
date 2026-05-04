import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

interface NativeSelectProps extends ComponentProps<'select'> {
  label?: string
}

export function NativeSelect({ label, className, id, ...props }: NativeSelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium uppercase tracking-wider text-[#9C8578]"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'w-full cursor-pointer appearance-none rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2.5',
          'text-sm text-[#FAF6F2]',
          'focus:border-[#5E8B8C] focus:outline-none focus:ring-1 focus:ring-[#5E8B8C]/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-150',
          className
        )}
        {...props}
      />
    </div>
  )
}
