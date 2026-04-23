'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Link } from '@/i18n/navigation'
import { WORKFLOWS, WORKFLOW_CATEGORIES, localizeWorkflow, type WorkflowDefinition } from './workflow-data'
import { useLocale } from 'next-intl'

const CATEGORY_COUNTS: Record<string, number> = {}
for (const w of WORKFLOWS) {
  CATEGORY_COUNTS[w.category] = (CATEGORY_COUNTS[w.category] || 0) + 1
}

function WorkflowCard({ workflow, runLabel }: { workflow: WorkflowDefinition; runLabel: string }) {
  return (
    <Link
      href={`/workflows/${workflow.slug}`}
      className="group relative block bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden transition-all hover:border-[#0a0a0a] hover:-translate-y-0.5"
    >
      {workflow.trending && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-medium rounded-full">
          Trending
        </div>
      )}
      <div className="relative aspect-video bg-gradient-to-br from-[#1a0f2a] to-[#0a0515] flex items-center justify-center border-b border-[#eee] overflow-hidden">
        {workflow.previewVideoUrl ? (
          <video
            src={workflow.previewVideoUrl}
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
            onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent ml-1" />
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 text-[11px] font-mono text-[#888] rounded-full border border-white/20">
          case {String(workflow.caseNumber).padStart(2, '0')}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-[15px] font-medium text-[#0a0a0a] mb-1.5">{workflow.title}</h3>
        <p className="text-[13px] text-[#666] leading-relaxed mb-4">{workflow.subtitle}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#999]">{workflow.creator}</span>
          <span className="text-[12px] font-medium text-[#0a0a0a] opacity-0 group-hover:opacity-100 transition-opacity">
            {runLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function WorkflowsPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const t = useTranslations('workflows')
  const locale = useLocale()

  const allLocalized = WORKFLOWS.map((w) => localizeWorkflow(w, locale))
  const filtered = activeCategory === 'all'
    ? allLocalized
    : allLocalized.filter((w) => w.category === activeCategory)

  const grouped = new Map<string, WorkflowDefinition[]>()
  for (const w of filtered) {
    const list = grouped.get(w.category) || []
    list.push(w)
    grouped.set(w.category, list)
  }

  const sectionLabels: Record<string, string> = {
    storyboard: t('sections.storyboard'),
    character: t('sections.character'),
    product: t('sections.product'),
    creative: t('sections.creative'),
  }

  return (
    <div className="min-h-screen bg-white">
      <div>
        <Navbar />

        {/* Hero */}
        <div className="py-20 px-10 text-center max-w-[900px] mx-auto">
          <h1 className="font-mono text-5xl font-normal tracking-tight leading-tight mb-7">
            {t('hero.title1')}<br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              {t('hero.title2')}
            </span>
          </h1>
          <p className="font-mono text-[17px] text-[#555] leading-relaxed max-w-[640px] mx-auto mb-9">
            {t('hero.subtitle')}
          </p>
          <div className="flex gap-3 justify-center">
            <a href="#workflows" className="px-7 py-3.5 bg-[#0a0a0a] text-white rounded-full text-[15px] font-medium hover:bg-[#333] transition">
              {t('hero.browse')}
            </a>
            <a
              href="https://github.com/EvoLinkAI/GPT-Image-2-Seedance2-Workflow"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-white text-[#0a0a0a] border border-[#d4d4d4] rounded-full text-[15px] font-medium hover:border-[#0a0a0a] transition"
            >
              {t('hero.github')}
            </a>
          </div>
          <div className="text-[13px] text-[#888] mt-3.5">{t('hero.meta', { count: WORKFLOWS.length })}</div>
        </div>

        {/* Tag bar */}
        <div id="workflows" className="py-6 px-10 flex gap-2 flex-wrap justify-center border-y border-[#f0f0f0] max-w-[1180px] mx-auto">
          {WORKFLOW_CATEGORIES.map((cat) => {
            const count = cat.key === 'all' ? WORKFLOWS.length : (CATEGORY_COUNTS[cat.key] || 0)
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-1.5 rounded-full text-[13px] border transition ${
                  activeCategory === cat.key
                    ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                    : 'bg-white text-[#555] border-[#e5e5e5] hover:border-[#0a0a0a]'
                }`}
              >
                {t(`categories.${cat.key}`)} · {count}
              </button>
            )
          })}
        </div>

        {/* Workflow sections */}
        {Array.from(grouped.entries()).map(([category, workflows], groupIdx) => (
          <div key={category} className="py-9 px-10 max-w-[1180px] mx-auto">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-mono text-[13px] text-[#999]">{String(groupIdx + 1).padStart(2, '0')}</span>
              <h2 className="font-mono text-[22px] font-normal tracking-tight">{sectionLabels[category] || category}</h2>
              <div className="flex-1 h-px bg-[#f0f0f0]" />
            </div>
            <div className={`grid gap-5 ${workflows.length >= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {workflows.map((w) => (
                <WorkflowCard key={w.slug} workflow={w} runLabel={t('card.run')} />
              ))}
            </div>
          </div>
        ))}

        {/* Submit CTA */}
        <div className="py-10 px-10 bg-gradient-to-br from-[#fafafa] to-[#f5f5f5] border-t border-[#f0f0f0]">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-6">
            <div>
              <h3 className="font-mono text-[22px] font-normal tracking-tight mb-2">{t('submit.title')}</h3>
              <p className="text-[14px] text-[#555]">{t('submit.subtitle')}</p>
            </div>
            <a
              href="https://github.com/EvoLinkAI/GPT-Image-2-Seedance2-Workflow/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 bg-[#0a0a0a] text-white rounded-full text-[15px] font-medium hover:bg-[#333] transition"
            >
              {t('submit.cta')}
            </a>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
