'use client'

import React, { useState, useCallback } from 'react'
import { AppIcon } from '@/components/ui/icons'
import type { AppIconName } from '@/components/ui/icons'
import { ModelCapabilityDropdown } from '@/components/ui/config-modals/ModelCapabilityDropdown'
import type { CapabilityValue, ModelCapabilities } from '@/lib/model-config-contract'

// ---------- types ----------
type ModelType = 'llm' | 'image' | 'video' | 'audio' | 'lipsync' | 'voicedesign'

interface ModelOption {
    modelKey: string
    name: string
    provider: string
    providerName?: string
    capabilities?: ModelCapabilities
}

type DefaultModelField =
    | 'analysisModel'
    | 'characterModel'
    | 'locationModel'
    | 'storyboardModel'
    | 'editModel'
    | 'videoModel'
    | 'audioModel'
    | 'lipSyncModel'
    | 'voiceDesignModel'

interface DefaultModelCardsProps {
    t: (key: string) => string
    defaultModels: {
        analysisModel?: string
        characterModel?: string
        locationModel?: string
        storyboardModel?: string
        editModel?: string
        videoModel?: string
        audioModel?: string
        lipSyncModel?: string
        voiceDesignModel?: string
    }
    getEnabledModelsByType: (type: ModelType) => ModelOption[]
    parseModelKey: (key: string | undefined | null) => { provider: string; modelId: string } | null
    encodeModelKey: (provider: string, modelId: string) => string
    getProviderDisplayName: (providerId: string, locale: string) => string
    locale: string
    updateDefaultModel: (field: string, value: string, capFields?: Array<{ field: string; options: CapabilityValue[] }>) => void
    batchUpdateDefaultModels: (fields: string[], value: string, capFields?: Array<{ field: string; options: CapabilityValue[] }>) => void
    extractCapabilityFieldsFromModel: (
        caps: Record<string, unknown> | undefined,
        modelType: string,
    ) => Array<{ field: string; options: CapabilityValue[] }>
    toCapabilityFieldLabel: (field: string) => string
    capabilityDefaults: Record<string, Record<string, CapabilityValue>>
    updateCapabilityDefault: (modelKey: string, field: string, value: CapabilityValue | null) => void
    parseBySample: (input: string, sample: CapabilityValue) => CapabilityValue
    workflowConcurrency: { analysis: number; image: number; video: number }
    handleWorkflowConcurrencyChange: (field: 'analysis' | 'image' | 'video', rawValue: string) => void
}

