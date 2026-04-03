'use client'

import { useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { CapabilityValue } from '@/lib/model-config-contract'
import {
  encodeModelKey,
  getProviderDisplayName,
  parseModelKey,
  useProviders,
} from '../api-config'
import { DefaultModelCards } from './DefaultModelCards'
import { useApiConfigFilters } from './hooks/useApiConfigFilters'



function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isCapabilityValue(value: unknown): value is CapabilityValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function extractCapabilityFieldsFromModel(
  capabilities: Record<string, unknown> | undefined,
  modelType: string,
): Array<{ field: string; options: CapabilityValue[] }> {
  if (!capabilities) return []
  const namespace = capabilities[modelType]
  if (!isRecord(namespace)) return []
  return Object.entries(namespace)
    .filter(([key, value]) => key.endsWith('Options') && Array.isArray(value) && value.every(isCapabilityValue) && value.length > 0)
    .map(([key, value]) => ({
      field: key.slice(0, -'Options'.length),
      options: value as CapabilityValue[],
    }))
}

function parseBySample(input: string, sample: CapabilityValue): CapabilityValue {
  if (typeof sample === 'number') return Number(input)
  if (typeof sample === 'boolean') return input === 'true'
  return input
}

function toCapabilityFieldLabel(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())
}

export function ApiConfigTabContainer() {
  const locale = useLocale()
  const {
    providers,
    models,
    defaultModels,
    workflowConcurrency,
    capabilityDefaults,
    loading,
    saveStatus,
    flushConfig,
    updateProviderHidden,
    updateProviderApiKey,
    updateProviderBaseUrl,
    reorderProviders,
    addProvider,
    deleteProvider,
    toggleModel,
    deleteModel,
    addModel,
    updateModel,
    updateDefaultModel,
    batchUpdateDefaultModels,
    updateWorkflowConcurrency,
    updateCapabilityDefault,
  } = useProviders()

  const t = useTranslations('apiConfig')
  const tc = useTranslations('common')

  const {
    getEnabledModelsByType,
  } = useApiConfigFilters({
    providers,
    models,
  })

  const handleWorkflowConcurrencyChange = useCallback(
    (field: 'analysis' | 'image' | 'video', rawValue: string) => {
      const parsed = Number.parseInt(rawValue, 10)
      if (!Number.isFinite(parsed) || parsed <= 0) return
      updateWorkflowConcurrency(field, parsed)
    },
    [updateWorkflowConcurrency],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-[#737373]">
        {tc('loading')}
      </div>
    )
  }



  return (
    <div>
      <DefaultModelCards
            t={t}
            defaultModels={defaultModels}
            getEnabledModelsByType={getEnabledModelsByType}
            parseModelKey={parseModelKey}
            encodeModelKey={encodeModelKey}
            getProviderDisplayName={getProviderDisplayName}
            locale={locale}
            updateDefaultModel={updateDefaultModel}
            batchUpdateDefaultModels={batchUpdateDefaultModels}
            extractCapabilityFieldsFromModel={extractCapabilityFieldsFromModel}
            toCapabilityFieldLabel={toCapabilityFieldLabel}
            capabilityDefaults={capabilityDefaults}
            updateCapabilityDefault={updateCapabilityDefault}
            parseBySample={parseBySample}
            workflowConcurrency={workflowConcurrency}
            handleWorkflowConcurrencyChange={handleWorkflowConcurrencyChange}
          />
    </div>
  )
}
