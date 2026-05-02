import { universities, globalSources } from '../data/universities'

// Use dynamic imports for Node-only packages
let Parser: any
let cheerio: any

async function getRSSParser() {
  if (!Parser) {
    const mod = await import('rss-parser')
    Parser = mod.default
  }
  return new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'UniversityNewsWatcher/1.0' },
  })
}

async function getCheerio() {
  if (!cheerio) {
    cheerio = await import('cheerio')
  }
  return cheerio
}

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

function isRecentArticle(dateStr: string | undefined, daysBack = 7): boolean {
  if (!dateStr) return true // include if no date
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return true
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  return date >= cutoff
}

// ── RSS Scraper ───────────────────────────────────────────────────────────────

async function scrapeRSS(
  feedUrl: string,
  universityName: string,
  universityShortName: string,
  sourceName: string
): Promise<RawArticle[]> {
  try {
    const parser = await getRSSParser()
    const feed = await parser.parseURL(feedUrl)
    const articles: RawArticle[] = []

    for (const item of (feed.items || []).slice(0, 10)) {
      if (!item.title || !item.link) continue
      if (!isRecentArticle(item.pubDate || item.isoDate)) continue

      // Filter for admissions-relevant content
      const text = `${item.title} ${item.contentSnippet || ''}`.toLowerCase()
      const keywords = [
        'admiss', 'applic', 'deadline', 'test', 'sat', 'act', 'accept',
        'enroll', 'freshman', 'undergraduate', 'financial aid', 'scholarship',
        'international', 'visa', 'common app', 'early decision', 'early action',
        'regular decision', 'class of', 'yield', 'waitlist', 'defer',
      ]
      const isRelevant = keywords.some((kw) => text.includes(kw))

      // For global sources, only include relevant articles
      // For university sources, include all recent news
      const isGlobal = universityShortName === 'GLOBAL'
      if (isGlobal && !isRelevant) continue

      articles.push({
        title: item.title.trim(),
        url: item.link.trim(),
        source: sourceName,
        universityName,
        universityShortName,
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        content: item.contentSnippet?.slice(0, 500) || item.summary?.slice(0, 500) || '',
      })
    }

    return articles
  } catch (err) {
    console.warn(`  ⚠️  RSS failed for ${feedUrl}: ${err instanceof Error ? err.message : err}`)
    return []
  }
}

// ── Serper API Search ─────────────────────────────────────────────────────────

async function searchSerper(
  universityName: string,
  universityShortName: string
): Promise<RawArticle[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  try {
    const query = `${universityName} admissions 2024 2025`
    const response = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 5, tbs: 'qdr:w' }), // past week
    })

    if (!response.ok) return []
    const data = await response.json()

    return (data.news || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      source: item.source || 'Google News',
      universityName,
      universityShortName,
      publishedAt: item.date || new Date().toISOString(),
      content: item.snippet || '',
    }))
  } catch (err) {
    console.warn(`  ⚠️  Serper search failed for ${universityName}: ${err}`)
    return []
  }
}

// ── Cheerio HTML Fallback ─────────────────────────────────────────────────────

async function scrapeHTMLFallback(
  url: string,
  universityName: string,
  universityShortName: string
): Promise<RawArticle[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UniversityNewsBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return []

    const html = await response.text()
    const $ = (await getCheerio()).load(html)
    const articles: RawArticle[] = []

    // Generic news article link finder
    $('a[href]').each((_: number, el: any) => {
      const href = $(el).attr('href') || ''
      const title = $(el).text().trim()
      if (!title || title.length < 15) return
      if (!href.includes('news') && !href.includes('blog') && !href.includes('admission')) return

      const fullUrl = href.startsWith('http') ? href : `https://${universityName}${href}`

      const text = title.toLowerCase()
      const keywords = ['admiss', 'applic', 'deadline', 'accept', 'enroll', 'class of']
      if (!keywords.some((kw) => text.includes(kw))) return

      articles.push({
        title,
        url: fullUrl,
        source: universityName,
        universityName,
        universityShortName,
        publishedAt: new Date().toISOString(),
        content: '',
      })
    })

    return articles.slice(0, 5)
  } catch (err) {
    console.warn(`  ⚠️  HTML scrape failed for ${url}: ${err}`)
    return []
  }
}

// ── Main Scraper ──────────────────────────────────────────────────────────────

export interface ScrapeResult {
  articles: RawArticle[]
  errors: string[]
  sourcesChecked: number
}

export async function scrapeAllSources(): Promise<ScrapeResult> {
  const allArticles: RawArticle[] = []
  const errors: string[] = []
  let sourcesChecked = 0

  console.log(`\n📡 Starting scrape for ${universities.length} universities...\n`)

  // Scrape each university
  for (const uni of universities) {
    console.log(`\n🏫 ${uni.name}`)

    // 1. Try RSS feeds
    let foundArticles = 0
    for (const feedUrl of uni.rssFeeds) {
      console.log(`  📰 RSS: ${feedUrl}`)
      const articles = await scrapeRSS(feedUrl, uni.name, uni.shortName, `${uni.shortName} News`)
      allArticles.push(...articles)
      foundArticles += articles.length
      sourcesChecked++
      await sleep(1500) // be polite
    }

    // 2. Try Serper if available
    if (process.env.SERPER_API_KEY) {
      console.log(`  🔍 Serper search...`)
      const serperArticles = await searchSerper(uni.name, uni.shortName)
      allArticles.push(...serperArticles)
      foundArticles += serperArticles.length
      sourcesChecked++
      await sleep(1000)
    }

    // 3. HTML fallback if we got nothing
    if (foundArticles === 0) {
      console.log(`  🌐 HTML fallback: ${uni.admissionsUrl}`)
      const htmlArticles = await scrapeHTMLFallback(uni.admissionsUrl, uni.name, uni.shortName)
      allArticles.push(...htmlArticles)
      sourcesChecked++
      await sleep(2000)
    }

    console.log(`  ✅ Found ${foundArticles} articles`)
  }

  // Scrape global sources
  console.log(`\n🌍 Global sources...`)
  for (const source of globalSources) {
    console.log(`  📰 ${source.name}`)
    try {
      const articles = await scrapeRSS(source.rss, 'General', 'GLOBAL', source.name)
      allArticles.push(...articles)
      sourcesChecked++
      await sleep(1500)
    } catch (err) {
      const msg = `Global source ${source.name} failed: ${err}`
      errors.push(msg)
      console.error(`  ❌ ${msg}`)
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  const deduped = allArticles.filter((a) => {
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  console.log(`\n📊 Scrape complete: ${deduped.length} unique articles from ${sourcesChecked} sources`)

  return { articles: deduped, errors, sourcesChecked }
}
