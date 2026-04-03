import { prisma } from '@/lib/prisma'
import { removeLocationPromptSuffix } from '@/lib/constants'
import type { StoryToScriptClipCandidate } from '@/lib/studio/story-to-script/orchestrator'
import { seedProjectLocationBackedImageSlots } from '@/lib/assets/services/location-backed-assets'

export type AnyObj = Record<string, unknown>

export function parseEffort(value: unknown): 'minimal' | 'low' | 'medium' | 'high' | null {
  if (value === 'minimal' || value === 'low' || value === 'medium' || value === 'high') return value
  return null
}

export function parseTemperature(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.7
  return Math.max(0, Math.min(2, value))
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

export function resolveClipRecordId(clipMap: Map<string, string>, clipId: string): string | null {
  return clipMap.get(clipId) || null
}

export async function persistAnalyzedCharacters(params: {
  projectInternalId: string
  existingNames: Set<string>
  analyzedCharacters: Record<string, unknown>[]
}) {
  const created: Array<{ id: string; name: string }> = []

  for (const item of params.analyzedCharacters) {
    const name = asString(item.name).trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (params.existingNames.has(key)) continue

    const profileData = {
      role_level: item.role_level,
      archetype: item.archetype,
      personality_tags: toStringArray(item.personality_tags),
      era_period: item.era_period,
      social_class: item.social_class,
      occupation: item.occupation,
      costume_tier: item.costume_tier,
      suggested_colors: toStringArray(item.suggested_colors),
      primary_identifier: item.primary_identifier,
      visual_keywords: toStringArray(item.visual_keywords),
      gender: item.gender,
      age_range: item.age_range,
    }

    const createdRow = await prisma.studioCharacter.create({
      data: {
        studioProjectId: params.projectInternalId,
        name,
        aliases: JSON.stringify(toStringArray(item.aliases)),
        introduction: asString(item.introduction) || null,
        profileData: JSON.stringify(profileData),
        profileConfirmed: false,
      },
      select: {
        id: true,
        name: true,
      },
    })

    params.existingNames.add(key)
    created.push(createdRow)
  }

  return created
}

export async function persistAnalyzedLocations(params: {
  projectInternalId: string
  existingNames: Set<string>
  analyzedLocations: Record<string, unknown>[]
}) {
  const created: Array<{ id: string; name: string }> = []
  const invalidKeywords = ['幻想', '抽象', '无明确', '空间锚点', '未说明', '不明确']

  for (const item of params.analyzedLocations) {
    const name = asString(item.name).trim()
    if (!name) continue

    const descriptions = toStringArray(item.descriptions)
    const mergedDescriptions = descriptions.length > 0
      ? descriptions
      : (asString(item.description) ? [asString(item.description)] : [])

    const firstDescription = mergedDescriptions[0] || ''
    const isInvalid = invalidKeywords.some((keyword) =>
      name.includes(keyword) || firstDescription.includes(keyword),
    )
    if (isInvalid) continue

    const key = name.toLowerCase()
    if (params.existingNames.has(key)) continue

    const location = await prisma.studioLocation.create({
      data: {
        studioProjectId: params.projectInternalId,
        name,
        summary: asString(item.summary) || null,
      },
      select: {
        id: true,
        name: true,
      },
    })

    const cleanDescriptions = mergedDescriptions.map((desc) => removeLocationPromptSuffix(desc || ''))
    await seedProjectLocationBackedImageSlots({
      locationId: location.id,
      descriptions: cleanDescriptions,
      fallbackDescription: asString(item.summary) || name,
    })

    params.existingNames.add(key)
    created.push(location)
  }

  return created
}

export async function persistAnalyzedProps(params: {
  projectInternalId: string
  existingNames: Set<string>
  analyzedProps: Record<string, unknown>[]
}) {
  const created: Array<{ id: string; name: string }> = []

  for (const item of params.analyzedProps) {
    const name = asString(item.name).trim()
    const summary = asString(item.summary).trim()
    if (!name || !summary) continue

    const key = name.toLowerCase()
    if (params.existingNames.has(key)) continue

    const prop = await prisma.studioLocation.create({
      data: {
        studioProjectId: params.projectInternalId,
        name,
        summary,
        assetKind: 'prop',
      },
      select: {
        id: true,
        name: true,
      },
    })
    await seedProjectLocationBackedImageSlots({
      locationId: prop.id,
      descriptions: [summary],
      fallbackDescription: summary,
    })

    params.existingNames.add(key)
    created.push(prop)
  }

  return created
}

export async function persistClips(params: {
  episodeId: string
  clipList: StoryToScriptClipCandidate[]
}) {
  const clipModel = prisma.studioClip as unknown as {
    update: (args: { where: { id: string }; data: Record<string, unknown>; select: { id: true } }) => Promise<{ id: string }>
    create: (args: { data: Record<string, unknown>; select: { id: true } }) => Promise<{ id: string }>
    findMany: typeof prisma.studioClip.findMany
    deleteMany: typeof prisma.studioClip.deleteMany
  }
  const existing = await clipModel.findMany({
    where: { episodeId: params.episodeId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  const createdClips: Array<{ id: string; clipKey: string }> = []
  for (let index = 0; index < params.clipList.length; index += 1) {
    const clip = params.clipList[index]
    const target = existing[index]
    if (target) {
      const updated = await clipModel.update({
        where: { id: target.id },
        data: {
          startText: clip.startText,
          endText: clip.endText,
          summary: clip.summary,
          location: clip.location,
          characters: clip.characters.length > 0 ? JSON.stringify(clip.characters) : null,
          props: clip.props.length > 0 ? JSON.stringify(clip.props) : null,
          content: clip.content,
        },
        select: {
          id: true,
        },
      })
      createdClips.push({ id: updated.id, clipKey: clip.id })
      continue
    }

    const created = await clipModel.create({
      data: {
        episodeId: params.episodeId,
        startText: clip.startText,
        endText: clip.endText,
        summary: clip.summary,
        location: clip.location,
        characters: clip.characters.length > 0 ? JSON.stringify(clip.characters) : null,
        props: clip.props.length > 0 ? JSON.stringify(clip.props) : null,
        content: clip.content,
      },
      select: {
        id: true,
      },
    })
    createdClips.push({ id: created.id, clipKey: clip.id })
  }

  const staleClipIds = existing.slice(params.clipList.length).map((item) => item.id)
  if (staleClipIds.length > 0) {
    await clipModel.deleteMany({
      where: {
        id: {
          in: staleClipIds,
        },
      },
    })
  }

  return createdClips
}
