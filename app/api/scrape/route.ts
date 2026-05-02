import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllSources } from '@/lib/scraper'
import { appendArticles } from '@/lib/store'
import { NewsArticle } from '@/lib/types'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { articles: rawArticles, errors, sourcesChecked } = await scrapeAllSources()

    if (rawArticles.length === 0) {
      return NextResponse.json({ success: true, message: 'No articles found', stats: { articlesFound: 0, articlesAdded: 0, articlesSkipped: 0, urgentCount: 0, sourcesChecked, errors } })
    }

    // Save directly without Claude classification
    const articles: NewsArticle[] = rawArticles.slice(0, 20).map((raw, i) => ({
      id: Buffer.from(raw.url).toString('base64').slice(0, 16),
      universityName: raw.universityName,
      universityShortName: raw.universityShortName,
      title: raw.title,
      url: raw.url,
      source: raw.source,
      publishedAt: raw.publishedAt,
      scrapedAt: new Date().toISOString(),
      summaryEn: raw.content || 'Click the title to read the full article.',
      summaryCn: '点击标题阅读全文。',
      category: 'GENERAL' as const,
      urgency: 'NORMAL' as const,
    }))

    const { added, skipped } = appendArticles(articles)

    return NextResponse.json({
      success: true,
      message: `Scrape complete`,
      stats: { articlesFound: rawArticles.length, articlesAdded: added, articlesSkipped: skipped, urgentCount: 0, sourcesChecked, errors },
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST to /api/scrape to trigger a scrape' })
}