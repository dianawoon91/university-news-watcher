'use client'

import { useState, useEffect, useCallback } from 'react'
import { NewsCard } from '@/components/NewsCard'
import { SectionFilter } from '@/components/SectionFilter'
import { NewsArticle, NewsCategory, CATEGORY_LABELS } from '@/lib/types'

type ViewMode = 'daily' | 'weekly'
type Language = 'en' | 'cn'

interface DigestResponse {
  articles: NewsArticle[]
  stats: {
    total: number
    urgent: number
    byCategory: Record<string, number>
    universities: string[]
  }
  view: string
}

const UI_TEXT = {
  en: {
    title: 'University News Watcher',
    subtitle: 'Daily admissions intelligence',
    daily: 'Today',
    weekly: '7-Day Digest',
    runScraper: 'Run Scraper',
    running: 'Scraping...',
    settings: 'Settings',
    noArticles: "No articles yet. Click 'Run Scraper' to fetch today's news.",
    noArticlesFilter: 'No articles in this category.',
    loading: 'Loading news...',
    urgent: 'Urgent',
    articles: 'articles',
    universities: 'universities',
    lastUpdated: 'Last updated',
    scrapeSuccess: 'Scrape complete!',
    scrapeFailed: 'Scrape failed',
    filterAll: 'All News',
  },
  cn: {
    title: '大学新闻监测',
    subtitle: '每日招生资讯',
    daily: '今日',
    weekly: '7日摘要',
    runScraper: '运行爬虫',
    running: '抓取中...',
    settings: '设置',
    noArticles: '暂无文章，点击 运行爬虫 获取今日新闻。',
    noArticlesFilter: '该分类暂无文章。',
    loading: '加载中...',
    urgent: '紧急',
    articles: '篇文章',
    universities: '所大学',
    lastUpdated: '最后更新',
    scrapeSuccess: '抓取完成！',
    scrapeFailed: '抓取失败',
    filterAll: '全部新闻',
  },
}

