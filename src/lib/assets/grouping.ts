import type {
  AssetKind,
  AssetSummary,
  CharacterAssetSummary,
  LocationAssetSummary,
  PropAssetSummary,
  VoiceAssetSummary,
} from '@/lib/assets/contracts'

export type AssetGroupMap = {
  character: CharacterAssetSummary[]
  location: LocationAssetSummary[]
  prop: PropAssetSummary[]
  voice: VoiceAssetSummary[]
}

export function createEmptyAssetGroupMap(): AssetGroupMap {
  return {
    character: [],
    location: [],
    prop: [],
    voice: [],
  }
}

export function groupAssetsByKind(assets: AssetSummary[]): AssetGroupMap {
  const groups = createEmptyAssetGroupMap()
  for (const asset of assets) {
    if (asset.kind === 'character') {
      groups.character.push(asset)
      continue
    }
    if (asset.kind === 'location') {
      groups.location.push(asset)
      continue
    }
    if (asset.kind === 'prop') {
      groups.prop.push(asset)
      continue
    }
    groups.voice.push(asset)
  }
  return groups
}

export function filterAssetsByKind(assets: AssetSummary[], kind: AssetKind | 'all'): AssetSummary[] {
  if (kind === 'all') return assets
  return assets.filter((asset) => asset.kind === kind)
}
