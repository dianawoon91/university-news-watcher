export type UrgencyLevel = 'URGENT' | 'NORMAL'

export type NewsCategory =
  | 'URGENT_ALERTS'
  | 'APPLICATION_POLICY'
  | 'ADMISSIONS_STATS'
  | 'POPULAR_MAJORS'
  | 'EXTRACURRICULAR'
  | 'AI_TECHNOLOGY'
  | 'INTERNATIONAL'
  | 'OTHER_MARKETS'
  | 'GENERAL'

export interface NewsArticle {
  id: string
  universityName: string
  universityShortName: string
  title: string
  url: string
  source: string
  publishedAt: string
  scrapedAt: string
  summaryEn: string
  summaryCn: string
  category: NewsCategory
  urgency: UrgencyLevel
  urgencyReason?: string
}

export interface AppConfig {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  recipients: string[]
  weeklyDigestEnabled: boolean
  urgentAlertsEnabled: boolean
  defaultLanguage: 'en' | 'cn'
}

export const CATEGORY_LABELS: Record<NewsCategory, { en: string; cn: string }> = {
  URGENT_ALERTS: { en: 'Urgent Alerts', cn: '紧急警报' },
  APPLICATION_POLICY: { en: 'Application Policy Changes', cn: '申请政策变更' },
  ADMISSIONS_STATS: { en: 'Admissions Statistics & Trends', cn: '录取数据与趋势' },
  POPULAR_MAJORS: { en: 'Popular Majors & Programs', cn: '热门专业与项目' },
  EXTRACURRICULAR: { en: 'Extracurricular & Activity Trends', cn: '课外活动趋势' },
  AI_TECHNOLOGY: { en: 'AI & Technology in Admissions', cn: '录取中的AI与技术' },
  INTERNATIONAL: { en: 'International Student News', cn: '国际学生新闻' },
  OTHER_MARKETS: { en: 'Other Markets', cn: '其他市场' },
  GENERAL: { en: 'General News', cn: '综合新闻' },
}

export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  URGENT_ALERTS: 'bg-red-100 text-red-800 border-red-200',
  APPLICATION_POLICY: 'bg-blue-100 text-blue-800 border-blue-200',
  ADMISSIONS_STATS: 'bg-purple-100 text-purple-800 border-purple-200',
  POPULAR_MAJORS: 'bg-green-100 text-green-800 border-green-200',
  EXTRACURRICULAR: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  AI_TECHNOLOGY: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  INTERNATIONAL: 'bg-orange-100 text-orange-800 border-orange-200',
  OTHER_MARKETS: 'bg-gray-100 text-gray-800 border-gray-200',
  GENERAL: 'bg-slate-100 text-slate-800 border-slate-200',
}
