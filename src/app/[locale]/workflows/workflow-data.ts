export interface WorkflowStep {
  title: string
  description: string
}

export interface WorkflowPrompt {
  label: string
  model: string
  text: string
}

export interface WorkflowDefinition {
  slug: string
  caseNumber: number
  title: string
  subtitle: string
  category: 'storyboard' | 'character' | 'product' | 'creative'
  creator: string
  creatorUrl: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedTime: string
  estimatedCredits: number
  description: string
  whyItWorks: string
  steps: WorkflowStep[]
  prompts: WorkflowPrompt[]
  tips: string[]
  defaultImageModel: string
  defaultVideoModel: string
  trending?: boolean
  previewVideoUrl?: string
}

export const WORKFLOW_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'storyboard', label: 'Storyboard' },
  { key: 'character', label: 'Character' },
  { key: 'product', label: 'Product Demo' },
  { key: 'creative', label: 'Creative Mashup' },
] as const

export const WORKFLOWS: WorkflowDefinition[] = [
  {
    slug: 'standard-storyboard',
    caseNumber: 1,
    title: 'Standard Storyboard → Video',
    subtitle: 'The classic 6-panel workflow',
    category: 'storyboard',
    creator: '@kiyoshi_shin',
    creatorUrl: 'https://x.com/kiyoshi_shin',
    difficulty: 'Beginner',
    estimatedTime: '~2 min',
    estimatedCredits: 6,
    description: 'The most common workflow. Use GPT Image 2 to generate a storyboard panel, then animate it with Seedance 2.0. Best for promotional videos, short dramas, and animation OPs.',
    whyItWorks: 'GPT Image 2 locks the visual — character design, lighting, composition. Seedance 2.0 then only needs to figure out motion, which it does reliably when the input is a clean, well-composed frame.',
    steps: [
      { title: 'Describe your scene', description: 'GPT Image 2 generates a 6-panel storyboard image.' },
      { title: 'Auto-handoff to Seedance 2.0', description: 'The storyboard flows directly into the video model.' },
      { title: 'Animate', description: 'Seedance reads the panels and generates a continuous clip.' },
      { title: 'Download', description: 'Get both the storyboard image and the final video.' },
    ],
    prompts: [
      {
        label: 'GPT IMAGE 2 · STORYBOARD',
        model: 'gpt-image-2',
        text: 'Create a 6-panel storyboard for a 15-second brand promotional video. Label each panel with a shot description.\nStyle: cinematic, cool color tone, widescreen 16:9.\nContent: {YOUR_SCENE}',
      },
      {
        label: 'SEEDANCE 2.0 · MOTION',
        model: 'seedance-2.0',
        text: 'Cinematic brand advertisement, slow camera push-in, product centered in frame, warm side lighting, soft background blur, no people, 3 seconds.',
      },
    ],
    tips: [
      'Output storyboard images in 16:9 to avoid Seedance auto-cropping.',
      'Set frame rate to 24fps to match film standards.',
      'Keep each storyboard panel simple — the simpler the content, the more accurate the motion output.',
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/ac25fc3d-b6cb-4149-a8ba-e7e10c5b1faa',
  },
  {
    slug: '3x3-grid-storyboard',
    caseNumber: 2,
    title: '3×3 Grid Storyboard',
    subtitle: 'Pack 9 panels into one image',
    category: 'storyboard',
    creator: '@servasyy_ai',
    creatorUrl: 'https://x.com/servasyy_ai',
    difficulty: 'Beginner',
    estimatedTime: '~2 min',
    estimatedCredits: 8,
    description: 'A community-discovered trick. Pack 9 panels into a single grid image before handing off — Seedance reads it as one continuous motion sequence, with dramatically lower failure rate than panel-by-panel imports.',
    whyItWorks: 'Seedance analyzes motion intent from a single image. When you hand it 9 panels arranged as a visual sequence, it treats the whole grid as one directional prompt — producing continuous motion instead of the stutters you get when stitching 9 separate clips.',
    steps: [
      { title: 'Generate the 3×3 grid', description: 'GPT Image 2 renders all 9 panels as a single image with consistent character and style.' },
      { title: 'Auto-handoff to Seedance 2.0', description: 'No download, no re-upload. The grid flows directly into the video model.' },
      { title: 'Animate as a motion sequence', description: 'Seedance reads all 9 panels as one intent and generates a continuous clip.' },
      { title: 'Deliver MP4 + grid', description: 'You get both the final video and the source grid.' },
    ],
    prompts: [
      {
        label: 'GPT IMAGE 2 · STORYBOARD',
        model: 'gpt-image-2',
        text: 'Generate a single 3×3 storyboard grid image (9 panels) showing:\n{YOUR_SCENE}\n\nCharacter: {YOUR_CHARACTER}\nStyle: Japanese anime, dark fantasy, high contrast.\nRequirements: clean panels, consistent character positions, consistent background, no text labels.',
      },
      {
        label: 'SEEDANCE 2.0 · MOTION',
        model: 'seedance-2.0',
        text: 'Japanese full-color animation, fast cuts, high frame count, 24fps, dark fantasy anime OP style, intense battle scenes.',
      },
    ],
    tips: [
      'Keep panels visually simple. The more crowded each frame, the less reliable the motion.',
      '24fps reads as cinema, 30fps reads as TV. Pick based on the genre.',
      'Grid beats panel-by-panel because Seedance reads all 9 frames as one motion intent.',
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    trending: true,
    previewVideoUrl: 'https://github.com/user-attachments/assets/00f32388-a17b-4b9c-8da3-1956436ce91b',
  },
  {
    slug: 'character-sheet-animation',
    caseNumber: 3,
    title: 'Character Sheet → Animation',
    subtitle: 'Three-view turnaround to motion',
    category: 'character',
    creator: '@YaReYaRu30Life',
    creatorUrl: 'https://x.com/YaReYaRu30Life',
    difficulty: 'Intermediate',
    estimatedTime: '~3 min',
    estimatedCredits: 10,
    description: 'Generate a character three-view sheet (front, side, back) with GPT Image 2, then use it as an anchor for animation in Seedance 2.0. Ideal for anime characters, game characters, and figure reveals.',
    whyItWorks: 'The three-view sheet gives Seedance a complete understanding of the character from all angles, so it can generate consistent rotation and movement without hallucinating missing details.',
    steps: [
      { title: 'Generate character sheet', description: 'GPT Image 2 creates front / side / back views in one image.' },
      { title: 'Generate storyboard frames', description: 'Use the sheet as reference to create action poses.' },
      { title: 'Animate', description: 'Seedance 2.0 brings the character to life with consistent design.' },
      { title: 'Download', description: 'Get the character sheet and animated video.' },
    ],
    prompts: [
      {
        label: 'GPT IMAGE 2 · CHARACTER SHEET',
        model: 'gpt-image-2',
        text: 'Create a character three-view sheet (front, side, back views) for:\n{YOUR_CHARACTER}\nStyle: Japanese anime illustration, clean linework, flat color, white background.\nAll three views must maintain consistent proportions and design details.',
      },
      {
        label: 'SEEDANCE 2.0 · MOTION',
        model: 'seedance-2.0',
        text: 'Japanese full-color anime style, character in natural idle breathing animation, subtle hair movement, 24fps, seamless loop.',
      },
    ],
    tips: [
      'Include hair color, eye color, outfit description, and body type in your character prompt.',
      'Use the three-view sheet as the visual anchor for ALL subsequent storyboard frames.',
      'Avoid switching character perspectives within a single clip.',
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/92a0aa56-441f-40db-b9c9-13410254cb3f',
  },
  {
    slug: 'anime-op-style',
    caseNumber: 4,
    title: 'Anime OP Style Video',
    subtitle: 'Dark fantasy with high-impact cuts',
    category: 'character',
    creator: '@Toshi_nyaruo_AI',
    creatorUrl: 'https://x.com/Toshi_nyaruo_AI',
    difficulty: 'Intermediate',
    estimatedTime: '~3 min',
    estimatedCredits: 8,
    description: 'Use GPT Image 2 to build a scene setting image, then let Seedance 2.0 animate freely. Great for anime openings with dynamic camera work.',
    whyItWorks: 'When Seedance animates freely without storyboard constraints, results are more dynamic. Use this for action sequences where controlled motion would feel stiff.',
    steps: [
      { title: 'Generate scene setting', description: 'GPT Image 2 creates a detailed scene illustration.' },
      { title: 'Import to Seedance', description: 'Minimal motion prompt — let the model decide the action.' },
      { title: 'Compare & iterate', description: 'One version with tight control, one with free animation.' },
      { title: 'Download best result', description: 'Pick the version that works for your sequence.' },
    ],
    prompts: [
      {
        label: 'GPT IMAGE 2 · SCENE',
        model: 'gpt-image-2',
        text: 'Create a scene setting illustration for a dark fantasy anime:\nLocation: {YOUR_LOCATION}\nTime: night\nAtmosphere: ominous, cinematic.\nStyle: Japanese anime production art, high detail, cinematic composition.',
      },
      {
        label: 'SEEDANCE 2.0 · MOTION',
        model: 'seedance-2.0',
        text: 'Japanese full-color anime, fast cuts, high frame count, 24fps. Dark fantasy anime OP style. Epic battle between protagonist and massive supernatural creatures.',
      },
    ],
    tips: [
      'Free animation is more dynamic but less consistent with your source image.',
      'Use storyboard control for key character shots, free animation for action sequences.',
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/f08a2fee-89a7-4c7c-a58a-f1306f87419a',
  },
  {
    slug: 'app-mvp-demo',
    caseNumber: 5,
    title: 'App MVP Demo Video',
    subtitle: 'Test market fit before building',
    category: 'product',
    creator: '@Shin_Engineer',
    creatorUrl: 'https://x.com/Shin_Engineer',
    difficulty: 'Beginner',
    estimatedTime: '~2 min',
    estimatedCredits: 6,
    description: 'Generate finished-looking UI screenshots of an app that doesn\'t exist yet, then animate them into a product demo. Post to social media to test market interest before writing code.',
    whyItWorks: 'GPT Image 2 produces photorealistic UI mockups that look like real screenshots. Seedance adds subtle interface transitions that make the demo feel genuine.',
    steps: [
      { title: 'Describe your app concept', description: 'GPT Image 2 generates 3-5 key UI screenshots.' },
      { title: 'Sort in user-flow order', description: 'Arrange screenshots logically: home → feature → profile.' },
      { title: 'Animate transitions', description: 'Seedance adds smooth UI transition animations.' },
      { title: 'Post & measure', description: 'Share the demo and observe audience reaction.' },
    ],
    prompts: [
      {
        label: 'GPT IMAGE 2 · APP UI',
        model: 'gpt-image-2',
        text: 'Design 3 UI screenshots for a "{YOUR_APP_CONCEPT}" app:\n1. Home page with main feature\n2. Feature detail view\n3. User profile page\nStyle: iOS native design language, modern, light mode.\nOutput as realistic app screenshots, not wireframes.',
      },
      {
        label: 'SEEDANCE 2.0 · MOTION',
        model: 'seedance-2.0',
        text: 'Smooth app UI transition animation, screen tap interaction, natural interface motion, clean and modern feel, 3 seconds.',
      },
    ],
    tips: [
      'Use iOS or Android native design language for believable screenshots.',
      'Keep the demo under 15 seconds — attention spans are short on social media.',
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/09d81a41-b5c5-47f3-8c67-442b7a93b019',
  },
  {
    slug: '15-second-commercial',
    caseNumber: 6,
    title: '15-Second Commercial',
    subtitle: 'Hero visual → multi-shot ad',
    category: 'product',
    creator: '@ai_mitosan',
    creatorUrl: 'https://x.com/ai_mitosan',
    difficulty: 'Intermediate',
    estimatedTime: '~3 min',
    estimatedCredits: 10,
    description: 'Two-step workflow: GPT Image 2 generates the hero image and matching storyboard, then Seedance 2.0 animates each clip. Assemble with captions and music for a complete 15-second spot.',
    whyItWorks: 'Starting from a single hero visual ensures brand consistency across all shots. Each animated clip inherits the same color palette, lighting, and composition.',
    steps: [
      { title: 'Generate hero visual', description: 'The anchor image that defines the brand look.' },
      { title: 'Create storyboard', description: '4-5 panels based on the hero visual.' },
      { title: 'Animate per-shot', description: 'Each panel gets 3-4 seconds of motion.' },
      { title: 'Assemble', description: 'Add captions and music in your editing software.' },
    ],
    prompts: [
      {
        label: 'GPT IMAGE 2 · COMMERCIAL',
        model: 'gpt-image-2',
        text: 'Create a 5-panel storyboard for a 15-second commercial for {YOUR_PRODUCT}:\nPanel 1: Opening shot\nPanel 2: Product feature highlight\nPanel 3: Emotional moment\nPanel 4: Call to action\nPanel 5: Closing brand shot\nStyle: premium, 16:9 widescreen, cinematic.',
      },
      {
        label: 'SEEDANCE 2.0 · MOTION',
        model: 'seedance-2.0',
        text: 'Cinematic commercial quality, premium tone, product centered in frame, slow camera push-in, warm lighting highlights the product, clean background, 3 seconds.',
      },
    ],
    tips: [
      '15-second spot = 4-5 panels at 3-4 seconds each.',
      '30-second spot = 8-10 panels at 3 seconds each.',
      '60-second spot = 15-18 panels at 3-4 seconds each.',
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/09ae3c57-b8fb-4323-ba76-7777541fe4a3',
  },
  {
    slug: 'music-video-suno',
    caseNumber: 7,
    title: 'Music Video with Suno',
    subtitle: 'Beats → panels → motion synced to BPM',
    category: 'creative',
    creator: '@fukaborichannel',
    creatorUrl: 'https://x.com/fukaborichannel',
    difficulty: 'Advanced',
    estimatedTime: '~5 min',
    estimatedCredits: 12,
    description: 'Three-tool combination: GPT Image 2 for visuals, Seedance 2.0 for motion, Suno for music. Produce music first to lock the tempo, then design storyboards that align to the beat.',
    whyItWorks: 'Starting with music locks the tempo and structure. When you know the BPM and song sections, you can precisely time each panel to land on beat cuts.',
    steps: [
      { title: 'Generate music', description: 'Create the target-style track in Suno first.' },
      { title: 'Design storyboard per section', description: 'Intro / verse / chorus get dedicated panels.' },
      { title: 'Animate each panel', description: 'Match clip duration to the beat structure.' },
      { title: 'Sync to music', description: 'Align clips to the track in your editing software.' },
    ],
    prompts: [
      {
        label: 'GPT IMAGE 2 · MUSIC VIDEO',
        model: 'gpt-image-2',
        text: 'Create a 6-panel storyboard for a music video:\nIntro: {VISUAL_CONCEPT}\nVerse: {VISUAL_CONCEPT}\nChorus: {VISUAL_CONCEPT}\nStyle: city pop anime, soft summer afternoon light, film grain texture.',
      },
      {
        label: 'SEEDANCE 2.0 · MOTION',
        model: 'seedance-2.0',
        text: 'Japanese city pop anime style, soft summer afternoon light, character walking lightly, Tokyo street background, blue sky, film grain texture, 24fps.',
      },
    ],
    tips: [
      'Produce music FIRST. Knowing tempo and length before designing storyboards lets you precisely match panel timing to beat cuts.',
      'Use Suno\'s song structure (intro/verse/chorus) to organize your storyboard sections.',
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/fd4be5c7-cd02-4a77-ae07-6b80efeff201',
  },
  {
    slug: 'cyberpunk-short-film',
    caseNumber: 8,
    title: 'Cyberpunk Short Film',
    subtitle: 'Neon-lit visual narrative',
    category: 'creative',
    creator: '@ponyodong',
    creatorUrl: 'https://x.com/ponyodong',
    difficulty: 'Intermediate',
    estimatedTime: '~3 min',
    estimatedCredits: 8,
    description: 'Use GPT Image 2 to establish a consistent visual style (cyberpunk, neon, lanterns), then animate each image with Seedance 2.0 for a short stylized film.',
    whyItWorks: 'Fixing the visual style system (colors, lighting, character look) in GPT Image 2 means every frame Seedance animates shares the same mood — no jarring style shifts between clips.',
    steps: [
      { title: 'Define visual style', description: 'Fix colors, lighting, and character look in GPT Image 2.' },
      { title: 'Generate 4-6 mood images', description: 'Each image carries the same cyberpunk aesthetic.' },
      { title: 'Animate with slow motion', description: 'Atmospheric camera drifts and particle effects.' },
      { title: 'Sequence into narrative', description: 'Build a short visual story from the clips.' },
    ],
    prompts: [
      {
        label: 'GPT IMAGE 2 · CYBERPUNK',
        model: 'gpt-image-2',
        text: 'Generate a cyberpunk illustration:\nVisual elements: neon lights, rain, holographic signs.\nCharacter: {YOUR_CHARACTER}\nColor palette: deep purple, electric blue, hot pink.\nMood: atmospheric, cinematic, noir.',
      },
      {
        label: 'SEEDANCE 2.0 · MOTION',
        model: 'seedance-2.0',
        text: 'Slow atmospheric camera drift, neon reflections on wet pavement, soft particle effects, cinematic color grade, 24fps, 4 seconds.',
      },
    ],
    tips: [
      'Include a brief character description in every prompt to maintain consistency.',
      'Avoid switching character perspectives within a single clip.',
      'Keep clip duration under 4 seconds — shorter clips accumulate less distortion.',
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/db6ebb63-90dc-47c5-96c5-ab2fa53ed56d',
  },
  {
    slug: 'game-interactive-ui',
    caseNumber: 9,
    title: 'Game & Interactive UI',
    subtitle: 'HUD + skill bars + choice overlays',
    category: 'creative',
    creator: '@AbleGPT',
    creatorUrl: 'https://x.com/AbleGPT',
    difficulty: 'Intermediate',
    estimatedTime: '~3 min',
    estimatedCredits: 8,
    description: 'Generate game-style UI images with HUD elements, skill bars, and choice overlays, then animate them in Seedance 2.0 to simulate interactive game sequences.',
    whyItWorks: 'Game and illustration styles face fewer content restrictions in Seedance than realistic human footage. The structured UI layout also gives Seedance clear spatial cues for animation.',
    steps: [
      { title: 'Generate game UI', description: 'GPT Image 2 creates ARPG-style screenshots with HUD elements.' },
      { title: 'Add interaction prompts', description: 'Describe the combat or menu interaction sequence.' },
      { title: 'Animate', description: 'Seedance simulates the UI interaction and combat.' },
      { title: 'Polish', description: 'Add particle effects and glow in post-production.' },
    ],
    prompts: [
      {
        label: 'GPT IMAGE 2 · GAME UI',
        model: 'gpt-image-2',
        text: 'Generate a game UI screenshot in ARPG style:\nTheme: {YOUR_THEME}\nUI elements: health bar, skill icons, choice panel with options A/B/C.\nArt style: realistic, high detail rendering.',
      },
      {
        label: 'SEEDANCE 2.0 · MOTION',
        model: 'seedance-2.0',
        text: 'Click option A, normal UI transition animation, then a combat sequence begins. Dynamic camera work, realistic rendering.',
      },
    ],
    tips: [
      'Seedance has restrictions on realistic human content. Game and anime styles bypass most limitations.',
      'Include HUD elements in the image — they give Seedance clear layout cues.',
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/961c4bc4-c83c-49d3-bc14-7b128e80bc17',
  },
]

export function getWorkflowBySlug(slug: string): WorkflowDefinition | undefined {
  return WORKFLOWS.find((w) => w.slug === slug)
}

export function getWorkflowsByCategory(category: string): WorkflowDefinition[] {
  if (category === 'all') return WORKFLOWS
  return WORKFLOWS.filter((w) => w.category === category)
}
