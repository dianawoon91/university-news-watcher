/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['node-cron', 'nodemailer', 'cheerio', 'rss-parser'],
  },
}

module.exports = nextConfig
