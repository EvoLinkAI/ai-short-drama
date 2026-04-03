import { Sparkles } from 'lucide-react'
import { useId } from 'react'

interface AISparklesIconProps {
  className?: string
}

export default function AISparklesIcon({ className }: AISparklesIconProps) {
  const gradientId = useId().replace(/:/g, '')

  return (
    <Sparkles className={className} stroke={`url(#${gradientId})`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="52%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </Sparkles>
  )
}
