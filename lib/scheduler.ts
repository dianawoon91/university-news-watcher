// scheduler.ts — node-cron jobs for daily scrape and weekly digest
// Run this in a separate process: `node scripts/scheduler.js`
// For Vercel deployment: replace with Vercel Cron Jobs

import cron from 'node-cron'
import { scrapeAllSources } from './scraper'
import { processArticles } from './classifier'
import { appendArticles, readConfig, getWeeklyArticles } from './store'
import { sendWeeklyDigest, sendUrgentAlert } from './emailer'

export function startScheduler() {
  // ── Daily Scrape: Every day at 8am CST (UTC+8 = midnight UTC) ─────────────
  cron.schedule('0 0 * * *', async () => {
    console.log('\n⏰ Daily scrape triggered by cron\n')
    await runDailyScrape()
  }, { timezone: 'UTC' })

  // ── Weekly Digest: Every Monday at 8am CST (Sunday midnight UTC) ──────────
  cron.schedule('0 0 * * 1', async () => {
    console.log('\n📧 Weekly digest triggered by cron\n')
    const config = await readConfig()
    const articles = await getWeeklyArticles()
    try {
      await sendWeeklyDigest(articles, config)
    } catch (err) {
      console.error('Failed to send weekly digest:', err)
    }
  }, { timezone: 'UTC' })

  console.log('✅ Scheduler started')
  console.log('   Daily scrape: 8am CST (midnight UTC)')
  console.log('   Weekly digest: Monday 8am CST')
}

export async function runDailyScrape(): Promise<{
  articlesAdded: number
  articlesSkipped: number
  urgentCount: number
  errors: string[]
}> {
  const config = await readConfig()

  try {
    // 1. Scrape
    const { articles: rawArticles, errors } = await scrapeAllSources()

    if (rawArticles.length === 0) {
      console.log('No articles found.')
      return { articlesAdded: 0, articlesSkipped: 0, urgentCount: 0, errors }
    }

    // 2. Classify with Claude
    console.log(`\n🤖 Classifying ${rawArticles.length} articles with Claude...\n`)
    const processedArticles = await processArticles(rawArticles)

    // 3. Store (deduplicating)
    const { added, skipped } = await appendArticles(processedArticles)
    console.log(`\n💾 Stored: ${added} new articles (${skipped} duplicates skipped)`)

    // 4. Send urgent alerts
    const urgentArticles = processedArticles.filter((a) => a.urgency === 'URGENT')
    let urgentCount = 0

    if (config.urgentAlertsEnabled && config.recipients.length > 0) {
      for (const article of urgentArticles) {
        try {
          await sendUrgentAlert(article, config)
          urgentCount++
        } catch (err) {
          console.error(`Failed to send urgent alert for "${article.title}":`, err)
        }
      }
    }

    return { articlesAdded: added, articlesSkipped: skipped, urgentCount, errors }
  } catch (err) {
    console.error('Scrape failed:', err)
    throw err
  }
}
