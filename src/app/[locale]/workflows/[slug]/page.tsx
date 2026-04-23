'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Link } from '@/i18n/navigation'
import { getWorkflowBySlug, WORKFLOWS } from '../workflow-data'
import { useWorkflowRun } from '../hooks/useWorkflowRun'
import { trackEvent } from '@/lib/analytics'

const STYLE_OPTIONS = ['Anime OP', 'Cinematic', 'Cyberpunk', 'Painterly']
const RATIO_OPTIONS = ['16:9', '9:16', '1:1']
const DURATION_OPTIONS = [3, 5, 10]

export default function WorkflowDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const workflow = getWorkflowBySlug(slug)
  const wf = useWorkflowRun()

  const [scene, setScene] = useState('')
  const [character, setCharacter] = useState('')
  const [style, setStyle] = useState('Anime OP')
  const [ratio, setRatio] = useState('16:9')
  const [duration, setDuration] = useState(5)

  const resultRef = useRef<HTMLDivElement>(null)

  const handleRun = useCallback(() => {
    if (!workflow || !scene.trim()) return
    trackEvent('workflow_run')

    const imagePrompt = workflow.prompts[0]?.text
      .replace('{YOUR_SCENE}', scene)
      .replace('{YOUR_CHARACTER}', character || 'protagonist')
      .replace('{YOUR_LOCATION}', scene)
      .replace('{YOUR_APP_CONCEPT}', scene)
      .replace('{YOUR_PRODUCT}', scene)
      .replace('{YOUR_THEME}', scene)
      .replace('{VISUAL_CONCEPT}', scene)
      || scene

    const videoPrompt = workflow.prompts[1]?.text || `${style} style, cinematic, 24fps`

    wf.run({
      imagePrompt,
      videoPrompt,
      imageModel: workflow.defaultImageModel,
      videoModel: workflow.defaultVideoModel,
      size: ratio,
      resolution: '2K',
      quality: 'medium',
      duration,
    })

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
  }, [workflow, scene, character, style, ratio, duration, wf])

  if (!workflow) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono mb-4">Workflow not found</h1>
          <Link href={{ pathname: '/workflows' }} className="text-indigo-600 hover:underline">
            ← Back to workflows
          </Link>
        </div>
      </div>
    )
  }

  const related = WORKFLOWS.filter((w) => w.slug !== slug).slice(0, 3)

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[1280px] mx-auto bg-white border-x border-[#eaeaea] min-h-screen">
        <Navbar session={session} />

        {/* Breadcrumb */}
        <div className="pt-5 px-10 font-mono text-[12px] text-[#aaa] max-w-[1180px] mx-auto">
          <Link href={{ pathname: '/workflows' }} className="text-[#555] hover:text-[#0a0a0a]">Workflows</Link>
          {' / '}
          <span>{workflow.title}</span>
        </div>

        {/* Header */}
        <div className="pt-5 pb-8 px-10 max-w-[1180px] mx-auto">
          <div className="flex gap-2.5 mb-4 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[12px] bg-[#f5f5f5] text-[#555] font-mono">
              case {String(workflow.caseNumber).padStart(2, '0')}
            </span>
            {workflow.trending && (
              <span className="px-3 py-1 rounded-full text-[12px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium">
                Trending
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-[12px] bg-[#f5f5f5] text-[#555] font-mono">{workflow.category}</span>
          </div>

          <h1 className="font-mono text-4xl font-normal tracking-tight leading-tight mb-4">
            {workflow.title}<br />
            <span className="text-2xl bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              → {workflow.subtitle}
            </span>
          </h1>

          <p className="text-[17px] text-[#555] leading-relaxed max-w-[720px] mb-6">{workflow.description}</p>

          <div className="flex gap-7 flex-wrap py-4 border-y border-[#f0f0f0] text-sm">
            <div><span className="font-mono text-[11px] text-[#999] block">CREATOR</span><span className="font-medium">{workflow.creator}</span></div>
            <div><span className="font-mono text-[11px] text-[#999] block">DIFFICULTY</span><span className="font-medium">{workflow.difficulty}</span></div>
            <div><span className="font-mono text-[11px] text-[#999] block">RUN TIME</span><span className="font-medium">{workflow.estimatedTime}</span></div>
            <div><span className="font-mono text-[11px] text-[#999] block">COST</span><span className="font-medium">{workflow.estimatedCredits} credits</span></div>
          </div>
        </div>

        {/* Body: left content + right run panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 px-10 pb-12 max-w-[1180px] mx-auto">

          {/* Left column */}
          <div>
            {/* Why it works */}
            <div className="p-5 bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff] border border-[#e9d5ff] rounded-xl mb-6">
              <div className="font-mono text-[10px] text-[#7c3aed] tracking-widest mb-2">WHY IT WORKS</div>
              <p className="text-[15px] text-[#3b0764] leading-relaxed">{workflow.whyItWorks}</p>
            </div>

            {/* Steps */}
            <h3 className="font-mono text-lg font-normal tracking-tight mb-3.5">How it runs</h3>
            <div className="flex flex-col gap-2.5 mb-8">
              {workflow.steps.map((step, i) => (
                <div key={i} className="flex gap-3.5 items-start p-4 bg-white border border-[#e5e5e5] rounded-xl">
                  <div className="shrink-0 w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center text-[13px] font-mono font-medium">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-[14.5px] font-medium mb-1">{step.title}</div>
                    <div className="text-[13px] text-[#666] leading-relaxed">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prompts */}
            <h3 className="font-mono text-lg font-normal tracking-tight mb-3.5">The prompts we use</h3>
            {workflow.prompts.map((p, i) => (
              <div key={i} className="bg-[#fafafa] border border-[#eee] rounded-xl p-4 mb-2.5">
                <div className="font-mono text-[10px] text-[#8b5cf6] tracking-widest mb-2 flex justify-between items-center">
                  <span>{p.label}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(p.text)}
                    className="px-2.5 py-0.5 bg-white border border-[#d4d4d4] rounded-full text-[10.5px] text-[#555] hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition"
                  >
                    Copy
                  </button>
                </div>
                <pre className="bg-white border border-[#eee] rounded-md p-3 text-[12.5px] text-[#333] font-mono whitespace-pre-wrap leading-relaxed">
                  {p.text}
                </pre>
              </div>
            ))}

            {/* Tips */}
            <h3 className="font-mono text-lg font-normal tracking-tight mt-8 mb-3.5">Pro tips</h3>
            {workflow.tips.map((tip, i) => (
              <div
                key={i}
                className={`p-3.5 border rounded-lg mb-2.5 text-[13.5px] leading-relaxed ${
                  i === 0
                    ? 'border-l-2 border-l-purple-500 border-[#e5e5e5] rounded-l bg-[#faf5ff] text-[#3b0764]'
                    : 'border-[#e5e5e5] text-[#555]'
                }`}
              >
                {tip}
              </div>
            ))}
          </div>

          {/* Right column: Run panel */}
          <aside className="lg:sticky lg:top-20 self-start bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <div className="font-mono text-[11px] text-[#999] tracking-widest mb-4">RUN THIS WORKFLOW</div>

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#0a0a0a] mb-1.5">
                Scene <span className="font-mono text-[11px] text-[#999] font-normal ml-1">required</span>
              </label>
              <textarea
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                placeholder="e.g. A lone samurai walks through a rain-soaked Tokyo alley at night..."
                className="w-full border border-[#d4d4d4] rounded-lg px-3 py-2.5 text-[13px] min-h-[84px] resize-y focus:outline-none focus:border-[#0a0a0a] transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#0a0a0a] mb-1.5">
                Character lock <span className="font-mono text-[11px] text-[#999] font-normal ml-1">optional</span>
              </label>
              <input
                type="text"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                placeholder="e.g. late-20s man, black hair, leather coat"
                className="w-full border border-[#d4d4d4] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#0a0a0a] transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#0a0a0a] mb-1.5">Style</label>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-3 py-1.5 rounded-full text-[12px] border transition ${
                      style === s ? 'border-[#0a0a0a] text-[#0a0a0a]' : 'border-[#e5e5e5] text-[#555]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#0a0a0a] mb-1.5">Ratio</label>
              <div className="flex gap-1.5">
                {RATIO_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatio(r)}
                    className={`flex-1 py-2 rounded-lg text-[12px] border text-center transition ${
                      ratio === r ? 'border-[#0a0a0a] text-[#0a0a0a]' : 'border-[#e5e5e5] text-[#555]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#0a0a0a] mb-1.5">Duration</label>
              <div className="flex gap-1.5">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-[12px] border text-center transition ${
                      duration === d ? 'border-[#0a0a0a] text-[#0a0a0a]' : 'border-[#e5e5e5] text-[#555]'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={!scene.trim() || wf.status !== 'idle'}
              className="w-full mt-2 py-3 bg-[#0a0a0a] text-white rounded-full text-[14px] font-medium hover:bg-[#333] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {wf.status === 'idle' ? 'Run workflow' : wf.status === 'video_done' ? 'Done ✓' : 'Running...'}
            </button>
            <div className="text-center mt-2 text-[11px] font-mono text-[#888]">
              ~{workflow.estimatedCredits} credits
            </div>

            {wf.status !== 'idle' && (
              <button
                onClick={wf.reset}
                className="w-full mt-2 py-2 text-[13px] text-[#555] hover:text-[#0a0a0a] transition"
              >
                Reset
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-[#f0f0f0] text-[12px] text-[#777] leading-relaxed">
              Shared by <span className="font-medium text-[#0a0a0a]">{workflow.creator}</span>
            </div>
          </aside>
        </div>

        {/* Result area */}
        {wf.status !== 'idle' && (
          <div ref={resultRef} className="px-10 pb-12 max-w-[1180px] mx-auto">
            <h3 className="font-mono text-lg font-normal tracking-tight mb-4">Result</h3>

            {/* Progress bar */}
            <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${wf.progress}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Image result */}
              <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-2xl aspect-video overflow-hidden flex items-center justify-center">
                {wf.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wf.imageUrl} alt="Generated storyboard" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[13px] text-[#999] font-mono">
                    {wf.status === 'generating_image' ? 'Generating image...' : 'Waiting'}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div className="text-2xl font-mono text-[#0a0a0a] hidden md:block">→</div>

              {/* Video result */}
              <div className="bg-gradient-to-br from-[#1a0f2a] to-[#0a0515] border border-[#e5e5e5] rounded-2xl aspect-video overflow-hidden flex items-center justify-center relative">
                {wf.videoUrl ? (
                  <video src={wf.videoUrl} controls autoPlay className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[13px] text-white/60 font-mono">
                    {wf.status === 'generating_video' ? 'Generating video...' : wf.status === 'image_done' ? 'Starting video...' : 'Waiting for image'}
                  </div>
                )}
              </div>
            </div>

            {wf.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg">
                {wf.error}
              </div>
            )}

            {wf.videoUrl && (
              <div className="mt-4 flex gap-3">
                <a
                  href={wf.videoUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#0a0a0a] text-white rounded-full text-[13px] font-medium hover:bg-[#333] transition"
                >
                  Download Video
                </a>
                {wf.imageUrl && (
                  <a
                    href={wf.imageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-white text-[#0a0a0a] border border-[#d4d4d4] rounded-full text-[13px] font-medium hover:border-[#0a0a0a] transition"
                  >
                    Download Image
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Related workflows */}
        <div className="py-10 px-10 bg-[#fafafa] border-t border-[#f0f0f0]">
          <h3 className="font-mono text-xl font-normal tracking-tight max-w-[1100px] mx-auto mb-5">Related workflows</h3>
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((w) => (
              <Link
                key={w.slug}
                href={{ pathname: '/workflows/[slug]' as never, params: { slug: w.slug } } as never}
                className="bg-white border border-[#e5e5e5] rounded-xl p-4 hover:border-[#0a0a0a] transition"
              >
                <div className="font-mono text-[11px] text-[#999] mb-2">case {String(w.caseNumber).padStart(2, '0')} · {w.category}</div>
                <h4 className="text-[14px] font-medium mb-1.5">{w.title}</h4>
                <p className="text-[12.5px] text-[#666] leading-relaxed">{w.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
