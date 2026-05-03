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

  const currentYear = new Date().getFullYear()
    const queries = [
          `${universityName} admissions news ${currentYear}`,
          `${universityShortName} university news today`,
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
                              body: JSON.stringify({ q: query, num: 5, tbs: 'qdr:w' }),
                    })

              if (!response.ok) continue

              const data = await response.json()
                    const news = data.news || []

                            for (const item of news) {
                                      if (!item.title || !item.link) continue
                                      articles.push({
                                                  title: item.title,
                                                  url: item.link,
                                                  source: item.source || universityName,
                                                  universityName,
                                                  universityShortName,
                                                  publishedAt: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
                                      })
                            }
            } catch (e) {
                    console.error(`  Serper error for "${query}":`, e)
            }
            await sleep(500)
      }

  return articles
}

export async function scrapeAllSources(): Promise<{ articles: RawArticle[]; errors: string[]; sourcesChecked: number }> {
    const allArticles: RawArticle[] = []
        const errors: string[] = []
            let sourcesChecked = 0

  for (const uni of universities) {
        try {
                console.log(`Scraping ${uni.shortName}...`)
                const articles = await searchSerper(uni.name, uni.shortName)
                allArticles.push(...articles)
                sourcesChecked++
        } catch (e) {
                const msg = `Error scraping ${uni.shortName}: ${e}`
                console.error(msg)
                errors.push(msg)
        }
        await sleep(1000)
  }

  // Deduplicate by URL
  const seen = new Set<string>()
    const unique = allArticles.filter(a => {
          if (seen.has(a.url)) return false
          seen.add(a.url)
          return true
    })

  return { articles: unique, errors, sourcesChecked }
}
