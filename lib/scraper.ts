import { universities } from '../data/universities'

interface RawArticle {
  title: string
  url: string
  source: string
  universityName: string
  universityShortName: string
  publishedAt: string
  content?: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function searchSerper(universityName: string, universityShortName: string): Promise<RawArticle[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    console.log('  No Serper key found')
    return []
  }

  const queries = [
    `${universityName} admissions 2025`,
  ]

  const articles: RawArticle[] = []

  for (const query of queries) {
    try {
      console.log(`  Serper: "${query}"`)
      const response = await fetch('https://google.serper.dev/news', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 2 }),
      })

      if (!response.ok) {
        console.log(`  Serper error: ${response.status}`)
        continue
      }

      const data = await response.json()
      const news = data.news || []
      console.log(`  -> ${news.length} results`)

      for (const item of news) {
        if (!item.title || !item.link) continue
        articles.push({
          title: item.title,
          url: item.link,
          source: item.source || 'News',
          universityName,
          universityShortName,
          publishedAt: item.date || new Date().toISOString(),
          content: item.snippet || '',
        })
      }

      await sleep(300)
    } catch (err) {
      console.warn(`  Serper failed for "${query}": ${err}`)
    }
  }

  return articles
}

export interface ScrapeResult {
  articles: RawArticle[]
  errors: string[]
  sourcesChecked: number
}

export async function scrapeAllSources(): Promise<ScrapeResult> {
  const allArticles: RawArticle[] = []
  const errors: string[] = []
  let sourcesChecked = 0

  console.log(`\nStarting Serper search for ${universities.length} universities...\n`)

  for (const uni of universities) {
    console.log(`\n${uni.name}`)
    const articles = await searchSerper(uni.name, uni.shortName)
    allArticles.push(...articles)
    sourcesChecked++
    console.log(`  Total: ${articles.length} articles`)
    await sleep(500)
  }

  const seen = new Set<string>()
  const deduped = allArticles.filter((a) => {
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  console.log(`\nScrape complete: ${deduped.length} unique articles`)
  return { articles: deduped, errors, sourcesChecked }
}