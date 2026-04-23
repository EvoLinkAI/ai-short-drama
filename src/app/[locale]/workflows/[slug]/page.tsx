'use client'

import { useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Link, useRouter } from '@/i18n/navigation'
import { getWorkflowBySlug, WORKFLOWS, localizeWorkflow } from '../workflow-data'
import { useLocale } from 'next-intl'
import { useWorkflowRun } from '../hooks/useWorkflowRun'
import { trackEvent } from '@/lib/analytics'

const RATIO_OPTIONS = ['16:9', '9:16', '1:1']
const DURATION_OPTIONS = [6, 10, 15]

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
  const [ratio, setRatio] = useState('16:9')
  const [duration, setDuration] = useState(10)

  const resultRef = useRef<HTMLDivElement>(null)

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
      imageModel: workflow.defaultImageModel,
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

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
  }, [workflow, fieldValues, allFieldsFilled, ratio, duration, wf, session, router])

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

  return (
    <div className="min-h-screen bg-white">
      <div>
        <Navbar />

        {/* Breadcrumb */}
        <div className="pt-5 px-10 font-mono text-[12px] text-[#aaa] max-w-[1180px] mx-auto">
          <Link href="/workflows" className="text-[#555] hover:text-[#0a0a0a]">Workflows</Link>
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
          </div>
        </div>

        {/* Body: left content + right run panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 px-10 pb-12 max-w-[1180px] mx-auto">

          {/* Left column */}
          <div>
            <div className="p-5 bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff] border border-[#e9d5ff] rounded-xl mb-6">
              <div className="font-mono text-[10px] text-[#7c3aed] tracking-widest mb-2">{t('whyItWorks')}</div>
              <p className="text-[15px] text-[#3b0764] leading-relaxed">{workflow.whyItWorks}</p>
            </div>

            <h3 className="font-mono text-lg font-normal tracking-tight mb-3.5">{t('howItRuns')}</h3>
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

            <h3 className="font-mono text-lg font-normal tracking-tight mb-3.5">{t('prompts')}</h3>
            {workflow.prompts.map((p, i) => (
              <div key={i} className="bg-[#fafafa] border border-[#eee] rounded-xl p-4 mb-2.5">
                <div className="font-mono text-[10px] text-[#8b5cf6] tracking-widest mb-2 flex justify-between items-center">
                  <span>{p.label}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(p.text)}
                    className="px-2.5 py-0.5 bg-white border border-[#d4d4d4] rounded-full text-[10.5px] text-[#555] hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition"
                  >
                    {t('copy')}
                  </button>
                </div>
                <pre className="bg-white border border-[#eee] rounded-md p-3 text-[12.5px] text-[#333] font-mono whitespace-pre-wrap leading-relaxed">
                  {p.text}
                </pre>
              </div>
            ))}

            <h3 className="font-mono text-lg font-normal tracking-tight mt-8 mb-3.5">{t('tips')}</h3>
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
            <div className="font-mono text-[11px] text-[#999] tracking-widest mb-4">{t('runPanel')}</div>

            {workflow.fields.map((field) => (
              <div key={field.key} className="mb-4">
                <label className="block text-[13px] font-medium text-[#0a0a0a] mb-1.5">
                  {locale === 'zh' ? field.labelZh : field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={fieldValues[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={locale === 'zh' ? field.placeholderZh : field.placeholder}
                    className="w-full border border-[#d4d4d4] rounded-lg px-3 py-2.5 text-[13px] min-h-[84px] resize-y focus:outline-none focus:border-[#0a0a0a] transition"
                  />
                ) : (
                  <input
                    type="text"
                    value={fieldValues[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={locale === 'zh' ? field.placeholderZh : field.placeholder}
                    className="w-full border border-[#d4d4d4] rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#0a0a0a] transition"
                  />
                )}
              </div>
            ))}

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#0a0a0a] mb-1.5">{t('ratio')}</label>
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
              <label className="block text-[13px] font-medium text-[#0a0a0a] mb-1.5">{t('duration')}</label>
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
              disabled={!allFieldsFilled || (wf.status !== 'idle' && wf.status !== 'video_done')}
              className="w-full mt-2 py-3 bg-[#0a0a0a] text-white rounded-full text-[14px] font-medium hover:bg-[#333] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!session
                ? t('loginRequired')
                : wf.status === 'idle' || wf.status === 'video_done'
                  ? t('run')
                  : t('running')}
            </button>

            {wf.status !== 'idle' && (
              <button
                onClick={wf.reset}
                className="w-full mt-2 py-2 text-[13px] text-[#555] hover:text-[#0a0a0a] transition"
              >
                {t('reset')}
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-[#f0f0f0] text-[12px] text-[#777] leading-relaxed">
              {t('sharedBy')} <span className="font-medium text-[#0a0a0a]">{workflow.creator}</span>
            </div>
          </aside>
        </div>

        {/* Result area */}
        {wf.status !== 'idle' && (
          <div ref={resultRef} className="px-10 pb-12 max-w-[1180px] mx-auto">
            <h3 className="font-mono text-lg font-normal tracking-tight mb-4">{t('result')}</h3>

            <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${wf.progress}%` }}
              />
            </div>

            {(wf.status === 'generating_music' || wf.status === 'music_done' || wf.musicUrl) && (
              <div className="mb-4 p-4 bg-gradient-to-r from-[#faf5ff] to-[#f3e8ff] border border-[#e9d5ff] rounded-xl flex items-center gap-4">
                <div className="shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-[12px] font-mono">♪</div>
                {wf.musicUrl ? (
                  <audio src={wf.musicUrl} controls className="flex-1 h-8" />
                ) : (
                  <div className="text-[13px] text-[#7c3aed] font-mono animate-pulse">Generating music...</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-2xl aspect-video overflow-hidden flex items-center justify-center">
                {wf.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wf.imageUrl} alt="Generated storyboard" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[13px] text-[#999] font-mono">
                    {wf.status === 'generating_music' || wf.status === 'music_done'
                      ? t('waiting')
                      : wf.status === 'generating_image' ? t('generatingImage') : t('waiting')}
                  </div>
                )}
              </div>

              <div className="text-2xl font-mono text-[#0a0a0a] hidden md:block">→</div>

              <div className="bg-gradient-to-br from-[#1a0f2a] to-[#0a0515] border border-[#e5e5e5] rounded-2xl aspect-video overflow-hidden flex items-center justify-center relative">
                {wf.videoUrl ? (
                  <video src={wf.videoUrl} controls autoPlay className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[13px] text-white/60 font-mono">
                    {wf.status === 'generating_video' ? t('generatingVideo') : wf.status === 'image_done' ? t('startingVideo') : t('waitingImage')}
                  </div>
                )}
              </div>
            </div>

            {wf.error && (
              wf.error === 'API_KEY_REQUIRED' ? (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-[13px] rounded-lg flex items-center justify-between">
                  <span>{locale === 'zh' ? '请先配置 EvoLink API Key' : 'Please configure your EvoLink API Key first'}</span>
                  <Link href="/profile" className="px-4 py-1.5 bg-amber-600 text-white rounded-full text-[12px] font-medium hover:bg-amber-700 transition">
                    {locale === 'zh' ? '去配置 →' : 'Configure →'}
                  </Link>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg">
                  {wf.error}
                </div>
              )
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
                  {t('downloadVideo')}
                </a>
                {wf.imageUrl && (
                  <a
                    href={wf.imageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-white text-[#0a0a0a] border border-[#d4d4d4] rounded-full text-[13px] font-medium hover:border-[#0a0a0a] transition"
                  >
                    {t('downloadImage')}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Related workflows */}
        <div className="py-10 px-10 bg-[#fafafa] border-t border-[#f0f0f0]">
          <h3 className="font-mono text-xl font-normal tracking-tight max-w-[1100px] mx-auto mb-5">{t('related')}</h3>
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((w) => (
              <Link
                key={w.slug}
                href={`/workflows/${w.slug}`}
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
