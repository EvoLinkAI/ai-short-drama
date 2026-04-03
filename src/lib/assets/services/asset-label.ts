import { prisma } from '@/lib/prisma'
import { decodeImageUrlsFromDb, encodeImageUrls } from '@/lib/contracts/image-urls-contract'
import { updateImageLabel } from '@/lib/image-label'
import type { AssetKind, AssetScope } from '@/lib/assets/contracts'

type UpdateAssetRenderLabelInput = {
  scope: AssetScope
  kind: Extract<AssetKind, 'character' | 'location' | 'prop'>
  assetId: string
  projectId?: string
  newName: string
}

export function renderLabelText(input: {
  kind: Extract<AssetKind, 'character' | 'location' | 'prop'>
  assetName: string
  variantLabel?: string | null
}): string {
  if (input.kind === 'character') {
    return `${input.assetName} - ${input.variantLabel || '初始形象'}`
  }
  return input.assetName
}

export async function updateAssetRenderLabel(input: UpdateAssetRenderLabelInput) {
  if (input.scope === 'global') {
    return updateGlobalAssetRenderLabel(input)
  }
  return updateProjectAssetRenderLabel(input)
}

async function updateGlobalAssetRenderLabel(input: UpdateAssetRenderLabelInput) {
  if (input.kind === 'character') {
    const character = await prisma.globalCharacter.findUnique({
      where: { id: input.assetId },
      include: { appearances: true },
    })
    if (!character) {
      throw new Error('Global character not found')
    }

    await Promise.all(character.appearances.map(async (appearance) => {
      const newImageUrls = await Promise.all(
        decodeImageUrlsFromDb(appearance.imageUrls, 'globalCharacterAppearance.imageUrls').map(async (imageUrl) => updateImageLabel(
          imageUrl,
          renderLabelText({
            kind: 'character',
            assetName: input.newName,
            variantLabel: appearance.changeReason,
          }),
          {
            generateNewKey: true,
            keyPrefix: 'asset-label-rename',
          },
        )),
      )
      const firstImageUrl = newImageUrls[0] ?? null
      await prisma.globalCharacterAppearance.update({
        where: { id: appearance.id },
        data: {
          imageUrls: encodeImageUrls(newImageUrls),
          imageUrl: firstImageUrl,
        },
      })
    }))
    return
  }

  const location = await prisma.globalLocation.findUnique({
    where: { id: input.assetId },
    include: { images: true },
  })
  if (!location) {
    throw new Error('Global location not found')
  }
  await Promise.all(location.images.map(async (image) => {
    if (!image.imageUrl) {
      return
    }
    const nextImageUrl = await updateImageLabel(
      image.imageUrl,
      renderLabelText({
        kind: input.kind === 'prop' ? 'prop' : 'location',
        assetName: input.newName,
      }),
      {
        generateNewKey: true,
        keyPrefix: 'asset-label-rename',
      },
    )
    await prisma.globalLocationImage.update({
      where: { id: image.id },
      data: { imageUrl: nextImageUrl },
    })
  }))
}

async function updateProjectAssetRenderLabel(input: UpdateAssetRenderLabelInput) {
  if (!input.projectId) {
    throw new Error('projectId is required for project assets')
  }
  if (input.kind === 'character') {
    const character = await prisma.studioCharacter.findUnique({
      where: {
        id: input.assetId,
      },
      include: { appearances: true },
    })
    if (!character) {
      throw new Error('Project character not found')
    }

    await Promise.all(character.appearances.map(async (appearance: {
      id: string
      imageUrls: string | null
      changeReason: string
    }) => {
      const imageUrls = decodeImageUrlsFromDb(appearance.imageUrls, 'characterAppearance.imageUrls')
      const nextImageUrls = await Promise.all(imageUrls.map(async (imageUrl) => updateImageLabel(
        imageUrl,
        renderLabelText({
          kind: 'character',
          assetName: input.newName,
          variantLabel: appearance.changeReason,
        }),
        {
          generateNewKey: true,
          keyPrefix: 'project-asset-label-rename',
        },
      )))
      const firstImageUrl = nextImageUrls[0] ?? null
      await prisma.characterAppearance.update({
        where: { id: appearance.id },
        data: {
          imageUrls: encodeImageUrls(nextImageUrls),
          imageUrl: firstImageUrl,
        },
      })
    }))
    return
  }

  const location = await prisma.studioLocation.findUnique({
    where: {
      id: input.assetId,
    },
    include: { images: true },
  })
  if (!location) {
    throw new Error('Project location not found')
  }
  await Promise.all(location.images.map(async (image: {
    id: string
    imageUrl: string | null
  }) => {
    if (!image.imageUrl) {
      return
    }
    const nextImageUrl = await updateImageLabel(
      image.imageUrl,
      renderLabelText({
        kind: input.kind === 'prop' ? 'prop' : 'location',
        assetName: input.newName,
      }),
      {
        generateNewKey: true,
        keyPrefix: 'project-asset-label-rename',
      },
    )
    await prisma.locationImage.update({
      where: { id: image.id },
      data: { imageUrl: nextImageUrl },
    })
  }))
}
