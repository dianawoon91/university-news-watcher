'use client'

import { useState, useEffect } from 'react'
import { AppConfig } from '@/lib/types'

export default function SettingsPage() {
  const [config, setConfig] = useState<Partial<AppConfig>>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    recipients: [],
    weeklyDigestEnabled: true,
    urgentAlertsEnabled: true,
    defaultLanguage: 'en',
  })
  const [recipientInput, setRecipientInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/send-email')
      .then((r) => r.json())
      .then((data) => {
        setConfig(data)
        setRecipientInput((data.recipients || []).join(', '))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const recipients = recipientInput
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-settings',
          settings: { ...config, recipients },
        }),
      })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Settings saved successfully')
      } else {
        showMessage('error', data.error || 'Failed to save')
      }
    } catch {
      showMessage('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-email' }),
      })
      const data = await res.json()
      showMessage(data.success ? 'success' : 'error', data.message || data.error)
    } finally {
      setTesting(false)
    }
  }

  const handleSendDigest = async () => {
    setSendingDigest(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-weekly-digest' }),
      })
      const data = await res.json()
      showMessage(data.success ? 'success' : 'error', data.message || data.error)
    } finally {
      setSendingDigest(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
        <div className="font-mono text-[var(--ink-muted)] text-sm">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Header */}
      <header className="bg-[var(--ink)] text-white">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="font-mono text-[11px] text-white/50 hover:text-white transition-colors tracking-wide uppercase">
              ← Back
            </a>
            <span className="text-white/20">|</span>
            <h1 className="font-display text-[15px]">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Status message */}
        {message && (
          <div className={`font-mono text-[12px] px-4 py-3 rounded-sm border animate-fade-in ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
          </div>
        )}

        {/* Language */}
        <section className="bg-white border border-[var(--border)] rounded-sm p-6">
          <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-[var(--ink-muted)] mb-4">
            Language Default
          </h2>
          <div className="flex gap-2">
            {(['en', 'cn'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setConfig({ ...config, defaultLanguage: l })}
                className={`font-mono text-[12px] font-semibold tracking-wide uppercase px-5 py-2 rounded-sm border transition-all ${
                  config.defaultLanguage === l
                    ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                    : 'border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--ink)]'
                }`}
              >
                {l === 'en' ? 'English' : '简体中文'}
              </button>
            ))}
          </div>
        </section>

        {/* Email config */}
        <section className="bg-white border border-[var(--border)] rounded-sm p-6">
          <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-[var(--ink-muted)] mb-4">
            Email / SMTP Configuration
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={config.smtpHost || ''}
                  onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full font-mono text-[13px] border border-[var(--border)] rounded-sm px-3 py-2 bg-[var(--paper)] focus:outline-none focus:border-[var(--ink)] transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={config.smtpPort || 587}
                  onChange={(e) => setConfig({ ...config, smtpPort: Number(e.target.value) })}
                  className="w-full font-mono text-[13px] border border-[var(--border)] rounded-sm px-3 py-2 bg-[var(--paper)] focus:outline-none focus:border-[var(--ink)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                SMTP Username (your email)
              </label>
              <input
                type="email"
                value={config.smtpUser || ''}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                placeholder="your@gmail.com"
                className="w-full font-mono text-[13px] border border-[var(--border)] rounded-sm px-3 py-2 bg-[var(--paper)] focus:outline-none focus:border-[var(--ink)] transition-colors"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                SMTP Password / App Password
              </label>
              <input
                type="password"
                value={config.smtpPass || ''}
                onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                placeholder="Gmail: use App Password, not your account password"
                className="w-full font-mono text-[13px] border border-[var(--border)] rounded-sm px-3 py-2 bg-[var(--paper)] focus:outline-none focus:border-[var(--ink)] transition-colors"
              />
              <p className="font-mono text-[10px] text-[var(--ink-muted)] mt-1">
                For Gmail: Google Account → Security → 2-Step Verification → App Passwords
              </p>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] block mb-1">
                Recipients (comma-separated)
              </label>
              <input
                type="text"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="team@company.com, manager@company.com"
                className="w-full font-mono text-[13px] border border-[var(--border)] rounded-sm px-3 py-2 bg-[var(--paper)] focus:outline-none focus:border-[var(--ink)] transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Email toggles */}
        <section className="bg-white border border-[var(--border)] rounded-sm p-6">
          <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-[var(--ink-muted)] mb-4">
            Email Notifications
          </h2>
          <div className="space-y-4">
            {[
              { key: 'weeklyDigestEnabled', label: 'Weekly Digest (Mondays 8am CST)', desc: 'Sends a compiled digest of the past 7 days' },
              { key: 'urgentAlertsEnabled', label: 'Urgent Alert Emails', desc: 'Sends immediately when an urgent item is detected' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[12px] font-semibold text-[var(--ink)]">{label}</p>
                  <p className="font-mono text-[10px] text-[var(--ink-muted)] mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, [key]: !config[key as keyof AppConfig] })}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    config[key as keyof AppConfig] ? 'bg-[var(--ink)]' : 'bg-[var(--border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    config[key as keyof AppConfig] ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-mono text-[11px] font-bold tracking-wide uppercase bg-[var(--ink)] text-white px-6 py-2.5 rounded-sm hover:bg-[var(--ink-soft)] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={handleTestEmail}
            disabled={testing}
            className="font-mono text-[11px] font-semibold tracking-wide uppercase border border-[var(--border)] text-[var(--ink)] px-5 py-2.5 rounded-sm hover:bg-[var(--paper-warm)] disabled:opacity-50 transition-colors"
          >
            {testing ? 'Testing...' : 'Test SMTP Connection'}
          </button>

          <button
            onClick={handleSendDigest}
            disabled={sendingDigest}
            className="font-mono text-[11px] font-semibold tracking-wide uppercase border border-[var(--border)] text-[var(--ink)] px-5 py-2.5 rounded-sm hover:bg-[var(--paper-warm)] disabled:opacity-50 transition-colors"
          >
            {sendingDigest ? 'Sending...' : 'Send Digest Now'}
          </button>
        </section>

        <p className="font-mono text-[10px] text-[var(--ink-muted)]">
          Settings are stored locally in <code className="bg-[var(--paper-warm)] px-1 py-0.5 rounded">data/config.json</code>
        </p>
      </main>
    </div>
  )
}
