'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { resolveTaskErrorMessage } from '@/lib/task/error-message'
import type { MediaRef } from '@/types/project'
import { apiFetch } from '@/lib/api-fetch'
import { useAssets } from './useAssets'
import { groupAssetsByKind } from '@/lib/assets/grouping'

// ============ 类型定义 ============
export interface GlobalCharacterAppearance {
    id: string
    appearanceIndex: number
    changeReason: string
    artStyle: string | null
    description: string | null
    descriptionSource: string | null
    imageUrl: string | null
    media?: MediaRef | null
    imageUrls: string[]
    imageMedias?: MediaRef[]
    selectedIndex: number | null
    previousImageUrl: string | null
    previousMedia?: MediaRef | null
    previousImageUrls: string[]
    previousImageMedias?: MediaRef[]
    imageTaskRunning: boolean
    lastError?: { code: string; message: string } | null
}

export interface GlobalCharacter {
    id: string
    name: string
    folderId: string | null
    customVoiceUrl: string | null
    media?: MediaRef | null
    appearances: GlobalCharacterAppearance[]
}

export interface GlobalLocationImage {
    id: string
    imageIndex: number
    description: string | null
    imageUrl: string | null
    media?: MediaRef | null
    previousImageUrl: string | null
    previousMedia?: MediaRef | null
    isSelected: boolean
    imageTaskRunning: boolean
    lastError?: { code: string; message: string } | null
}

export interface GlobalLocation {
    id: string
    name: string
    summary: string | null
    artStyle: string | null
    folderId: string | null
    images: GlobalLocationImage[]
}

export interface GlobalProp {
    id: string
    name: string
    summary: string | null
    artStyle: string | null
    folderId: string | null
    images: GlobalLocationImage[]
}

export interface GlobalVoice {
    id: string
    name: string
    description: string | null
    voiceId: string | null
    voiceType: string
    customVoiceUrl: string | null
    media?: MediaRef | null
    voicePrompt: string | null
    gender: string | null
    language: string
    folderId: string | null
}

export interface GlobalFolder {
    id: string
    name: string
}

// ============ 查询 Hooks ============

/**
 * 获取中心资产库角色列表
 */
export function useGlobalCharacters(folderId?: string | null) {
    const assetsQuery = useAssets({
        scope: 'global',
        folderId,
        kind: 'character',
    })
    return {
        ...assetsQuery,
        data: groupAssetsByKind(assetsQuery.data).character.map((asset) => ({
            id: asset.id,
            name: asset.name,
            folderId: asset.folderId,
            customVoiceUrl: asset.voice.customVoiceUrl,
            media: asset.voice.media,
            appearances: asset.variants.map((variant) => ({
                id: variant.id,
                appearanceIndex: variant.index,
                changeReason: variant.label,
                artStyle: null,
                description: variant.description,
                descriptionSource: null,
                imageUrl: variant.renders.find((render) => render.isSelected)?.imageUrl
                    ?? variant.renders[0]?.imageUrl
                    ?? null,
                media: variant.renders.find((render) => render.isSelected)?.media
                    ?? variant.renders[0]?.media
                    ?? null,
                imageUrls: variant.renders.map((render) => render.imageUrl).filter((imageUrl): imageUrl is string => !!imageUrl),
                imageMedias: variant.renders.map((render) => render.media).filter((media): media is MediaRef => !!media),
                selectedIndex: variant.selectionState.selectedRenderIndex,
                previousImageUrl: variant.renders[0]?.previousImageUrl ?? null,
                previousMedia: variant.renders[0]?.previousMedia ?? null,
                previousImageUrls: variant.renders.map((render) => render.previousImageUrl).filter((imageUrl): imageUrl is string => !!imageUrl),
                previousImageMedias: variant.renders.map((render) => render.previousMedia).filter((media): media is MediaRef => !!media),
                imageTaskRunning: asset.taskState.isRunning || variant.taskState.isRunning || variant.renders.some((render) => render.taskState.isRunning),
                lastError: variant.renders.find((render) => render.taskState.lastError)?.taskState.lastError
                    ?? variant.taskState.lastError
                    ?? asset.taskState.lastError,
            })),
        })) as GlobalCharacter[],
    }
}

/**
 * 获取中心资产库场景列表
 */
