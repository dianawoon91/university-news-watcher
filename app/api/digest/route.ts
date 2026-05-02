import { NextRequest, NextResponse } from 'next/server'
import { readArticles, getTodaysArticles, getWeeklyArticles } from '@/lib/store'
import { NewsArticle, NewsCategory } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') || 'daily'
  const category = searchParams.get('category') as NewsCategory | null
  const urgency = searchParams.get('urgency')

  let articles: NewsArticle[] =
    view === 'weekly' ? getWeeklyArticles() : getTodaysArticles()

  // Fallback: if no articles today, return last 50 from all time
  if (articles.length === 0 && view === 'daily') {
    articles = readArticles().slice(0, 50)
  }

  // Filter
  if (category) {
    articles = articles.filter((a) => a.category === category)
  }
  if (urgency === 'URGENT') {
    articles = articles.filter((a) => a.urgency === 'URGENT')
  }

  // Sort: urgent first, then by date
  articles.sort((a, b) => {
    if (a.urgency === 'URGENT' && b.urgency !== 'URGENT') return -1
    if (b.urgency === 'URGENT' && a.urgency !== 'URGENT') return 1
    return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime()
  })

  // Stats
  const stats = {
    total: articles.length,
    urgent: articles.filter((a) => a.urgency === 'URGENT').length,
    byCategory: articles.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    universities: [...new Set(articles.map((a) => a.universityShortName))],
  }

  return NextResponse.json({ articles, stats, view })
}
