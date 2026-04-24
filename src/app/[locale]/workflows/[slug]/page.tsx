'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import { AppIcon } from '@/components/ui/icons'
import { Link, useRouter } from '@/i18n/navigation'
import { getWorkflowBySlug, WORKFLOWS, localizeWorkflow } from '../workflow-data'
import { useLocale } from 'next-intl'
import { useWorkflowRun } from '../hooks/useWorkflowRun'
import { trackEvent } from '@/lib/analytics'

const RATIO_OPTIONS = ['16:9', '9:16', '1:1']
const DURATION_OPTIONS = [6, 10, 15]
const TABS = ['steps', 'prompts', 'tips'] as const
type TabKey = (typeof TABS)[number]

export default function WorkflowDetailPage() {
  const { data: session } = useSession()
  const params = useParams() ?? {}
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const locale = useLocale()
  const rawWorkflow = getWorkflowBySlug(slug)
  const workflow = rawWorkflow ? localizeWorkflow(rawWorkflow, locale) : undefined
  const wf = useWorkflowRun()
  const router = useRouter()
  const t = useTranslations('workflows.detail')

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [imageModel, setImageModel] = useState<'gpt-image-2' | 'gpt-image-2-beta'>('gpt-image-2')
  const [ratio, setRatio] = useState('16:9')
  const [duration, setDuration] = useState(10)
  const [activeTab, setActiveTab] = useState<TabKey>('steps')
  const [zoomMedia, setZoomMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null)

  useEffect(() => {
    if (!zoomMedia) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomMedia(null) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [zoomMedia])

  const updateField = useCallback((key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const allFieldsFilled = workflow?.fields.every((f) => (fieldValues[f.key] || '').trim()) ?? false

  const handleRun = useCallback(() => {
    if (!workflow || !allFieldsFilled) return
    if (!session) {
      router.push({ pathname: '/auth/signin' })
      return
    }
    trackEvent('workflow_run')

    let imagePrompt = workflow.prompts[0]?.text || ''
    for (const field of workflow.fields) {
      const val = fieldValues[field.key] || ''
      imagePrompt = imagePrompt.replaceAll(`{${field.key}}`, val)
    }

    const videoPrompt = workflow.prompts[1]?.text || 'cinematic, 24fps'

    wf.run({
      imagePrompt,
      videoPrompt,
      imageModel,
      videoModel: workflow.defaultVideoModel,
      size: ratio,
      resolution: '2K',
      quality: 'medium',
      duration,
      ...(rawWorkflow?.hasMusic && fieldValues['MUSIC_DESC'] ? {
        musicPrompt: fieldValues['MUSIC_DESC'],
        musicStyle: rawWorkflow.musicStyle || 'pop, electronic',
        musicTitle: 'Workflow Track',
      } : {}),
    })
  }, [workflow, fieldValues, allFieldsFilled, imageModel, ratio, duration, wf, session, router])

  if (!workflow) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono mb-4">{t('notFound')}</h1>
          <Link href="/workflows" className="text-indigo-600 hover:underline">
            {t('backToList')}
          </Link>
        </div>
      </div>
    )
  }

  const related = WORKFLOWS.filter((w) => w.slug !== slug).slice(0, 3).map((w) => localizeWorkflow(w, locale))
  const tabLabels: Record<TabKey, string> = {
    steps: t('howItRuns'),
    prompts: t('prompts'),
    tips: t('tips'),
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Compact header */}
      <div className="px-6 lg:px-10 pt-3 pb-3 max-w-[1280px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <Link href="/workflows" className="font-mono text-[12px] text-[#555] hover:text-[#0a0a0a]">← Workflows</Link>
          <span className="text-[#ddd]">|</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#f5f5f5] text-[#555] font-mono">
            case {String(workflow.caseNumber).padStart(2, '0')}
          </span>
          {workflow.trending && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium">
              Trending
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-[#f5f5f5] text-[#555] font-mono">{workflow.category}</span>
          <div className="ml-auto flex gap-5 text-[11px] font-mono text-[#999]">
            <span>{workflow.creator}</span>
            <span>{workflow.difficulty}</span>
            <span>{workflow.estimatedTime}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <h1 className="font-mono text-2xl font-normal tracking-tight">{workflow.title}</h1>
          <span className="text-lg bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-mono">
            → {workflow.subtitle}
          </span>
        </div>
        <p className="text-[13px] text-[#666] leading-relaxed max-w-[800px] mt-1">{workflow.description}</p>
      </div>

      {/* ═══ Main: Left form + Right results ═══ */}
      <div className="px-6 lg:px-10 max-w-[1280px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-stretch">

          {/* Left: Run form */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 self-start">
            <div className="font-mono text-[10px] text-[#999] tracking-widest mb-3">{t('runPanel')}</div>

            {workflow.fields.map((field) => (
              <div key={field.key} className="mb-3">
                <label className="block text-[12px] font-medium text-[#0a0a0a] mb-1">
                  {locale === 'zh' ? field.labelZh : field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={fieldValues[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={locale === 'zh' ? field.placeholderZh : field.placeholder}
                    className="w-full border border-[#d4d4d4] rounded-lg px-3 py-2 text-[12px] min-h-[72px] resize-y focus:outline-none focus:border-[#0a0a0a] transition"
                  />
                ) : (
                  <input
                    type="text"
                    value={fieldValues[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={locale === 'zh' ? field.placeholderZh : field.placeholder}
                    className="w-full border border-[#d4d4d4] rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-[#0a0a0a] transition"
                  />
                )}
              </div>
            ))}

            <div className="mb-3">
              <label className="block text-[12px] font-medium text-[#0a0a0a] mb-1">
                {locale === 'zh' ? '图片模型' : 'Image Model'}
              </label>
              <div className="flex gap-1">
                <button onClick={() => setImageModel('gpt-image-2')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] border text-center transition ${imageModel === 'gpt-image-2' ? 'border-[#0a0a0a] text-[#0a0a0a]' : 'border-[#e5e5e5] text-[#555]'}`}>
                  GPT Image 2
                </button>
                <button onClick={() => setImageModel('gpt-image-2-beta')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] border text-center transition ${imageModel === 'gpt-image-2-beta' ? 'border-[#0a0a0a] text-[#0a0a0a]' : 'border-[#e5e5e5] text-[#555]'}`}>
                  GPT Image 2 Beta
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[12px] font-medium text-[#0a0a0a] mb-1">{t('ratio')}</label>
                <div className="flex gap-1">
                  {RATIO_OPTIONS.map((r) => (
                    <button key={r} onClick={() => setRatio(r)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] border text-center transition ${ratio === r ? 'border-[#0a0a0a] text-[#0a0a0a]' : 'border-[#e5e5e5] text-[#555]'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#0a0a0a] mb-1">{t('duration')}</label>
                <div className="flex gap-1">
                  {DURATION_OPTIONS.map((d) => (
                    <button key={d} onClick={() => setDuration(d)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] border text-center transition ${duration === d ? 'border-[#0a0a0a] text-[#0a0a0a]' : 'border-[#e5e5e5] text-[#555]'}`}>
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={!allFieldsFilled || (wf.status !== 'idle' && wf.status !== 'video_done')}
              className="w-full py-2.5 bg-[#0a0a0a] text-white rounded-full text-[13px] font-medium hover:bg-[#333] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!session
                ? t('loginRequired')
                : wf.status === 'idle' || wf.status === 'video_done'
                  ? t('run')
                  : t('running')}
            </button>

            {wf.status !== 'idle' && (
              <button onClick={wf.reset} className="w-full mt-1.5 py-1.5 text-[12px] text-[#555] hover:text-[#0a0a0a] transition">
                {t('reset')}
              </button>
            )}

            <div className="mt-3 pt-3 border-t border-[#f0f0f0] text-[11px] text-[#777]">
              {t('sharedBy')} <span className="font-medium text-[#0a0a0a]">{workflow.creator}</span>
            </div>
          </div>

          {/* Right: Results (always visible, matches left panel height) */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Progress bar */}
            {wf.status !== 'idle' && (
              <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${wf.progress}%` }} />
              </div>
            )}

            {/* Music bar */}
            {(wf.status === 'generating_music' || wf.status === 'music_done' || wf.musicUrl) && (
              <div className="p-3 bg-gradient-to-r from-[#faf5ff] to-[#f3e8ff] border border-[#e9d5ff] rounded-xl flex items-center gap-3">
                <div className="shrink-0 w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-[11px] font-mono">♪</div>
                {wf.musicUrl ? (
                  <audio src={wf.musicUrl} controls className="flex-1 h-8" />
                ) : (
                  <div className="text-[12px] text-[#7c3aed] font-mono animate-pulse">Generating music...</div>
                )}
              </div>
            )}


            {/* Image → Video */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch min-h-[200px]">
              <div
                className={`bg-[#fafafa] border border-[#e5e5e5] rounded-2xl overflow-hidden flex items-center justify-center relative ${wf.imageUrl ? 'group' : ''}`}
              >
                {wf.imageUrl ? (
                  <div className="relative w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={wf.imageUrl} alt="Generated storyboard" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                    <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => setZoomMedia({ type: 'image', url: wf.imageUrl! })}
                        className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition">
                        <AppIcon name="search" className="w-4 h-4 text-white" />
                      </button>
                      <a href={wf.imageUrl} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition">
                        <AppIcon name="download" className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-[13px] text-[#999] font-mono text-center px-4">
                    {wf.status === 'idle'
                      ? (locale === 'zh' ? '填写左侧表单后点击运行' : 'Fill the form and click Run')
                      : wf.status === 'generating_music' || wf.status === 'music_done'
                        ? t('waiting')
                        : wf.status === 'generating_image' ? t('generatingImage') : t('waiting')}
                  </div>
                )}
              </div>

              <div className="text-2xl font-mono text-[#0a0a0a] hidden md:flex items-center">→</div>

              <div
                className={`bg-gradient-to-br from-[#1a0f2a] to-[#0a0515] border border-[#e5e5e5] rounded-2xl overflow-hidden flex items-center justify-center relative ${wf.videoUrl ? 'group' : ''}`}
              >
                {wf.videoUrl ? (
                  <div className="relative w-full h-full">
                    <video src={wf.videoUrl} controls autoPlay className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => setZoomMedia({ type: 'video', url: wf.videoUrl! })}
                        className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition">
                        <AppIcon name="maximize" className="w-4 h-4 text-white" />
                      </button>
                      <a href={wf.videoUrl} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition">
                        <AppIcon name="download" className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-[13px] text-white/60 font-mono text-center px-4">
                    {wf.status === 'idle'
                      ? (locale === 'zh' ? '视频将在这里生成' : 'Video will appear here')
                      : wf.status === 'generating_video' ? t('generatingVideo')
                        : wf.status === 'image_done' || wf.status === 'optimizing_prompt' || wf.status === 'prompt_optimized' ? t('startingVideo')
                        : t('waitingImage')}
                  </div>
                )}
              </div>
            </div>

            {/* Error / Download */}
            {wf.error && (
              wf.error === 'API_KEY_REQUIRED' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[13px] rounded-lg flex items-center justify-between">
                  <span>{locale === 'zh' ? '请先配置 EvoLink API Key' : 'Please configure your EvoLink API Key first'}</span>
                  <Link href="/profile" className="px-4 py-1.5 bg-amber-600 text-white rounded-full text-[12px] font-medium hover:bg-amber-700 transition">
                    {locale === 'zh' ? '去配置 →' : 'Configure →'}
                  </Link>
                </div>
              ) : (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg">{wf.error}</div>
              )
            )}

          </div>
        </div>
      </div>

      {/* ═══ Bottom: WHY + Tabs ═══ */}
      <div className="px-6 lg:px-10 pt-5 pb-4 max-w-[1280px] mx-auto w-full">
        {/* WHY */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#faf5ff] to-[#f3e8ff] border border-[#e9d5ff] rounded-lg mb-3 flex items-start gap-2">
          <span className="font-mono text-[10px] text-[#7c3aed] tracking-widest shrink-0 mt-0.5">WHY</span>
          <p className="text-[13px] text-[#3b0764] leading-relaxed">{workflow.whyItWorks}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#e5e5e5] mb-3">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 transition -mb-px ${activeTab === tab ? 'border-[#0a0a0a] text-[#0a0a0a]' : 'border-transparent text-[#999] hover:text-[#555]'}`}>
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="pb-4">
          {activeTab === 'steps' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {workflow.steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-start p-3 bg-white border border-[#e5e5e5] rounded-xl">
                  <div className="shrink-0 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center text-[12px] font-mono font-medium">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium mb-0.5">{step.title}</div>
                    <div className="text-[12px] text-[#666] leading-relaxed">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {workflow.prompts.map((p, i) => (
                <div key={i} className="bg-[#fafafa] border border-[#eee] rounded-xl p-3">
                  <div className="font-mono text-[10px] text-[#8b5cf6] tracking-widest mb-1.5 flex justify-between items-center">
                    <span>{p.label}</span>
                    <button onClick={() => navigator.clipboard?.writeText(p.text)}
                      className="px-2.5 py-0.5 bg-white border border-[#d4d4d4] rounded-full text-[10.5px] text-[#555] hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition">
                      {t('copy')}
                    </button>
                  </div>
                  <pre className="bg-white border border-[#eee] rounded-md p-2.5 text-[12px] text-[#333] font-mono whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
                    {p.text}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {workflow.tips.map((tip, i) => (
                <div key={i}
                  className={`p-3 border rounded-lg text-[13px] leading-relaxed ${i === 0 ? 'border-l-2 border-l-purple-500 border-[#e5e5e5] bg-[#faf5ff] text-[#3b0764]' : 'border-[#e5e5e5] text-[#555]'}`}>
                  {tip}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related workflows */}
      <div className="mt-auto py-5 px-6 lg:px-10 bg-[#fafafa] border-t border-[#f0f0f0]">
        <h3 className="font-mono text-base font-normal tracking-tight max-w-[1200px] mx-auto mb-3">{t('related')}</h3>
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
          {related.map((w) => (
            <Link key={w.slug} href={`/workflows/${w.slug}`}
              className="bg-white border border-[#e5e5e5] rounded-xl p-3 hover:border-[#0a0a0a] transition">
              <div className="font-mono text-[10px] text-[#999] mb-1">case {String(w.caseNumber).padStart(2, '0')} · {w.category}</div>
              <h4 className="text-[13px] font-medium mb-0.5">{w.title}</h4>
              <p className="text-[12px] text-[#666] leading-relaxed">{w.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {zoomMedia && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out" onClick={() => setZoomMedia(null)}>
          <button onClick={() => setZoomMedia(null)}
            className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition z-10">
            <AppIcon name="close" className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-[90vw] max-h-[90vh] cursor-default" onClick={(e) => e.stopPropagation()}>
            {zoomMedia.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={zoomMedia.url} alt="Zoomed result" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            ) : (
              <video src={zoomMedia.url} controls autoPlay className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            )}
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3">
            <a href={zoomMedia.url} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full text-[13px] font-medium transition">
              {zoomMedia.type === 'image' ? t('downloadImage') : t('downloadVideo')}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
