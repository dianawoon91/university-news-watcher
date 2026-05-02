#!/usr/bin/env node
// scripts/scheduler.js — Run this separately to enable cron scheduling
// Usage: node scripts/scheduler.js
// Keep this process running in the background alongside `npm run dev`

// Register TypeScript paths for direct execution
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' }
})

// Load env
require('dotenv').config({ path: '.env.local' })

const { startScheduler } = require('../lib/scheduler')

console.log('🕐 Starting University News Watcher Scheduler...')
startScheduler()

// Keep alive
process.on('SIGTERM', () => {
  console.log('Scheduler stopped.')
  process.exit(0)
})
