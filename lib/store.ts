import fs from 'fs'
import path from 'path'
import { NewsArticle, AppConfig } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const NEWS_STORE_PATH = path.join(DATA_DIR, 'news-store.json')
const CONFIG_PATH = path.join(DATA_DIR, 'config.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// ── News Store ──────────────────────────────────────────────────────────────

export function readArticles(): NewsArticle[] {
  ensureDataDir()
  if (!fs.existsSync(NEWS_STORE_PATH)) return []
  try {
    const raw = fs.readFileSync(NEWS_STORE_PATH, 'utf-8')
    return JSON.parse(raw) as NewsArticle[]
  } catch {
    return []
  }
}

export function writeArticles(articles: NewsArticle[]): void {
  ensureDataDir()
  fs.writeFileSync(NEWS_STORE_PATH, JSON.stringify(articles, null, 2))
}

export function appendArticles(newArticles: NewsArticle[]): { added: number; skipped: number } {
  const existing = readArticles()
  const existingUrls = new Set(existing.map((a) => a.url))

  let added = 0
  let skipped = 0

  for (const article of newArticles) {
    if (existingUrls.has(article.url)) {
      skipped++
    } else {
      existing.push(article)
      existingUrls.add(article.url)
      added++
    }
  }

  // Keep latest 1000 articles max, sorted newest first
  existing.sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime())
  const trimmed = existing.slice(0, 1000)

  writeArticles(trimmed)
  return { added, skipped }
}

export function getTodaysArticles(): NewsArticle[] {
  const all = readArticles()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return all.filter((a) => new Date(a.scrapedAt) >= today)
}

export function getWeeklyArticles(): NewsArticle[] {
  const all = readArticles()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return all.filter((a) => new Date(a.scrapedAt) >= weekAgo)
}

// ── Config Store ─────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AppConfig = {
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  recipients: process.env.DEFAULT_RECIPIENT ? [process.env.DEFAULT_RECIPIENT] : [],
  weeklyDigestEnabled: true,
  urgentAlertsEnabled: true,
  defaultLanguage: 'en',
}

export function readConfig(): AppConfig {
  ensureDataDir()
  if (!fs.existsSync(CONFIG_PATH)) return DEFAULT_CONFIG
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function writeConfig(config: Partial<AppConfig>): AppConfig {
  ensureDataDir()
  const current = readConfig()
  const updated = { ...current, ...config }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2))
  return updated
}