// ---------- helpers ----------
function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}
function isCapabilityValue(value: unknown): value is CapabilityValue {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function resolveModel(
    field: DefaultModelField,
    modelType: ModelType,
    defaultModels: DefaultModelCardsProps['defaultModels'],
    getEnabledModelsByType: DefaultModelCardsProps['getEnabledModelsByType'],
    parseModelKey: DefaultModelCardsProps['parseModelKey'],
    encodeModelKey: DefaultModelCardsProps['encodeModelKey'],
) {
    const options = getEnabledModelsByType(modelType)
    const currentKey = defaultModels[field]
    const parsed = parseModelKey(currentKey)
    const normalizedKey = parsed ? encodeModelKey(parsed.provider, parsed.modelId) : ''
    const current = normalizedKey ? options.find((option) => option.modelKey === normalizedKey) ?? null : null
    return { options, normalizedKey, current }
}

function computeCapabilityFields(current: ModelOption | null, modelType: keyof ModelCapabilities) {
    if (!current || !current.capabilities) return [] as Array<{ field: string; options: CapabilityValue[] }>
    const namespace = current.capabilities[modelType]
    if (!isRecord(namespace)) return [] as Array<{ field: string; options: CapabilityValue[] }>
    return Object.entries(namespace)
        .filter(([key, value]) => key.endsWith('Options') && Array.isArray(value) && value.every(isCapabilityValue) && value.length > 0)
        .map(([key, value]) => ({
            field: key.slice(0, -'Options'.length),
            options: value as CapabilityValue[],
        }))
}

// ---------- sub-components ----------

/** Smart model selector: ModelCapabilityDropdown for llm/image/video, native select for others */
function SmartSelector({
    field,
    modelType,
    options,
    normalizedKey,
    current,
    placeholder,
    locale,
    t,
    props,
}: {
    field: DefaultModelField
    modelType: ModelType
    options: ModelOption[]
    normalizedKey: string
    current: ModelOption | null
    placeholder: string
    locale: string
    t: (key: string) => string
    props: DefaultModelCardsProps
}) {
    const capabilityFields = computeCapabilityFields(current, modelType as keyof ModelCapabilities)

    if (modelType === 'video' || modelType === 'image' || modelType === 'llm') {
        return (
            <ModelCapabilityDropdown
                models={options.map((opt) => ({
                    value: opt.modelKey,
                    label: opt.name,
                    provider: opt.provider,
                    providerName: '',
                }))}
                value={normalizedKey || undefined}
                onModelChange={(newModelKey) => {
                    const newModel = options.find((opt) => opt.modelKey === newModelKey)
                    const newCapFields = props.extractCapabilityFieldsFromModel(
                        newModel?.capabilities as Record<string, unknown> | undefined,
                        modelType,
                    )
                    props.updateDefaultModel(field, newModelKey, newCapFields)
                }}
                capabilityFields={capabilityFields.map((d) => ({
                    ...d,
                    label: props.toCapabilityFieldLabel(d.field),
                }))}
                capabilityOverrides={
                    current
                        ? Object.fromEntries(
                            capabilityFields
                                .filter((d) => props.capabilityDefaults[current.modelKey]?.[d.field] !== undefined)
                                .map((d) => [d.field, props.capabilityDefaults[current.modelKey][d.field]])
                        )
                        : {}
                }
                onCapabilityChange={(capField, rawValue, sample) => {
                    if (!current) return
                    if (!rawValue) {
                        props.updateCapabilityDefault(current.modelKey, capField, null)
                        return
                    }
                    props.updateCapabilityDefault(current.modelKey, capField, props.parseBySample(rawValue, sample))
                }}
                placeholder={placeholder}
            />
        )
    }

    // Native select for audio / lipsync / voicedesign
    return (
        <div className="relative">
            <select
                value={normalizedKey}
                onChange={(event) => props.updateDefaultModel(field, event.target.value)}
                className="w-full border border-[#e5e5e5] rounded-lg appearance-none px-3 py-2 text-sm text-[#171717] focus:outline-none focus:border-black transition-colors"
            >
                <option value="">{placeholder}</option>
                {options.map((option, index) => (
                    <option key={`${option.modelKey}-${index}`} value={option.modelKey}>
                        {option.name}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#737373]">
                <AppIcon name="chevronDown" className="h-4 w-4" />
            </div>
        </div>
    )
}

// ---------- main component ----------

export function DefaultModelCards(allProps: DefaultModelCardsProps) {
    const {
        t,
        defaultModels,
        getEnabledModelsByType,
        parseModelKey,
        encodeModelKey,
        getProviderDisplayName,
        locale,
        updateDefaultModel,
        extractCapabilityFieldsFromModel,
        workflowConcurrency,
        handleWorkflowConcurrencyChange,
    } = allProps

    // Pipeline unified override state
    const [pipelineGlobalKey, setPipelineGlobalKey] = useState('')
    const [pipelineGlobalCapOverrides, setPipelineGlobalCapOverrides] = useState<Record<string, CapabilityValue>>({})
    const pipelineGlobalOptions = getEnabledModelsByType('image')
    const pipelineGlobalCurrent = pipelineGlobalOptions.find((opt) => opt.modelKey === pipelineGlobalKey) ?? null
    const pipelineGlobalCapFields = computeCapabilityFields(pipelineGlobalCurrent, 'image')

    const handlePipelineGlobalChange = useCallback((newModelKey: string) => {
        setPipelineGlobalKey(newModelKey)
        setPipelineGlobalCapOverrides({})
        if (newModelKey) {
            const pipelineFields = ['characterModel', 'locationModel', 'storyboardModel', 'editModel']
            const newModel = pipelineGlobalOptions.find((opt) => opt.modelKey === newModelKey)
            const newCapFields = extractCapabilityFieldsFromModel(
                newModel?.capabilities as Record<string, unknown> | undefined,
                'image',
            )
            allProps.batchUpdateDefaultModels(pipelineFields, newModelKey, newCapFields)
        }
    }, [pipelineGlobalOptions, extractCapabilityFieldsFromModel, allProps])

    const handlePipelineGlobalCapChange = useCallback((field: string, rawValue: string, sample: CapabilityValue) => {
        if (!pipelineGlobalCurrent) return
        const parsed = allProps.parseBySample(rawValue, sample)
        setPipelineGlobalCapOverrides((prev) => ({ ...prev, [field]: parsed }))
        // Batch update all 4 pipeline fields
        const pipelineFields = ['characterModel', 'locationModel', 'storyboardModel', 'editModel']
        for (const pField of pipelineFields) {
            allProps.updateCapabilityDefault(pipelineGlobalCurrent.modelKey, field, parsed)
            // Also update each individual pipeline model's capability if they share the same model
            const resolvedField = defaultModels[pField as DefaultModelField]
            if (resolvedField === pipelineGlobalCurrent.modelKey) {
                allProps.updateCapabilityDefault(resolvedField, field, parsed)
            }
        }
    }, [pipelineGlobalCurrent, allProps, defaultModels])

    // Resolve all models
    const textModel = resolveModel('analysisModel', 'llm', defaultModels, getEnabledModelsByType, parseModelKey, encodeModelKey)
    const videoModel = resolveModel('videoModel', 'video', defaultModels, getEnabledModelsByType, parseModelKey, encodeModelKey)
    const audioModel = resolveModel('audioModel', 'audio', defaultModels, getEnabledModelsByType, parseModelKey, encodeModelKey)
    const lipsyncModel = resolveModel('lipSyncModel', 'lipsync', defaultModels, getEnabledModelsByType, parseModelKey, encodeModelKey)
    const voiceDesignModel = resolveModel('voiceDesignModel', 'voicedesign', defaultModels, getEnabledModelsByType, parseModelKey, encodeModelKey)

    const pipelineItems: Array<{
        field: DefaultModelField
        modelType: ModelType
        titleKey: string
        icon: AppIconName
    }> = [
            { field: 'characterModel', modelType: 'image', titleKey: 'defaultModelSection.pipelineCharacter', icon: 'user' },
            { field: 'locationModel', modelType: 'image', titleKey: 'defaultModelSection.pipelineLocation', icon: 'image' },
            { field: 'storyboardModel', modelType: 'image', titleKey: 'defaultModelSection.pipelineStoryboard', icon: 'film' },
            { field: 'editModel', modelType: 'image', titleKey: 'defaultModelSection.pipelineEdit', icon: 'edit' },
        ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-sm font-semibold text-[#171717]">{t('defaultModels')}</h3>
                <p className="text-xs text-[#737373] mt-0.5">{t('defaultModel.hint')}</p>
            </div>

            {/* ===== Section 1: Text & Video ===== */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#525252] uppercase tracking-wider">{t('defaultModelSection.coreFoundation')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Text Analysis Model Card */}
                    <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-medium text-[#171717]">{t('defaultModelSection.coreTextTitle')}</h4>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[#737373]">{t('workflowConcurrency.analysis')}</span>
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={workflowConcurrency.analysis}
                                    onChange={(event) => handleWorkflowConcurrencyChange('analysis', event.target.value)}
                                    className="w-12 h-7 border border-[#e5e5e5] rounded px-1.5 text-xs text-center focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-[#737373]">{t('defaultModelDesc.analysisModel')}</p>
                        <SmartSelector
                            field="analysisModel" modelType="llm"
                            options={textModel.options} normalizedKey={textModel.normalizedKey} current={textModel.current}
                            placeholder={t('defaultModelSection.corePlaceholder')}
                            locale={locale} t={t} props={allProps}
                        />
                    </div>

                    {/* Video Model Card */}
                    <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-medium text-[#171717]">{t('defaultModelSection.coreVideoTitle')}</h4>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[#737373]">{t('workflowConcurrency.video')}</span>
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={workflowConcurrency.video}
                                    onChange={(event) => handleWorkflowConcurrencyChange('video', event.target.value)}
                                    className="w-12 h-7 border border-[#e5e5e5] rounded px-1.5 text-xs text-center focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-[#737373]">{t('defaultModelDesc.videoModel')}</p>
                        <SmartSelector
                            field="videoModel" modelType="video"
                            options={videoModel.options} normalizedKey={videoModel.normalizedKey} current={videoModel.current}
                            placeholder={t('defaultModelSection.corePlaceholder')}
                            locale={locale} t={t} props={allProps}
                        />
                    </div>
                </div>
            </div>

            {/* ===== Section 2: Image Generation ===== */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#525252] uppercase tracking-wider">{t('defaultModelSection.creativePipeline')}</h4>

                {/* Global Image Model Card */}
                <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xs font-medium text-[#171717]">{t('defaultModelSection.unifiedOverride')}</h4>
                            <p className="text-xs text-[#737373] mt-0.5">{t('defaultModelSection.unifiedOverrideHint')}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#737373]">{t('workflowConcurrency.image')}</span>
                            <input
                                type="number"
                                min={1}
                                step={1}
                                value={workflowConcurrency.image}
                                onChange={(event) => handleWorkflowConcurrencyChange('image', event.target.value)}
                                className="w-12 h-7 border border-[#e5e5e5] rounded px-1.5 text-xs text-center focus:outline-none focus:border-black"
                            />
                        </div>
                    </div>
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#fafafa] border border-[#e5e5e5] text-[#525252]">
                        <AppIcon name="alert" className="w-4 h-4 shrink-0 mt-0.5 text-[#737373]" />
                        <span className="text-xs leading-relaxed">{t('imageModelTip')}</span>
                    </div>
                    <ModelCapabilityDropdown
                        models={pipelineGlobalOptions.map((opt) => ({
                            value: opt.modelKey,
                            label: opt.name,
                            provider: opt.provider,
                            providerName: '',
                        }))}
                        value={pipelineGlobalKey || undefined}
                        onModelChange={handlePipelineGlobalChange}
                        capabilityFields={pipelineGlobalCapFields.map((d) => ({
                            ...d,
                            label: allProps.toCapabilityFieldLabel(d.field),
                        }))}
                        capabilityOverrides={pipelineGlobalCapOverrides}
                        onCapabilityChange={handlePipelineGlobalCapChange}
                        placeholder={t('defaultModelSection.unifiedOverridePlaceholder')}
                    />
                </div>

                {/* 4 pipeline cards grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {pipelineItems.map((item) => {
                        const resolved = resolveModel(item.field, item.modelType, defaultModels, getEnabledModelsByType, parseModelKey, encodeModelKey)
                        return (
                            <div key={item.field} className="border border-[#e5e5e5] rounded-lg p-3 space-y-2">
                                <h4 className="text-xs font-medium text-[#525252]">{t(item.titleKey)}</h4>
                                <SmartSelector
                                    field={item.field} modelType={item.modelType}
                                    options={resolved.options} normalizedKey={resolved.normalizedKey} current={resolved.current}
                                    placeholder={t('defaultModelSection.followUnified')}
                                    locale={locale} t={t} props={allProps}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ===== Section 3: Extensions ===== */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-[#525252] uppercase tracking-wider">{t('defaultModelSection.extensions')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Lip Sync */}
                    <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-2">
                        <h4 className="text-xs font-medium text-[#525252]">{t('defaultModelSection.extLipSync')}</h4>
                        <SmartSelector
                            field="lipSyncModel" modelType="lipsync"
                            options={lipsyncModel.options} normalizedKey={lipsyncModel.normalizedKey} current={lipsyncModel.current}
                            placeholder={t('defaultModelSection.extPlaceholder')}
                            locale={locale} t={t} props={allProps}
                        />
                    </div>
                    {/* TTS */}
                    <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-2">
                        <h4 className="text-xs font-medium text-[#525252]">{t('defaultModelSection.extTTS')}</h4>
                        <SmartSelector
                            field="audioModel" modelType="audio"
                            options={audioModel.options} normalizedKey={audioModel.normalizedKey} current={audioModel.current}
                            placeholder={t('defaultModelSection.extPlaceholder')}
                            locale={locale} t={t} props={allProps}
                        />
                    </div>
                    {/* Voice Design */}
                    <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-2">
                        <h4 className="text-xs font-medium text-[#525252]">{t('defaultModelSection.extVoiceDesign')}</h4>
                        <SmartSelector
                            field="voiceDesignModel" modelType="voicedesign"
                            options={voiceDesignModel.options} normalizedKey={voiceDesignModel.normalizedKey} current={voiceDesignModel.current}
                            placeholder={t('defaultModelSection.extPlaceholder')}
                            locale={locale} t={t} props={allProps}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
