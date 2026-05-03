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
              publishedAt: r.scraped_at,
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
              const res = await supabase('articles?select=*&order=scraped_at.desc&limit=1000')
              if (!res.ok) return []
                      const rows = await res.json()
              return rows.map(mapRow)
      } catch { return [] }
}

export async function appendArticles(articles: NewsArticle[]): Promise<void> {
      if (!articles.length) return
      try {
              await supabase('articles', {
                        method: 'POST',
                        headers: { 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
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
      } catch (e) {
              console.error('appendArticles error:', e)
      }
}

export async function getTodaysArticles(): Promise<NewsArticle[]> {
      try {
              const startOfDay = new Date()
              startOfDay.setUTCHours(0, 0, 0, 0)
              const iso = startOfDay.toISOString()
              const res = await supabase(
                        `articles?select=*&scraped_at=gte.${iso}&order=scraped_at.desc&limit=500`
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
              sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
              const iso = sevenDaysAgo.toISOString()
              const res = await supabase(
                        `articles?select=*&scraped_at=gte.${iso}&order=scraped_at.desc&limit=1000`
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
