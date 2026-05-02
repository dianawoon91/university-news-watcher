import Anthropic from '@anthropic-ai/sdk'
import { NewsArticle, NewsCategory, UrgencyLevel } from './types'
import { universities } from '../data/universities'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface RawArticle {
  title: string
  url: string
  source: string
  universityName: string
  universityShortName: string
  publishedAt: string
  content?: string
}

interface ClassificationResult {
  summaryEn: string
  summaryCn: string
  category: NewsCategory
  urgency: UrgencyLevel
  urgencyReason?: string
}

const SYSTEM_PROMPT = `You are an expert analyst for a Chinese study-abroad consulting company that helps Chinese students apply to top US universities. Your job is to analyze university admissions news articles and provide structured analysis.

You must respond ONLY with valid JSON matching the exact schema provided. Use Simplified Chinese (简体中文) for all Chinese text, never Traditional Chinese.

URGENCY RULES — flag as URGENT only if the article describes:
1. A Top 50 university changing EA, ED, or RD application deadline
2. A school adding, removing, or modifying test-optional or test-required policy
3. A significant change in acceptance rate (more than 2 percentage points year-over-year)
4. A new or changed policy on AI use in applications
5. A major political or legal change affecting college admissions (affirmative action, visa policy for international students)
6. A school pausing or changing its Common App participation
Everything else is NORMAL.

CATEGORY RULES — assign exactly one:
- APPLICATION_POLICY: EA/ED/RD deadlines, test policies, application requirements
- ADMISSIONS_STATS: Acceptance rates, class profiles, yield rates
- POPULAR_MAJORS: Trending programs, new degrees, department news
- EXTRACURRICULAR: Activities universities favor (research, leadership, community service)
- AI_TECHNOLOGY: How AI affects the application process
- INTERNATIONAL: Visa policy, international admissions changes
- OTHER_MARKETS: UK, Canada, Australia admissions news
- GENERAL: Anything else`

export async function classifyArticle(raw: RawArticle): Promise<ClassificationResult> {
  const prompt = `Analyze this university news article and return JSON only.

Article Details:
- University: ${raw.universityName}
- Source: ${raw.source}
- Title: ${raw.title}
- URL: ${raw.url}
- Published: ${raw.publishedAt}
- Content snippet: ${raw.content?.slice(0, 800) || 'Not available'}

Return this exact JSON structure (no markdown, no extra text):
{
  "summaryEn": "2-3 sentence English summary of the article, focused on what's relevant for Chinese students applying to US universities",
  "summaryCn": "2-3句简体中文摘要，聚焦于对申请美国大学的中国学生的重要性",
  "category": "one of: APPLICATION_POLICY | ADMISSIONS_STATS | POPULAR_MAJORS | EXTRACURRICULAR | AI_TECHNOLOGY | INTERNATIONAL | OTHER_MARKETS | GENERAL",
  "urgency": "URGENT or NORMAL",
  "urgencyReason": "If URGENT: one sentence explaining why in English. If NORMAL: null"
}`

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip any accidental markdown fences
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const result = JSON.parse(cleaned) as ClassificationResult

  // Validate category
  const validCategories: NewsCategory[] = [
    'APPLICATION_POLICY', 'ADMISSIONS_STATS', 'POPULAR_MAJORS',
    'EXTRACURRICULAR', 'AI_TECHNOLOGY', 'INTERNATIONAL', 'OTHER_MARKETS', 'GENERAL'
  ]
  if (!validCategories.includes(result.category)) {
    result.category = 'GENERAL'
  }

  return result
}

export async function processArticles(rawArticles: RawArticle[]): Promise<NewsArticle[]> {
  const processed: NewsArticle[] = []

  for (const raw of rawArticles) {
    try {
      console.log(`  🤖 Classifying: "${raw.title.slice(0, 60)}..."`)
      const classification = await classifyArticle(raw)

      const article: NewsArticle = {
        id: Buffer.from(raw.url).toString('base64').slice(0, 16),
        universityName: raw.universityName,
        universityShortName: raw.universityShortName,
        title: raw.title,
        url: raw.url,
        source: raw.source,
        publishedAt: raw.publishedAt,
        scrapedAt: new Date().toISOString(),
        summaryEn: classification.summaryEn,
        summaryCn: classification.summaryCn,
        category: classification.category,
        urgency: classification.urgency,
        urgencyReason: classification.urgencyReason,
      }

      processed.push(article)

      // Rate limit: 1 second between Claude calls
      await sleep(1000)
    } catch (err) {
      console.error(`  ❌ Failed to classify "${raw.title}":`, err)
    }
  }

  return processed
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
