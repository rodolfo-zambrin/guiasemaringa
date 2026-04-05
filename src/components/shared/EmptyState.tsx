import { cn } from '@/lib/utils/cn'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="text-[#475569] mb-4">
        {icon ?? <Inbox size={40} />}
      </div>
      <h3 className="text-base font-semibold text-[#F1F5F9] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#94A3B8] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
