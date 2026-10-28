/**
 * Imara Demo Screenshot Capture
 * Captures every key screen across Buyer, Admin, and Merchant flows.
 * Output: docs/screenshots/  (named and numbered for presentation order)
 *
 * Usage:
 *   npx tsx scripts/capture-demo-screens.ts
 *
 * Requires: DEMO_BASE_URL env var (defaults to production URL)
 */

import { chromium, type Page, type BrowserContext } from 'playwright'
import path from 'path'
import fs from 'fs'

const BASE_URL = process.env.DEMO_BASE_URL ?? 'https://mosque-os-ai.vercel.app'
const OUT_DIR = path.join(process.cwd(), 'docs', 'screenshots')

// Viewport for consistent presentation screenshots (16:9-ish)
const VIEWPORT = { width: 1280, height: 800 }

async function shot(page: Page, filename: string, label: string) {
  // Wait for any animations / loading to settle
  await page.waitForTimeout(1200)
  const file = path.join(OUT_DIR, filename)
  await page.screenshot({ path: file, fullPage: false })
  console.log(`  ✓  ${label.padEnd(55)} → ${filename}`)
}

async function seedDemoData() {
  console.log('\n🌱  Seeding demo data...')
  const res = await fetch(`${BASE_URL}/api/admin/seed-demo`, { method: 'POST' })
  const data = await res.json() as { seeded?: number; references?: string[] }
  if (data.references?.length) {
    console.log(`    Seeded ${data.seeded} pending orders: ${data.references.join(', ')}`)
    return data.references[0]!
  }
  console.log('    (demo orders already exist or seed returned no references)')
  return null
}

// ─── SECTION 1: PUBLIC / BUYER FLOW ──────────────────────────────────────────

async function capturePublicFlow(context: BrowserContext) {
  console.log('\n👤  BUYER FLOW')
  const page = await context.newPage()
  await page.setViewportSize(VIEWPORT)

  // 1-01 Homepage
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await shot(page, '01-buyer-homepage.png', '1-01  Homepage')

  // 1-02 Campaigns list
  await page.goto(`${BASE_URL}/campaigns`, { waitUntil: 'networkidle' })
  await shot(page, '02-buyer-campaigns.png', '1-02  Campaigns list')

  // 1-03 Campaign detail — pick first campaign card
  const firstCard = page.locator('a[href^="/campaigns/"]').first()
  await firstCard.click()
  await page.waitForLoadState('networkidle')
  await shot(page, '03-buyer-campaign-detail.png', '1-03  Campaign detail')

  // 1-04 Checkout form
  const buyBtn = page.getByRole('button', { name: /buy voucher|purchase|buy now/i }).first()
  if (await buyBtn.isVisible()) await buyBtn.click()
  else await page.goto(BASE_URL + '/campaigns', { waitUntil: 'networkidle' })
  await page.waitForLoadState('networkidle')

  // Navigate to checkout directly if button didn't land there
  const currentUrl = page.url()
  if (!currentUrl.includes('checkout')) {
    const checkoutLink = page.locator('a[href*="checkout"]').first()
    if (await checkoutLink.isVisible()) await checkoutLink.click()
    await page.waitForLoadState('networkidle')
  }

  // Fill checkout form if visible
  const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
  if (await nameInput.isVisible()) {
    await nameInput.fill('Ahmad Demo')
    await page.locator('input[name="email"], input[type="email"]').first().fill('demo@imara.sg')
    await shot(page, '04-buyer-checkout.png', '1-04  Checkout form (filled)')
  } else {
    await shot(page, '04-buyer-checkout.png', '1-04  Checkout page')
  }

  // 1-05 PayNow payment page — use a known seeded order reference
  // Navigate to a pay page via the form submit or a known ref
  const submitBtn = page.getByRole('button', { name: /proceed|paynow|pay/i }).first()
  if (await submitBtn.isVisible() && !await submitBtn.isDisabled()) {
    await submitBtn.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  }
  if (page.url().includes('/pay/')) {
    await shot(page, '05-buyer-paynow.png', '1-05  PayNow payment page')

    // Click "I've completed payment"
    const paidBtn = page.getByRole('button', { name: /completed payment|i.ve paid|paid/i }).first()
    if (await paidBtn.isVisible()) {
      await paidBtn.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
      await shot(page, '06-buyer-success.png', '1-06  Payment success page')
    }
  } else {
    console.log('    ⚠  Could not reach PayNow page via form — capturing orders page instead')
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' })
    await shot(page, '05-buyer-paynow.png', '1-05  (PayNow page — form submit skipped)')
  }

  // 1-06 Success page (direct nav with known ref if not already there)
  if (!page.url().includes('success')) {
    await page.goto(`${BASE_URL}/donate/success?type=coupon&ref=IMA-DEMO01`, { waitUntil: 'networkidle' })
    await shot(page, '06-buyer-success.png', '1-06  Payment success page')
  }

  // 1-07 Track Order lookup
  await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' })
  await shot(page, '07-buyer-track-order.png', '1-07  Track Order page (empty)')

  // Fill with demo values
  const refInput = page.locator('input[placeholder*="IMA" i], input[placeholder*="reference" i]').first()
  if (await refInput.isVisible()) {
    await refInput.fill('IMA-NAZW7Z')
    await page.locator('input[type="email"]').first().fill('demo@imara.sg')
    await shot(page, '07b-buyer-track-order-filled.png', '1-07b Track Order page (filled)')
  }

  await page.close()
}

