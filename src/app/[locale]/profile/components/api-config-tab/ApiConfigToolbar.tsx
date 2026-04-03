'use client'

import type { ComponentProps } from 'react'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { AppIcon } from '@/components/ui/icons'

interface ApiConfigToolbarProps {
  title: string
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  savingState: ComponentProps<typeof TaskStatusInline>['state'] | null
  savingLabel: string
  savedLabel: string
  saveFailedLabel: string
}

export function ApiConfigToolbar({
  title,
  saveStatus,
  savingState,
  savingLabel,
  savedLabel,
  saveFailedLabel,
}: ApiConfigToolbarProps) {
  return (
    <div className="flex items-center gap-2 text-xs min-h-[20px]">
      {saveStatus === 'saving' && (
        <span className="flex items-center gap-1 text-[#737373]">
          <TaskStatusInline state={savingState} className="[&>span]:sr-only" />
          <span>{savingLabel}</span>
        </span>
      )}
      {saveStatus === 'saved' && (
        <span className="flex items-center gap-1 text-[#16a34a]">
          <AppIcon name="check" className="w-3.5 h-3.5" />
          {savedLabel}
        </span>
      )}
      {saveStatus === 'error' && (
        <span className="flex items-center gap-1 text-[#dc2626]">
          <AppIcon name="close" className="w-3.5 h-3.5" />
          {saveFailedLabel}
        </span>
      )}
    </div>
  )
}