export default function Dashboard() {
  const [lang, setLang] = useState<Language>('en')
  const [view, setView] = useState<ViewMode>('daily')
  const [activeCategory, setActiveCategory] = useState<NewsCategory | 'ALL'>('ALL')
  const [data, setData] = useState<DigestResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [scrapeMessage, setScrapeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const t = UI_TEXT[lang]

  // Persist language
  useEffect(() => {
    const saved = localStorage.getItem('news-watcher-lang') as Language
    if (saved) setLang(saved)
  }, [])

  const toggleLang = () => {
    const next = lang === 'en' ? 'cn' : 'en'
    setLang(next)
    localStorage.setItem('news-watcher-lang', next)
  }

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ view })
      const res = await fetch(`/api/digest?${params}`)
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch articles:', err)
    } finally {
      setLoading(false)
    }
  }, [view])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const runScraper = async () => {
    setScraping(true)
    setScrapeMessage(null)
    try {
      const res = await fetch('/api/scrape', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setScrapeMessage({
          type: 'success',
          text: `${t.scrapeSuccess} +${json.stats.articlesAdded} new articles${json.stats.urgentCount > 0 ? ` (${json.stats.urgentCount} urgent)` : ''}`,
        })
        await fetchArticles()
      } else {
        setScrapeMessage({ type: 'error', text: json.error || t.scrapeFailed })
      }
    } catch (err) {
      setScrapeMessage({ type: 'error', text: t.scrapeFailed })
    } finally {
      setScraping(false)
      setTimeout(() => setScrapeMessage(null), 8000)
    }
  }

  // Filter articles
  const displayArticles = data?.articles.filter((a) => {
    if (activeCategory === 'ALL') return true
    return a.category === activeCategory
  }) || []

  // Count per category
  const allArticles = data?.articles || []
  const counts: Partial<Record<NewsCategory | 'ALL', number>> = {
    ALL: allArticles.length,
    ...Object.fromEntries(
      Object.keys(CATEGORY_LABELS).map((cat) => [
        cat,
        allArticles.filter((a) => a.category === cat).length,
      ])
    ),
  }

  const urgentCount = allArticles.filter((a) => a.urgency === 'URGENT').length

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      {/* ── Top Nav ── */}
      <header className="bg-[var(--ink)] text-[var(--paper)] sticky top-0 z-50 shadow-lg">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-7 h-7 bg-[var(--accent-red)] rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold font-mono">U</span>
            </div>
            <div>
              <h1 className="font-display text-[15px] font-semibold leading-none tracking-tight">
                {t.title}
              </h1>
              <p className="font-mono text-[9px] tracking-widest uppercase opacity-50 leading-none mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="hidden sm:flex bg-white/10 rounded-sm p-0.5">
              {(['daily', 'weekly'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`font-mono text-[11px] tracking-wide uppercase px-3 py-1.5 rounded-sm transition-all ${
                    view === v ? 'bg-white text-[var(--ink)] font-semibold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {v === 'daily' ? t.daily : t.weekly}
                </button>
              ))}
            </div>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="font-mono text-[11px] font-semibold tracking-wider uppercase border border-white/20 hover:border-white/50 text-white/80 hover:text-white px-3 py-1.5 rounded-sm transition-all"
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>

            {/* Scraper button */}
            <button
              onClick={runScraper}
              disabled={scraping}
              className={`font-mono text-[11px] font-bold tracking-wide uppercase px-4 py-1.5 rounded-sm transition-all ${
                scraping
                  ? 'bg-white/20 text-white/50 cursor-not-allowed'
                  : 'bg-[var(--accent-red)] hover:bg-red-700 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {scraping ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="inline-block w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="inline-block w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : t.runScraper}
            </button>

            {/* Settings */}
            <a
              href="/settings"
              className="font-mono text-[11px] tracking-wide uppercase text-white/60 hover:text-white px-2 py-1.5 transition-colors"
            >
              ⚙
            </a>
          </div>
        </div>

        {/* Scrape status bar */}
        {scrapeMessage && (
          <div className={`text-center font-mono text-[11px] py-1.5 animate-fade-in ${
            scrapeMessage.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-900 text-red-200'
          }`}>
            {scrapeMessage.type === 'success' ? '✓' : '✗'} {scrapeMessage.text}
          </div>
        )}
      </header>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-[var(--border)] bg-white/40 p-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {/* Stats */}
          {data && !loading && (
            <div className="mb-5 p-3 bg-[var(--paper)] rounded-sm border border-[var(--border)]">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] mb-2">
                {view === 'daily' ? t.daily : t.weekly}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="font-mono text-[11px] text-[var(--ink-muted)]">{t.articles}</span>
                  <span className="font-mono text-[13px] font-semibold">{data.stats.total}</span>
                </div>
                {urgentCount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-mono text-[11px] text-red-600">{t.urgent}</span>
                    <span className="font-mono text-[13px] font-bold text-red-600">{urgentCount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-mono text-[11px] text-[var(--ink-muted)]">{t.universities}</span>
                  <span className="font-mono text-[13px] font-semibold">{data.stats.universities.length}</span>
                </div>
              </div>
              {lastUpdated && (
                <div className="font-mono text-[9px] text-[var(--ink-muted)] mt-2 pt-2 border-t border-[var(--border)]">
                  {t.lastUpdated}: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          <SectionFilter
            activeCategory={activeCategory}
            onChange={setActiveCategory}
            counts={counts}
            lang={lang}
            urgentCount={urgentCount}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {/* Mobile view toggle */}
          <div className="flex sm:hidden bg-white border border-[var(--border)] rounded-sm p-0.5 mb-4">
            {(['daily', 'weekly'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 font-mono text-[11px] tracking-wide uppercase py-1.5 rounded-sm transition-all ${
                  view === v ? 'bg-[var(--ink)] text-white font-semibold' : 'text-[var(--ink-muted)]'
                }`}
              >
                {v === 'daily' ? t.daily : t.weekly}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 bg-[var(--ink-muted)] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <p className="font-mono text-[12px] text-[var(--ink-muted)] tracking-wider">{t.loading}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && displayArticles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="text-5xl opacity-20">📰</div>
              <p className="font-mono text-[13px] text-[var(--ink-muted)] max-w-xs leading-relaxed">
                {activeCategory === 'ALL' ? t.noArticles : t.noArticlesFilter}
              </p>
              {activeCategory === 'ALL' && (
                <button
                  onClick={runScraper}
                  disabled={scraping}
                  className="font-mono text-[11px] font-bold tracking-wide uppercase bg-[var(--ink)] text-white px-6 py-2 rounded-sm hover:bg-[var(--ink-soft)] transition-colors"
                >
                  {scraping ? t.running : t.runScraper}
                </button>
              )}
            </div>
          )}

          {/* Articles grid */}
          {!loading && displayArticles.length > 0 && (
            <>
              {/* Urgent section first */}
              {activeCategory === 'ALL' && urgentCount > 0 && (
                <div className="mb-8">
                  <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-[var(--accent-red)] mb-3 flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-[var(--accent-red)]" />
                    🚨 {lang === 'cn' ? '紧急警报' : 'Urgent Alerts'}
                    <span className="w-4 h-0.5 bg-[var(--accent-red)]" />
                  </h2>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {displayArticles
                      .filter((a) => a.urgency === 'URGENT')
                      .map((article, i) => (
                        <NewsCard key={article.id} article={article} defaultLang={lang} index={i} />
                      ))}
                  </div>
                </div>
              )}

              {/* Regular articles */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {displayArticles
                  .filter((a) => activeCategory !== 'ALL' || a.urgency !== 'URGENT')
                  .map((article, i) => (
                    <NewsCard key={article.id} article={article} defaultLang={lang} index={i} />
                  ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