// ─── SECTION 2: ADMIN FLOW ───────────────────────────────────────────────────

async function captureAdminFlow(context: BrowserContext) {
  console.log('\n🛡  ADMIN FLOW')
  const page = await context.newPage()
  await page.setViewportSize(VIEWPORT)

  // 2-01 Admin login page
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' })
  await shot(page, '10-admin-login.png', '2-01  Admin login page')

  // 2-02 Fill credentials and login
  await page.locator('input[type="text"], input[name="username"]').first().fill('admin')
  await page.locator('input[type="password"]').first().fill('Imara@2026')
  await shot(page, '10b-admin-login-filled.png', '2-02  Admin login (credentials entered)')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // 2-03 Admin dashboard
  await shot(page, '11-admin-dashboard.png', '2-03  Admin dashboard (with pending panel)')

  // 2-04 Finance page
  await page.goto(`${BASE_URL}/admin/finance`, { waitUntil: 'networkidle' })
  await shot(page, '12-admin-finance.png', '2-04  Finance & Donations page')

  // 2-05 Settlements page
  await page.goto(`${BASE_URL}/admin/settlements`, { waitUntil: 'networkidle' })
  await shot(page, '13-admin-settlements.png', '2-05  Settlements page')

  // 2-06 Campaigns management
  await page.goto(`${BASE_URL}/admin/campaigns`, { waitUntil: 'networkidle' })
  await shot(page, '14-admin-campaigns.png', '2-06  Campaigns management')

  // 2-07 Settings
  await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' })
  await shot(page, '15-admin-settings.png', '2-07  Settings page')

  await page.close()
}

// ─── SECTION 3: MERCHANT FLOW ────────────────────────────────────────────────

async function captureMerchantFlow(context: BrowserContext) {
  console.log('\n🏪  MERCHANT FLOW')
  const page = await context.newPage()
  await page.setViewportSize(VIEWPORT)

  // 3-01 Merchant login
  await page.goto(`${BASE_URL}/merchant/login`, { waitUntil: 'networkidle' })
  await shot(page, '20-merchant-login.png', '3-01  Merchant login (PIN entry)')

  // 3-02 Use demo bar to bypass login → redeem page
  await page.goto(`${BASE_URL}/api/demo/persona?persona=merchant`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await shot(page, '21-merchant-redeem.png', '3-02  Merchant redeem page')

  // 3-03 Look up the seeded coupon — first get a valid token
  // We need to find an active coupon token — use admin API or known seed data
  // For now capture the manual input state
  const tokenInput = page.locator('input[placeholder*="coupon" i], input[placeholder*="token" i]').first()
  if (await tokenInput.isVisible()) {
    await tokenInput.fill('XXXX-XXXX-XXXX')
    await shot(page, '21b-merchant-redeem-token-entered.png', '3-03  Redeem page (token entered)')
    await tokenInput.fill('') // clear
  }

  // 3-04 Merchant history
  await page.goto(`${BASE_URL}/merchant/history`, { waitUntil: 'networkidle' })
  await shot(page, '22-merchant-history.png', '3-04  Merchant history & KPIs')

  await page.close()
}

// ─── SECTION 4: MOBILE VIEW (buyer on phone) ─────────────────────────────────

async function captureMobileFlow(context: BrowserContext) {
  console.log('\n📱  MOBILE VIEW (Buyer on iPhone)')
  const page = await context.newPage()
  await page.setViewportSize({ width: 390, height: 844 }) // iPhone 14 Pro

  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await shot(page, '30-mobile-homepage.png', '4-01  Homepage (mobile)')

  await page.goto(`${BASE_URL}/campaigns`, { waitUntil: 'networkidle' })
  await shot(page, '31-mobile-campaigns.png', '4-02  Campaigns (mobile)')

  await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' })
  await shot(page, '32-mobile-track-order.png', '4-03  Track Order (mobile)')

  await page.close()
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  // Ensure output dir exists
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log(`\n🎬  Imara Demo Screenshot Capture`)
  console.log(`    URL: ${BASE_URL}`)
  console.log(`    Out: ${OUT_DIR}\n`)

  await seedDemoData()

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: 'en-SG',
    timezoneId: 'Asia/Singapore',
  })

  try {
    await capturePublicFlow(context)
    await captureAdminFlow(context)
    await captureMerchantFlow(context)
    await captureMobileFlow(context)
  } finally {
    await browser.close()
  }

  // Print summary
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).sort()
  console.log(`\n✅  Done — ${files.length} screenshots saved to docs/screenshots/\n`)
  files.forEach(f => console.log(`    ${f}`))
  console.log('\n💡  Open docs/screenshots/ in Finder to review, or use the HTML viewer:')
  console.log('    npx tsx scripts/generate-screenshot-gallery.ts\n')
}

main().catch(err => {
  console.error('\n❌ Error:', err)
  process.exit(1)
})
