import { NewsArticle, AppConfig } from './types'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!

export const DEFAULT_CONFIG: AppConfig = {
            smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
            smtpPort: Number(process.env.SMTP_PORT) || 587,
            smtpUser: process.env.SMTP_USER || '',
            smtpPass: process.env.SMTP_PASS || '',
            recipients: process.env.DEFAULT_RECIPIENT ? [process.env.DEFAULT_RECIPIENT] : [],
            weeklyDigestEnabled: true,
            urgentAlertsEnabled: true,
            defaultLanguage: 'en',
}

export async function readConfig(): Promise<AppConfig> {
            return DEFAULT_CONFIG
}

export async function writeConfig(config: Partial<AppConfig>): Promise<void> {
            // Config is environment-based; writes are no-ops in this version
}

async function supabase(path: string, options?: RequestInit) {
            return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
                          ...options,
                          headers: {
                                          'apikey': SUPABASE_KEY,
                                          'Authorization': `Bearer ${SUPABASE_KEY}`,
                                          'Content-Type': 'application/json',
                                          'Prefer': 'return=representation',
                                          ...options?.headers,
                          },
            })
}

function mapRow(r: any): NewsArticle {
            return {
                          id: r.id,
                          universityName: r.university_name,
                          universityShortName: r.university_short_name,
                          title: r.title,
                          url: r.url,
                          source: r.source,
                          publishedAt: r.published_at,
                          scrapedAt: r.scraped_at,
                          summaryEn: r.summary_en,
                          summaryCn: r.summary_cn,
                          category: r.category,
                          urgency: r.urgency,
                          urgencyReason: r.urgency_reason,
            }
}

export async function readArticles(): Promise<NewsArticle[]> {
            try {
                          const res = await supabase('articles?select=*&order=published_at.desc&limit=1000')
                          if (!res.ok) return []
                                        const rows = await res.json()
                          return rows.map(mapRow)
            } catch { return [] }
}

export async function appendArticles(articles: NewsArticle[]): Promise<{ added: number; skipped: number }> {
            if (!articles.length) return { added: 0, skipped: 0 }
            try {
                          const res = await supabase('articles', {
                                          method: 'POST',
                                          headers: { 'Prefer': 'resolution=ignore-duplicates,return=representation' },
                                          body: JSON.stringify(articles.map(a => ({
                                                            id: a.id,
                                                            university_name: a.universityName,
                                                            university_short_name: a.universityShortName,
                                                            title: a.title,
                                                            url: a.url,
                                                            source: a.source,
                                                            published_at: a.publishedAt,
                                                            scraped_at: a.scrapedAt,
                                                            summary_en: a.summaryEn,
                                                            summary_cn: a.summaryCn,
                                                            category: a.category,
                                                            urgency: a.urgency,
                                                            urgency_reason: a.urgencyReason,
                                          }))),
                          })
                          if (!res.ok) return { added: 0, skipped: articles.length }
                          const inserted = await res.json()
                          const added = Array.isArray(inserted) ? inserted.length : 0
                          return { added, skipped: articles.length - added }
            } catch (e) {
                          console.error('appendArticles error:', e)
                          return { added: 0, skipped: articles.length }
            }
}

export async function deleteOldArticles(daysToKeep: number): Promise<void> {
            try {
                          const cutoff = new Date()
                          cutoff.setDate(cutoff.getDate() - daysToKeep)
                          const iso = cutoff.toISOString()
                          await supabase(`articles?published_at=lt.${iso}`, {
                                          method: 'DELETE',
                                          headers: { 'Prefer': 'return=minimal' },
                          })
            } catch (e) {
                          console.error('deleteOldArticles error:', e)
            }
}

export async function getTodaysArticles(): Promise<NewsArticle[]> {
            try {
                          // Use China time (UTC+8): today starts at UTC midnight - 8h = previous day 16:00 UTC
              const now = new Date()
                          const chinaOffset = 8 * 60 * 60 * 1000
                          const chinaTime = new Date(now.getTime() + chinaOffset)
                          const startOfChinaDay = new Date(chinaTime)
                          startOfChinaDay.setUTCHours(0, 0, 0, 0)
                          const startUTC = new Date(startOfChinaDay.getTime() - chinaOffset)
                          const iso = startUTC.toISOString()
                          const res = await supabase(
                                          `articles?select=*&published_at=gte.${iso}&order=published_at.desc&limit=500`
                                        )
                          if (!res.ok) {
                                          console.error('getTodaysArticles error:', await res.text())
                                          return []
                          }
                          const rows = await res.json()
                          return rows.map(mapRow)
            } catch (e) {
                          console.error('getTodaysArticles exception:', e)
                          return []
            }
}

export async function getWeeklyArticles(): Promise<NewsArticle[]> {
            try {
                          const sevenDaysAgo = new Date()
                          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                          const iso = sevenDaysAgo.toISOString()
                          const res = await supabase(
                                          `articles?select=*&published_at=gte.${iso}&order=published_at.desc&limit=1000`
                                        )
                          if (!res.ok) {
                                          console.error('getWeeklyArticles error:', await res.text())
                                          return []
                          }
                          const rows = await res.json()
                          return rows.map(mapRow)
            } catch (e) {
                          console.error('getWeeklyArticles exception:', e)
                          return []
            }
}
