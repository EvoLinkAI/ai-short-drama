'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import { useAssetActions } from '@/lib/query/hooks'

export interface PropEditModalProps {
  mode: 'asset-hub' | 'project'
  propId: string
  propName: string
  summary: string
  variantId?: string
  projectId?: string
  onClose: () => void
  onRefresh?: () => void
}

export function PropEditModal({
  mode,
  propId,
  propName,
  summary,
  variantId,
  projectId,
  onClose,
  onRefresh,
}: PropEditModalProps) {
  const t = useTranslations('assets')
  const actions = useAssetActions({
    scope: mode === 'asset-hub' ? 'global' : 'project',
    projectId,
    kind: 'prop',
  })
  const [editingName, setEditingName] = useState(propName)
  const [editingSummary, setEditingSummary] = useState(summary)
  const [isSaving, setIsSaving] = useState(false)
  const savingState = isSaving
    ? resolveTaskPresentationState({
      phase: 'processing',
      intent: 'process',
      resource: 'text',
      hasOutput: false,
    })
    : null

  const persist = async () => {
    await actions.update(propId, {
      name: editingName.trim(),
      summary: editingSummary.trim(),
    })
    if (variantId) {
      await actions.updateVariant(propId, variantId, {
        description: editingSummary.trim(),
      })
    }
    onRefresh?.()
  }

  const handleSaveOnly = async () => {
    if (!editingName.trim() || !editingSummary.trim()) return
    try {
      setIsSaving(true)
      await persist()
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndGenerate = async () => {
    if (!editingName.trim() || !editingSummary.trim()) return
    try {
      setIsSaving(true)
      await persist()
      await actions.generate({ id: propId })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
      <div className="glass-surface-modal max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
              {t('modal.editProp')} - {propName}
            </h3>
            <button
              onClick={onClose}
              className="glass-btn-base glass-btn-soft w-9 h-9 rounded-full text-[var(--glass-text-tertiary)]"
            >
              <AppIcon name="close" className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="glass-field-label block">
              {t('prop.name')}
            </label>
            <input
              type="text"
              value={editingName}
              onChange={(event) => setEditingName(event.target.value)}
              className="glass-input-base w-full px-3 py-2"
              placeholder={t('modal.namePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="glass-field-label block">
              {t('prop.summary')}
            </label>
            <textarea
              value={editingSummary}
              onChange={(event) => setEditingSummary(event.target.value)}
              className="glass-textarea-base w-full h-48 px-3 py-2 resize-none"
              placeholder={t('prop.summaryPlaceholder')}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end p-4 border-t border-[var(--glass-stroke-base)] bg-[var(--glass-bg-surface-strong)] rounded-b-lg flex-shrink-0">
          <button
            onClick={onClose}
            className="glass-btn-base glass-btn-secondary px-4 py-2 rounded-lg"
            disabled={isSaving}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => void handleSaveOnly()}
            disabled={isSaving || !editingName.trim() || !editingSummary.trim()}
            className="glass-btn-base glass-btn-tone-info px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <TaskStatusInline state={savingState} className="text-white [&>span]:text-white [&_svg]:text-white" />
            ) : (
              t('modal.saveOnly')
            )}
          </button>
          <button
            onClick={() => void handleSaveAndGenerate()}
            disabled={isSaving || !editingName.trim() || !editingSummary.trim()}
            className="glass-btn-base glass-btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('modal.saveAndGenerate')}
          </button>
        </div>
      </div>
    </div>
  )
}
