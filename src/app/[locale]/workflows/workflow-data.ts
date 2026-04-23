export interface WorkflowStep {
  title: string
  description: string
}

export interface WorkflowPrompt {
  label: string
  model: string
  text: string
}

export interface WorkflowField {
  key: string
  label: string
  labelZh: string
  placeholder: string
  placeholderZh: string
  type?: 'text' | 'textarea'
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
  fields: WorkflowField[]
  defaultImageModel: string
  defaultVideoModel: string
  trending?: boolean
  previewVideoUrl?: string
  hasMusic?: boolean
  musicStyle?: string
  zh?: {
    title: string
    subtitle: string
    description: string
    whyItWorks: string
    difficulty: string
    steps: WorkflowStep[]
    tips: string[]
  }
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
    fields: [
      { key: 'YOUR_SCENE', label: 'Scene', labelZh: '场景描述', placeholder: 'e.g. A product journey from factory to customer hands', placeholderZh: '例如：产品从工厂到用户手中的旅程', type: 'textarea' },
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/ac25fc3d-b6cb-4149-a8ba-e7e10c5b1faa',
    zh: {
      title: '标准分镜 → 视频',
      subtitle: '经典 6 格分镜工作流',
      description: '最常见的工作流。用 GPT Image 2 生成分镜画面，再用 Seedance 2.0 动画化。适合品牌宣传、短剧和动画 OP。',
      whyItWorks: 'GPT Image 2 锁定视觉——角色设计、光影、构图。Seedance 2.0 只需要处理运动，当输入是一个干净、构图良好的画面时，它的表现非常稳定。',
      difficulty: '入门',
      steps: [
        { title: '描述你的场景', description: 'GPT Image 2 生成 6 格分镜图片。' },
        { title: '自动传递给 Seedance 2.0', description: '分镜直接流入视频模型，无需下载重传。' },
        { title: '动画化', description: 'Seedance 读取分镜并生成连续画面。' },
        { title: '下载', description: '同时获得分镜图片和最终视频。' },
      ],
      tips: [
        '输出分镜图片时使用 16:9 比例，避免 Seedance 自动裁剪。',
        '帧率设为 24fps 以匹配电影标准。',
        '每个分镜格越简洁，运动输出越准确。',
      ],
    },
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
    fields: [
      { key: 'YOUR_SCENE', label: 'Scene', labelZh: '场景描述', placeholder: 'e.g. A samurai battle sequence in a burning temple', placeholderZh: '例如：燃烧寺庙中的武士战斗序列', type: 'textarea' },
      { key: 'YOUR_CHARACTER', label: 'Character', labelZh: '角色描述', placeholder: 'e.g. Young warrior, silver armor, long black hair', placeholderZh: '例如：年轻战士，银色铠甲，黑色长发', type: 'text' },
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    trending: true,
    previewVideoUrl: 'https://github.com/user-attachments/assets/00f32388-a17b-4b9c-8da3-1956436ce91b',
    zh: {
      title: '3×3 网格分镜法',
      subtitle: '9 格合一，失败率大幅降低',
      description: '社区发现的技巧。将 9 个分镜合成一张网格图再交给 Seedance，它会把整张图当作一个连续运动意图来解读，比逐格导入的失败率低得多。',
      whyItWorks: 'Seedance 从单张图片分析运动意图。当你把 9 格排成视觉序列时，它把整张网格当作一个方向性提示——生成连续运动，而不是拼接 9 个独立片段时的卡顿。',
      difficulty: '入门',
      steps: [
        { title: '生成 3×3 网格', description: 'GPT Image 2 将 9 个分镜渲染为一张图，角色和风格保持一致。' },
        { title: '自动传递给 Seedance 2.0', description: '网格直接流入视频模型。' },
        { title: '作为运动序列动画化', description: 'Seedance 把 9 格当作一个运动意图，生成连续片段。' },
        { title: '输出 MP4 + 网格', description: '同时获得最终视频和源分镜网格。' },
      ],
      tips: [
        '每格内容越简洁，运动越可靠。一个主体，一个动作意图。',
        '24fps 是电影感，30fps 是电视感。根据目标类型选择。',
        '网格优于逐格，因为 Seedance 把 9 格当作一个运动意图——没有片段间的拼接瑕疵。',
      ],
    },
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
    fields: [
      { key: 'YOUR_CHARACTER', label: 'Character', labelZh: '角色描述', placeholder: 'e.g. Female knight, red hair, blue eyes, silver plate armor', placeholderZh: '例如：女骑士，红发，蓝眼，银色板甲', type: 'textarea' },
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/92a0aa56-441f-40db-b9c9-13410254cb3f',
    zh: {
      title: '角色设定表 → 动画',
      subtitle: '三视图转运动',
      description: '用 GPT Image 2 生成角色三视图（正面、侧面、背面），然后作为 Seedance 2.0 动画的一致性锚点。适合动漫角色、游戏角色和手办展示。',
      whyItWorks: '三视图让 Seedance 完整理解角色的各个角度，因此能生成一致的旋转和运动，不会凭空脑补缺失的细节。',
      difficulty: '进阶',
      steps: [
        { title: '生成角色设定表', description: 'GPT Image 2 在一张图中创建正/侧/背三个视角。' },
        { title: '生成分镜帧', description: '以设定表为参考创建动作姿态。' },
        { title: '动画化', description: 'Seedance 2.0 以一致的设计让角色动起来。' },
        { title: '下载', description: '获得角色设定表和动画视频。' },
      ],
      tips: [
        '在角色提示词中包含发色、瞳色、服装描述和体型。',
        '把三视图作为后续所有分镜帧的视觉锚点。',
        '避免在单个片段中切换角色视角。',
      ],
    },
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
    fields: [
      { key: 'YOUR_LOCATION', label: 'Location', labelZh: '场景地点', placeholder: 'e.g. Abandoned cathedral at the edge of a dark forest', placeholderZh: '例如：黑暗森林边缘的废弃大教堂', type: 'textarea' },
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/f08a2fee-89a7-4c7c-a58a-f1306f87419a',
    zh: {
      title: '动漫 OP 风格视频',
      subtitle: '暗黑奇幻高冲击剪辑',
      description: '用 GPT Image 2 构建场景设定图，然后让 Seedance 2.0 自由发挥动画。适合动漫片头的动态镜头工作。',
      whyItWorks: '当 Seedance 没有分镜约束自由发挥时，结果更具动感。动作序列用这种方式，比受控运动更有张力。',
      difficulty: '进阶',
      steps: [
        { title: '生成场景设定', description: 'GPT Image 2 创建详细的场景插画。' },
        { title: '导入 Seedance', description: '使用最简运动提示——让模型自己决定动作。' },
        { title: '对比迭代', description: '一版严格控制，一版自由动画，择优使用。' },
        { title: '下载最佳结果', description: '选出适合你序列的版本。' },
      ],
      tips: [
        '自由动画更有动感，但与源图的一致性较低。',
        '关键角色镜头用分镜控制，动作戏用自由动画。',
      ],
    },
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
    fields: [
      { key: 'YOUR_APP_CONCEPT', label: 'App concept', labelZh: 'App 概念', placeholder: 'e.g. AI-powered fitness coach that creates personalized workout plans', placeholderZh: '例如：AI 健身教练，创建个性化健身计划', type: 'textarea' },
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/09d81a41-b5c5-47f3-8c67-442b7a93b019',
    zh: {
      title: 'App MVP 演示视频',
      subtitle: '写代码前先验证市场',
      description: '用 GPT Image 2 生成逼真的 App UI 截图（产品还不存在），再用 Seedance 2.0 做成演示视频。发到社交媒体测试市场反应，再决定是否开发。',
      whyItWorks: 'GPT Image 2 能生成以假乱真的 UI 截图。Seedance 加上微妙的界面过渡动画，让演示看起来像真实产品。',
      difficulty: '入门',
      steps: [
        { title: '描述你的 App 概念', description: 'GPT Image 2 生成 3-5 张关键 UI 截图。' },
        { title: '按用户流排序', description: '按逻辑排列：首页 → 功能页 → 个人页。' },
        { title: '动画化过渡', description: 'Seedance 添加流畅的 UI 过渡动画。' },
        { title: '发布测试', description: '分享演示视频，观察受众反应。' },
      ],
      tips: [
        '使用 iOS 或 Android 原生设计语言，让截图更可信。',
        '演示控制在 15 秒内——社交媒体上注意力很短。',
      ],
    },
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
    fields: [
      { key: 'YOUR_PRODUCT', label: 'Product / Brand', labelZh: '产品/品牌', placeholder: 'e.g. Luxury mechanical watch brand "Chronos"', placeholderZh: '例如：高端机械腕表品牌「时序」', type: 'text' },
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/09ae3c57-b8fb-4323-ba76-7777541fe4a3',
    zh: {
      title: '15 秒广告',
      subtitle: '主视觉 → 多镜头广告',
      description: '两步工作流：GPT Image 2 生成主视觉和配套分镜，Seedance 2.0 逐镜头动画化。加上字幕和音乐即可得到完整的 15 秒广告。',
      whyItWorks: '从单一主视觉出发，确保所有镜头继承相同的色彩、光影和构图——品牌一致性天然保证。',
      difficulty: '进阶',
      steps: [
        { title: '生成主视觉', description: '定义品牌视觉风格的锚定图。' },
        { title: '创建分镜', description: '基于主视觉生成 4-5 格分镜。' },
        { title: '逐镜头动画化', description: '每格 3-4 秒的运动。' },
        { title: '组装', description: '在剪辑软件中加字幕和音乐。' },
      ],
      tips: [
        '15 秒 = 4-5 格，每格 3-4 秒。',
        '30 秒 = 8-10 格，每格 3 秒。',
        '60 秒 = 15-18 格，每格 3-4 秒。',
      ],
    },
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
        text: 'Create a 6-panel storyboard for a music video:\nIntro: {INTRO_VISUAL}\nVerse: {VERSE_VISUAL}\nChorus: {CHORUS_VISUAL}\nStyle: city pop anime, soft summer afternoon light, film grain texture.',
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
    fields: [
      { key: 'MUSIC_DESC', label: 'Music description', labelZh: '音乐描述', placeholder: 'e.g. A cheerful summer road trip pop song about freedom', placeholderZh: '例如：一首欢快的夏日公路旅行流行歌，关于自由', type: 'textarea' },
      { key: 'INTRO_VISUAL', label: 'Intro visual', labelZh: '前奏画面', placeholder: 'e.g. Empty street at dawn, first rays of sunlight', placeholderZh: '例如：黎明时分的空街，第一缕阳光', type: 'text' },
      { key: 'VERSE_VISUAL', label: 'Verse visual', labelZh: '主歌画面', placeholder: 'e.g. Character walking through a bustling market', placeholderZh: '例如：角色穿过热闹的集市', type: 'text' },
      { key: 'CHORUS_VISUAL', label: 'Chorus visual', labelZh: '副歌画面', placeholder: 'e.g. Dancing under cherry blossoms at sunset', placeholderZh: '例如：夕阳下在樱花树下起舞', type: 'text' },
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    hasMusic: true,
    musicStyle: 'pop, electronic, upbeat',
    previewVideoUrl: 'https://github.com/user-attachments/assets/fd4be5c7-cd02-4a77-ae07-6b80efeff201',
    zh: {
      title: 'Suno 音乐 MV',
      subtitle: '节拍 → 分镜 → 音画同步',
      description: '三工具组合：GPT Image 2 做画面，Seedance 2.0 做运动，Suno 做音乐。先出音乐锁定节奏，再根据拍点设计分镜。',
      whyItWorks: '先出音乐锁定节奏和结构。知道 BPM 和歌曲段落后，就能精确地让每格分镜卡在拍点上。',
      difficulty: '高级',
      steps: [
        { title: '生成音乐', description: '先在 Suno 创建目标风格的曲目。' },
        { title: '按段落设计分镜', description: '前奏/主歌/副歌各有专属分镜。' },
        { title: '逐格动画化', description: '片段时长匹配拍点结构。' },
        { title: '音画同步', description: '在剪辑软件中对齐画面和音乐。' },
      ],
      tips: [
        '先出音乐。知道节奏和时长再设计分镜，才能精确卡拍。',
        '利用 Suno 的歌曲结构（前奏/主歌/副歌）组织分镜段落。',
      ],
    },
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
    fields: [
      { key: 'YOUR_CHARACTER', label: 'Character', labelZh: '角色描述', placeholder: 'e.g. Young woman with neon-blue bob cut, transparent raincoat, LED earrings', placeholderZh: '例如：蓝色霓虹短发少女，透明雨衣，LED 耳环', type: 'textarea' },
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/db6ebb63-90dc-47c5-96c5-ab2fa53ed56d',
    zh: {
      title: '赛博朋克短片',
      subtitle: '霓虹灯下的视觉叙事',
      description: '用 GPT Image 2 建立一致的视觉体系（赛博朋克、霓虹、灯笼），再用 Seedance 2.0 逐帧动画化，产出风格化短片。',
      whyItWorks: '在 GPT Image 2 中固定视觉体系（色彩、光影、角色造型），意味着 Seedance 动画化的每一帧都共享相同的氛围——片段间没有违和的风格跳跃。',
      difficulty: '进阶',
      steps: [
        { title: '定义视觉风格', description: '在 GPT Image 2 中固定色彩、光影和角色造型。' },
        { title: '生成 4-6 张氛围图', description: '每张图都传递相同的赛博朋克美感。' },
        { title: '慢运动动画化', description: '大气的镜头漂移和粒子效果。' },
        { title: '编排成叙事', description: '将片段组成一个短视觉故事。' },
      ],
      tips: [
        '在每个提示词中加简短的角色描述以保持一致性。',
        '避免在单个片段中切换角色视角。',
        '片段时长控制在 4 秒内——越短的片段累积的畸变越少。',
      ],
    },
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
    fields: [
      { key: 'YOUR_THEME', label: 'Theme', labelZh: '主题', placeholder: 'e.g. Chinese mythology martial arts, ink painting style', placeholderZh: '例如：中国神话武侠，水墨画风格', type: 'text' },
    ],
    defaultImageModel: 'gpt-image-2',
    defaultVideoModel: 'seedance-2.0-image-to-video',
    previewVideoUrl: 'https://github.com/user-attachments/assets/961c4bc4-c83c-49d3-bc14-7b128e80bc17',
    zh: {
      title: '游戏 & 互动 UI',
      subtitle: 'HUD + 技能栏 + 选项叠加',
      description: '生成带 HUD 元素、技能栏和选项面板的游戏风格 UI 图片，再用 Seedance 2.0 动画化，模拟互动游戏画面。',
      whyItWorks: '游戏和插画风格在 Seedance 中受到的内容限制比写实人物少。结构化的 UI 布局也给 Seedance 提供了清晰的空间线索来做动画。',
      difficulty: '进阶',
      steps: [
        { title: '生成游戏 UI', description: 'GPT Image 2 创建带 HUD 元素的 ARPG 风格截图。' },
        { title: '添加交互提示', description: '描述战斗或菜单交互序列。' },
        { title: '动画化', description: 'Seedance 模拟 UI 交互和战斗。' },
        { title: '后期润色', description: '在后期制作中添加粒子效果和光晕。' },
      ],
      tips: [
        'Seedance 对写实人物有内容限制。游戏和动漫风格能绕过大部分限制。',
        '在图片中包含 HUD 元素——它们给 Seedance 清晰的布局线索。',
      ],
    },
  },
]

export function getWorkflowBySlug(slug: string): WorkflowDefinition | undefined {
  return WORKFLOWS.find((w) => w.slug === slug)
}

export function getWorkflowsByCategory(category: string): WorkflowDefinition[] {
  if (category === 'all') return WORKFLOWS
  return WORKFLOWS.filter((w) => w.category === category)
}

export function localizeWorkflow(w: WorkflowDefinition, locale: string): WorkflowDefinition {
  if (locale === 'zh' && w.zh) {
    return {
      ...w,
      title: w.zh.title,
      subtitle: w.zh.subtitle,
      description: w.zh.description,
      whyItWorks: w.zh.whyItWorks,
      difficulty: w.zh.difficulty as WorkflowDefinition['difficulty'],
      steps: w.zh.steps,
      tips: w.zh.tips,
    }
  }
  return w
}
