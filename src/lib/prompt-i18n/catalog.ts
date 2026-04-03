import { PROMPT_IDS, type PromptId } from './prompt-ids'
import type { PromptCatalogEntry } from './types'

export const PROMPT_CATALOG: Record<PromptId, PromptCatalogEntry> = {
  [PROMPT_IDS.CHARACTER_IMAGE_TO_DESCRIPTION]: {
    pathStem: 'character-reference/character_image_to_description',
    variableKeys: [],
  },
  [PROMPT_IDS.CHARACTER_REFERENCE_TO_SHEET]: {
    pathStem: 'character-reference/character_reference_to_sheet',
    variableKeys: [],
  },
  [PROMPT_IDS.NP_AGENT_ACTING_DIRECTION]: {
    pathStem: 'studio/agent_acting_direction',
    variableKeys: ['panels_json', 'panel_count', 'characters_info'],
  },
  [PROMPT_IDS.NP_AGENT_CHARACTER_PROFILE]: {
    pathStem: 'studio/agent_character_profile',
    variableKeys: ['input', 'characters_lib_info'],
  },
  [PROMPT_IDS.NP_AGENT_CHARACTER_VISUAL]: {
    pathStem: 'studio/agent_character_visual',
    variableKeys: ['character_profiles'],
  },
  [PROMPT_IDS.NP_AGENT_CINEMATOGRAPHER]: {
    pathStem: 'studio/agent_cinematographer',
    variableKeys: ['panels_json', 'panel_count', 'locations_description', 'characters_info', 'props_description'],
  },
  [PROMPT_IDS.NP_AGENT_CLIP]: {
    pathStem: 'studio/agent_clip',
    variableKeys: ['input', 'locations_lib_name', 'characters_lib_name', 'props_lib_name', 'characters_introduction'],
  },
  [PROMPT_IDS.NP_AGENT_SHOT_VARIANT_ANALYSIS]: {
    pathStem: 'studio/agent_shot_variant_analysis',
    variableKeys: ['panel_description', 'shot_type', 'camera_move', 'location', 'characters_info'],
  },
  [PROMPT_IDS.NP_AGENT_SHOT_VARIANT_GENERATE]: {
    pathStem: 'studio/agent_shot_variant_generate',
    variableKeys: [
      'original_description',
      'original_shot_type',
      'original_camera_move',
      'location',
      'characters_info',
      'variant_title',
      'variant_description',
      'target_shot_type',
      'target_camera_move',
      'video_prompt',
      'character_assets',
      'location_asset',
      'aspect_ratio',
      'style',
    ],
  },
  [PROMPT_IDS.NP_AGENT_STORYBOARD_DETAIL]: {
    pathStem: 'studio/agent_storyboard_detail',
    variableKeys: ['panels_json', 'characters_age_gender', 'locations_description', 'props_description'],
  },
  [PROMPT_IDS.NP_AGENT_STORYBOARD_INSERT]: {
    pathStem: 'studio/agent_storyboard_insert',
    variableKeys: [
      'prev_panel_json',
      'next_panel_json',
      'characters_full_description',
      'locations_description',
      'props_description',
      'user_input',
    ],
  },
  [PROMPT_IDS.NP_AGENT_STORYBOARD_PLAN]: {
    pathStem: 'studio/agent_storyboard_plan',
    variableKeys: [
      'characters_lib_name',
      'locations_lib_name',
      'characters_introduction',
      'characters_appearance_list',
      'characters_full_description',
      'props_description',
      'clip_json',
      'clip_content',
    ],
  },
  [PROMPT_IDS.NP_CHARACTER_CREATE]: {
    pathStem: 'studio/character_create',
    variableKeys: ['user_input'],
  },
  [PROMPT_IDS.NP_CHARACTER_DESCRIPTION_UPDATE]: {
    pathStem: 'studio/character_description_update',
    variableKeys: ['original_description', 'modify_instruction', 'image_context'],
  },
  [PROMPT_IDS.NP_CHARACTER_MODIFY]: {
    pathStem: 'studio/character_modify',
    variableKeys: ['character_input', 'user_input'],
  },
  [PROMPT_IDS.NP_CHARACTER_REGENERATE]: {
    pathStem: 'studio/character_regenerate',
    variableKeys: ['character_name', 'current_descriptions', 'change_reason', 'novel_text'],
  },
  [PROMPT_IDS.NP_EPISODE_SPLIT]: {
    pathStem: 'studio/episode_split',
    variableKeys: ['CONTENT'],
  },
  [PROMPT_IDS.NP_IMAGE_PROMPT_MODIFY]: {
    pathStem: 'studio/image_prompt_modify',
    variableKeys: ['prompt_input', 'user_input', 'video_prompt_input'],
  },
  [PROMPT_IDS.NP_LOCATION_CREATE]: {
    pathStem: 'studio/location_create',
    variableKeys: ['user_input'],
  },
  [PROMPT_IDS.NP_LOCATION_DESCRIPTION_UPDATE]: {
    pathStem: 'studio/location_description_update',
    variableKeys: ['location_name', 'original_description', 'modify_instruction', 'image_context'],
  },
  [PROMPT_IDS.NP_LOCATION_MODIFY]: {
    pathStem: 'studio/location_modify',
    variableKeys: ['location_name', 'location_input', 'user_input'],
  },
  [PROMPT_IDS.NP_LOCATION_REGENERATE]: {
    pathStem: 'studio/location_regenerate',
    variableKeys: ['location_name', 'current_descriptions'],
  },
  [PROMPT_IDS.NP_SCREENPLAY_CONVERSION]: {
    pathStem: 'studio/screenplay_conversion',
    variableKeys: ['clip_content', 'locations_lib_name', 'characters_lib_name', 'props_lib_name', 'characters_introduction', 'clip_id'],
  },
  [PROMPT_IDS.NP_SELECT_PROP]: {
    pathStem: 'studio/select_prop',
    variableKeys: ['input', 'props_lib_name'],
  },
  [PROMPT_IDS.NP_SELECT_LOCATION]: {
    pathStem: 'studio/select_location',
    variableKeys: ['input', 'locations_lib_name'],
  },
  [PROMPT_IDS.NP_SINGLE_PANEL_IMAGE]: {
    pathStem: 'studio/single_panel_image',
    variableKeys: ['storyboard_text_json_input', 'source_text', 'aspect_ratio', 'style'],
  },
  [PROMPT_IDS.NP_STORYBOARD_EDIT]: {
    pathStem: 'studio/storyboard_edit',
    variableKeys: ['user_input'],
  },
  [PROMPT_IDS.NP_VOICE_ANALYSIS]: {
    pathStem: 'studio/voice_analysis',
    variableKeys: ['input', 'characters_lib_name', 'characters_introduction', 'storyboard_json'],
  },
}
