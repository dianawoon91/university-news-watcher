'use client'

import { useState } from 'react'
import { NewsArticle, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types'

interface NewsCardProps {
  article: NewsArticle
  defaultLang: 'en' | 'cn'
  index?: number
}

export function NewsCard({ article, defaultLang, index = 0 }: NewsCardProps) {
  const [lang, setLang] = useState<'en' | 'cn'>(defaultLang)
  const isUrgent = article.urgency === 'URGENT'

  const summary = lang === 'cn' ? article.summaryCn : article.summaryEn
  const categoryLabel = CATEGORY_LABELS[article.category]?.[lang] || article.category
  const categoryColor = CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-800'

  const date = new Date(article.scrapedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article
      className={`
        relative bg-white border rounded-sm overflow-hidden transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        animate-slide-in
        ${isUrgent ? 'border-red-300 shadow-sm' : 'border-[var(--border)]'}
      `}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Urgent stripe */}
      {isUrgent && (
        <div className="h-1 bg-[var(--accent-red)] animate-pulse-urgent" />
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* University badge */}
            <span className="font-mono text-[10px] font-semibold tracking-widest uppercase text-[var(--ink-muted)] bg-[var(--paper)] px-2 py-0.5 rounded-sm border border-[var(--border)]">
              {article.universityShortName}
            </span>

            {/* URGENT badge */}
            {isUrgent && (
              <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-white bg-[var(--accent-red)] px-2 py-0.5 rounded-sm">
                🚨 URGENT
              </span>
            )}

            {/* Category badge */}
            <span className={`font-mono text-[10px] tracking-wide px-2 py-0.5 rounded-sm border ${categoryColor}`}>
              {categoryLabel}
            </span>
          </div>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'cn' : 'en')}
            className="flex-shrink-0 font-mono text-[10px] font-semibold tracking-wider uppercase text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--border)] hover:border-[var(--ink-muted)] px-2 py-0.5 rounded-sm transition-colors"
            title="Toggle language"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
        </div>

        {/* Title */}
        <h3 className="font-display text-[17px] leading-snug font-medium mb-2">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--accent-blue)] transition-colors"
          >
            {article.title}
          </a>
        </h3>

        {/* Summary */}
        <p className={`text-[14px] leading-relaxed text-[var(--ink-muted)] mb-3 ${lang === 'cn' ? 'font-normal' : ''}`}>
          {summary}
        </p>

        {/* Urgent reason */}
        {isUrgent && article.urgencyReason && (
          <div className="bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-3">
            <p className="font-mono text-[11px] text-red-700">
              <span className="font-bold uppercase tracking-wide">Why urgent: </span>
              {article.urgencyReason}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--paper-warm)]">
          <div className="font-mono text-[11px] text-[var(--ink-muted)]">
            {article.source}
          </div>
          <div className="font-mono text-[11px] text-[var(--ink-muted)]">
            {date}
          </div>
        </div>
      </div>
    </article>
  )
}
