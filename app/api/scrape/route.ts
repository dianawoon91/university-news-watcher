import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllSources } from '@/lib/scraper'
import { appendArticles, deleteOldArticles } from '@/lib/store'
import { NewsArticle } from '@/lib/types'

export const maxDuration = 300

export async function POST(req: NextRequest) {
    try {
          // Delete articles older than 7 days first
      await deleteOldArticles(7)

      const { articles: rawArticles, errors, sourcesChecked } = await scrapeAllSources()

      if (rawArticles.length === 0) {
              return NextResponse.json({ success: true, message: 'No articles found', stats: { articlesFound: 0, articlesAdded: 0, articlesSkipped: 0, urgentCount: 0, sourcesChecked, errors } })
      }

      const now = new Date()
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Only keep articles published within the last 7 days
      const recentRaw = rawArticles.filter(raw => {
              if (!raw.publishedAt) return false
              const pub = new Date(raw.publishedAt)
              return pub >= sevenDaysAgo && pub <= now
      })

      if (recentRaw.length === 0) {
              return NextResponse.json({ success: true, message: 'No recent articles found (all older than 7 days)', stats: { articlesFound: rawArticles.length, articlesAdded: 0, articlesSkipped: rawArticles.length, urgentCount: 0, sourcesChecked, errors } })
      }

      const articles: NewsArticle[] = recentRaw.slice(0, 50).map((raw) => ({
              id: Buffer.from(raw.url).toString('base64').slice(0, 16),
              universityName: raw.universityName,
              universityShortName: raw.universityShortName,
              title: raw.title,
              url: raw.url,
              source: raw.source,
              publishedAt: raw.publishedAt || new Date().toISOString(),
              scrapedAt: new Date().toISOString(),
              summaryEn: raw.title,
              summaryCn: '',
              category: 'General News',
              urgency: 'normal' as const,
              urgencyReason: '',
      }))

      const { added, skipped } = await appendArticles(articles)

      return NextResponse.json({
              success: true,
              message: `Scrape complete! +${added} new articles`,
              stats: { articlesFound: rawArticles.length, articlesAdded: added, articlesSkipped: skipped, urgentCount: 0, sourcesChecked, errors }
      })
    } catch (error) {
          console.error('Scrape error:', error)
          return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}
