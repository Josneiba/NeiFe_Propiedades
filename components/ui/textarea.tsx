import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-[80px] w-full resize-none rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-sm text-[#FAF6F2] placeholder:text-[#9C8578]/50 outline-none transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-[#5E8B8C] focus-visible:ring-1 focus-visible:ring-[#5E8B8C]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
