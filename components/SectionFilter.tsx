'use client'

import { NewsCategory, CATEGORY_LABELS } from '@/lib/types'

interface SectionFilterProps {
  activeCategory: NewsCategory | 'ALL'
  onChange: (cat: NewsCategory | 'ALL') => void
  counts: Partial<Record<NewsCategory | 'ALL', number>>
  lang: 'en' | 'cn'
  urgentCount: number
}

const sections: Array<{ key: NewsCategory | 'ALL'; icon: string }> = [
  { key: 'ALL', icon: '◉' },
  { key: 'APPLICATION_POLICY', icon: '📋' },
  { key: 'ADMISSIONS_STATS', icon: '📊' },
  { key: 'POPULAR_MAJORS', icon: '🎓' },
  { key: 'EXTRACURRICULAR', icon: '⭐' },
  { key: 'AI_TECHNOLOGY', icon: '🤖' },
  { key: 'INTERNATIONAL', icon: '🌏' },
  { key: 'OTHER_MARKETS', icon: '🌍' },
  { key: 'GENERAL', icon: '📰' },
]

const ALL_LABELS = { en: 'All News', cn: '全部新闻' }

export function SectionFilter({ activeCategory, onChange, counts, lang, urgentCount }: SectionFilterProps) {
  return (
    <nav className="space-y-0.5">
      {urgentCount > 0 && (
        <button
          onClick={() => onChange('ALL')}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-sm text-left transition-all mb-2 bg-red-50 border border-red-200 text-red-800 hover:bg-red-100"
        >
          <span className="text-sm">🚨</span>
          <span className="font-mono text-[11px] font-bold tracking-wide uppercase flex-1">
            {lang === 'cn' ? '紧急警报' : 'Urgent Alerts'}
          </span>
          <span className="font-mono text-[10px] bg-red-600 text-white rounded-full px-1.5 py-0.5 font-bold">
            {urgentCount}
          </span>
        </button>
      )}

      {sections.map(({ key, icon }) => {
        const isActive = activeCategory === key
        const label = key === 'ALL'
          ? ALL_LABELS[lang]
          : (CATEGORY_LABELS[key as NewsCategory]?.[lang] || key)
        const count = counts[key] || 0

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-sm text-left transition-all
              ${isActive
                ? 'bg-[var(--ink)] text-[var(--paper)]'
                : 'text-[var(--ink-muted)] hover:bg-[var(--paper-warm)] hover:text-[var(--ink)]'
              }
            `}
          >
            <span className="text-sm opacity-70">{icon}</span>
            <span className={`font-mono text-[11px] tracking-wide flex-1 ${key === 'ALL' ? 'font-semibold' : ''}`}>
              {label}
            </span>
            {count > 0 && (
              <span className={`font-mono text-[10px] rounded-full px-1.5 py-0.5 ${
                isActive ? 'bg-white/20 text-white' : 'bg-[var(--paper-warm)] text-[var(--ink-muted)]'
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
