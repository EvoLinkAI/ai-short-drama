import type { AssetCapabilityMap, AssetFamily, AssetKind } from '@/lib/assets/contracts'

export type AssetKindRegistration = {
  kind: AssetKind
  family: AssetFamily
  supportsMultipleVariants: boolean
  supportsVoiceBinding: boolean
  editorSchema: AssetKind
  promptAssembler: AssetKind
  capabilities: AssetCapabilityMap
}

const assetKindRegistryMap: Record<AssetKind, AssetKindRegistration> = {
  character: {
    kind: 'character',
    family: 'visual',
    supportsMultipleVariants: true,
    supportsVoiceBinding: true,
    editorSchema: 'character',
    promptAssembler: 'character',
    capabilities: {
      canGenerate: true,
      canSelectRender: true,
      canRevertRender: true,
      canModifyRender: true,
      canUploadRender: true,
      canBindVoice: true,
      canCopyFromGlobal: true,
    },
  },
  location: {
    kind: 'location',
    family: 'visual',
    supportsMultipleVariants: true,
    supportsVoiceBinding: false,
    editorSchema: 'location',
    promptAssembler: 'location',
    capabilities: {
      canGenerate: true,
      canSelectRender: true,
      canRevertRender: true,
      canModifyRender: true,
      canUploadRender: true,
      canBindVoice: false,
      canCopyFromGlobal: true,
    },
  },
  prop: {
    kind: 'prop',
    family: 'visual',
    supportsMultipleVariants: true,
    supportsVoiceBinding: false,
    editorSchema: 'prop',
    promptAssembler: 'prop',
    capabilities: {
      canGenerate: true,
      canSelectRender: true,
      canRevertRender: true,
      canModifyRender: true,
      canUploadRender: true,
      canBindVoice: false,
      canCopyFromGlobal: true,
    },
  },
  voice: {
    kind: 'voice',
    family: 'audio',
    supportsMultipleVariants: false,
    supportsVoiceBinding: false,
    editorSchema: 'voice',
    promptAssembler: 'voice',
    capabilities: {
      canGenerate: false,
      canSelectRender: false,
      canRevertRender: false,
      canModifyRender: false,
      canUploadRender: false,
      canBindVoice: false,
      canCopyFromGlobal: true,
    },
  },
}

export const assetKindRegistry = Object.freeze(assetKindRegistryMap)

export function getAssetKindRegistration(kind: AssetKind): AssetKindRegistration {
  return assetKindRegistry[kind]
}
