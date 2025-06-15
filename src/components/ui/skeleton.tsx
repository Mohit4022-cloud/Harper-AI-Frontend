import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: boolean
}

export function Skeleton({ className, animate = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-foreground/10 rounded-md',
        animate && 'animate-pulse',
        className
      )}
      {...props}
    />
  )
}