import { NextRequest, NextResponse } from 'next/server'
import { readConfig, writeConfig, getWeeklyArticles } from '@/lib/store'
import { sendWeeklyDigest } from '@/lib/emailer'
import { AppConfig } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  const config = readConfig()

  if (action === 'send-weekly-digest') {
    try {
      const articles = getWeeklyArticles()
      await sendWeeklyDigest(articles, config)
      return NextResponse.json({ success: true, message: 'Weekly digest sent' })
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : 'Failed to send email' },
        { status: 500 }
      )
    }
  }

  if (action === 'test-email') {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: { user: config.smtpUser, pass: config.smtpPass },
      })
      await transporter.verify()
      return NextResponse.json({ success: true, message: 'SMTP connection verified' })
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : 'SMTP test failed' },
        { status: 500 }
      )
    }
  }

  if (action === 'save-settings') {
    const { settings } = body as { settings: Partial<AppConfig> }
    const updated = writeConfig(settings)
    return NextResponse.json({ success: true, config: updated })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function GET() {
  const config = readConfig()
  // Never expose SMTP password to frontend
  const safeConfig = { ...config, smtpPass: config.smtpPass ? '••••••••' : '' }
  return NextResponse.json(safeConfig)
}