export function useGlobalLocations(folderId?: string | null) {
    const assetsQuery = useAssets({
        scope: 'global',
        folderId,
        kind: 'location',
    })
    return {
        ...assetsQuery,
        data: groupAssetsByKind(assetsQuery.data).location.map((asset) => ({
            id: asset.id,
            name: asset.name,
            summary: asset.summary,
            artStyle: null,
            folderId: asset.folderId,
            images: asset.variants.map((variant) => {
                const render = variant.renders[0] ?? null
                return {
                    id: variant.id,
                    imageIndex: variant.index,
                    description: variant.description,
                    imageUrl: render?.imageUrl ?? null,
                    media: render?.media ?? null,
                    previousImageUrl: render?.previousImageUrl ?? null,
                    previousMedia: render?.previousMedia ?? null,
                    isSelected: render?.isSelected ?? false,
                    imageTaskRunning: asset.taskState.isRunning || variant.taskState.isRunning || render?.taskState.isRunning === true,
                    lastError: render?.taskState.lastError ?? variant.taskState.lastError ?? asset.taskState.lastError,
                }
            }),
        })) as GlobalLocation[],
    }
}

export function useGlobalProps(folderId?: string | null) {
    const assetsQuery = useAssets({
        scope: 'global',
        folderId,
        kind: 'prop',
    })
    return {
        ...assetsQuery,
        data: groupAssetsByKind(assetsQuery.data).prop.map((asset) => ({
            id: asset.id,
            name: asset.name,
            summary: asset.summary,
            artStyle: null,
            folderId: asset.folderId,
            images: asset.variants.map((variant) => {
                const render = variant.renders[0] ?? null
                return {
                    id: variant.id,
                    imageIndex: variant.index,
                    description: variant.description,
                    imageUrl: render?.imageUrl ?? null,
                    media: render?.media ?? null,
                    previousImageUrl: render?.previousImageUrl ?? null,
                    previousMedia: render?.previousMedia ?? null,
                    isSelected: render?.isSelected ?? false,
                    imageTaskRunning: asset.taskState.isRunning || variant.taskState.isRunning || render?.taskState.isRunning === true,
                    lastError: render?.taskState.lastError ?? variant.taskState.lastError ?? asset.taskState.lastError,
                }
            }),
        })) as GlobalProp[],
    }
}

/**
 * 获取中心资产库音色列表
 */
export function useGlobalVoices(folderId?: string | null) {
    const assetsQuery = useAssets({
        scope: 'global',
        folderId,
        kind: 'voice',
    })
    return {
        ...assetsQuery,
        data: groupAssetsByKind(assetsQuery.data).voice.map((asset) => ({
            id: asset.id,
            name: asset.name,
            description: asset.voiceMeta.description,
            voiceId: asset.voiceMeta.voiceId,
            voiceType: asset.voiceMeta.voiceType,
            customVoiceUrl: asset.voiceMeta.customVoiceUrl,
            media: asset.voiceMeta.media,
            voicePrompt: asset.voiceMeta.voicePrompt,
            gender: asset.voiceMeta.gender,
            language: asset.voiceMeta.language,
            folderId: asset.folderId,
        })) as GlobalVoice[],
    }
}

/**
 * 获取中心资产库文件夹列表
 */
export function useGlobalFolders() {
    return useQuery({
        queryKey: queryKeys.globalAssets.folders(),
        queryFn: async () => {
            const res = await apiFetch('/api/asset-hub/folders')
            if (!res.ok) throw new Error('Failed to fetch folders')
            const data = await res.json()
            return data.folders as GlobalFolder[]
        },
    })
}

// ============ 文件夹 Mutation Hooks ============

/**
 * 创建文件夹
 */
export function useCreateFolder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ name }: { name: string }) => {
            const res = await apiFetch('/api/asset-hub/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(resolveTaskErrorMessage(error, 'Failed to create folder'))
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.folders() })
        },
    })
}

/**
 * 更新文件夹
 */
export function useUpdateFolder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ folderId, name }: { folderId: string; name: string }) => {
            const res = await apiFetch('/api/asset-hub/folders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderId, name }),
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(resolveTaskErrorMessage(error, 'Failed to update folder'))
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.folders() })
        },
    })
}

/**
 * 删除文件夹
 */
export function useDeleteFolder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ folderId }: { folderId: string }) => {
            const res = await apiFetch(`/api/asset-hub/folders?folderId=${folderId}`, {
                method: 'DELETE',
            })
            if (!res.ok) {
                const error = await res.json()
                throw new Error(resolveTaskErrorMessage(error, 'Failed to delete folder'))
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.folders() })
            queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.all() })
        },
    })
}

/**
 * 刷新所有中心资产库数据
 */
export function useRefreshGlobalAssets() {
    const queryClient = useQueryClient()

    return () => {
        queryClient.invalidateQueries({
            queryKey: queryKeys.assets.all('global'),
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.globalAssets.all() })
    }
}
