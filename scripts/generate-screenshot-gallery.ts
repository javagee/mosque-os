/**
 * Generates docs/screenshots/index.html — a visual gallery of all captured demo screens.
 * Usage: npx tsx scripts/generate-screenshot-gallery.ts
 */
import fs from 'fs'
import path from 'path'

const OUT_DIR = path.join(process.cwd(), 'docs', 'screenshots')

const LABELS: Record<string, { section: string; title: string }> = {
  '01-buyer-homepage.png':              { section: '👤 Buyer Flow', title: 'Homepage' },
  '02-buyer-campaigns.png':             { section: '👤 Buyer Flow', title: 'Campaigns list' },
  '03-buyer-campaign-detail.png':       { section: '👤 Buyer Flow', title: 'Campaign detail' },
  '04-buyer-checkout.png':              { section: '👤 Buyer Flow', title: 'Checkout form' },
  '05-buyer-paynow.png':                { section: '👤 Buyer Flow', title: 'PayNow payment page' },
  '06-buyer-success.png':               { section: '👤 Buyer Flow', title: 'Payment success' },
  '07-buyer-track-order.png':           { section: '👤 Buyer Flow', title: 'Track Order (empty)' },
  '07b-buyer-track-order-filled.png':   { section: '👤 Buyer Flow', title: 'Track Order (filled)' },
  '10-admin-login.png':                 { section: '🛡 Admin Flow', title: 'Admin login' },
  '10b-admin-login-filled.png':         { section: '🛡 Admin Flow', title: 'Admin login (credentials)' },
  '11-admin-dashboard.png':             { section: '🛡 Admin Flow', title: 'Dashboard (pending panel)' },
  '12-admin-finance.png':               { section: '🛡 Admin Flow', title: 'Finance & Donations' },
  '13-admin-settlements.png':           { section: '🛡 Admin Flow', title: 'Settlements' },
  '14-admin-campaigns.png':             { section: '🛡 Admin Flow', title: 'Campaigns management' },
  '15-admin-settings.png':              { section: '🛡 Admin Flow', title: 'Settings' },
  '20-merchant-login.png':              { section: '🏪 Merchant Flow', title: 'Merchant login (PIN)' },
  '21-merchant-redeem.png':             { section: '🏪 Merchant Flow', title: 'Redeem voucher' },
  '21b-merchant-redeem-token-entered.png': { section: '🏪 Merchant Flow', title: 'Redeem (token entered)' },
  '22-merchant-history.png':            { section: '🏪 Merchant Flow', title: 'History & KPIs' },
  '30-mobile-homepage.png':             { section: '📱 Mobile View', title: 'Homepage (mobile)' },
  '31-mobile-campaigns.png':            { section: '📱 Mobile View', title: 'Campaigns (mobile)' },
  '32-mobile-track-order.png':          { section: '📱 Mobile View', title: 'Track Order (mobile)' },
}

const files = fs.readdirSync(OUT_DIR)
  .filter(f => f.endsWith('.png'))
  .sort()

// Group by section
const sections = new Map<string, { file: string; title: string }[]>()
for (const file of files) {
  const meta = LABELS[file] ?? { section: 'Other', title: file.replace('.png', '') }
  if (!sections.has(meta.section)) sections.set(meta.section, [])
  sections.get(meta.section)!.push({ file, title: meta.title })
}

let sectionsHtml = ''
for (const [section, items] of sections) {
  const cards = items.map(({ file, title }) => `
    <div class="card">
      <img src="${file}" alt="${title}" onclick="openModal('${file}','${title}')" />
      <p>${title}</p>
    </div>`).join('')
  sectionsHtml += `
    <section>
      <h2>${section}</h2>
      <div class="grid">${cards}</div>
    </section>`
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Imara Demo — Screenshot Gallery</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: -apple-system, sans-serif; background: #F0F4F3; color: #1A3D2B }
  header { background: #1A3D2B; color: white; padding: 28px 40px }
  header h1 { font-size: 24px; font-weight: 700 }
  header p { color: rgba(255,255,255,0.6); margin-top: 4px; font-size: 14px }
  main { max-width: 1400px; margin: 0 auto; padding: 40px 32px }
  section { margin-bottom: 48px }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px;
       border-bottom: 2px solid #1A3D2B20 }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px }
  .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08);
          cursor: pointer; transition: transform .15s, box-shadow .15s }
  .card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.12) }
  .card img { width: 100%; display: block; border-bottom: 1px solid #f0f0f0 }
  .card p { padding: 10px 14px; font-size: 13px; font-weight: 600; color: #444 }
  .modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,.8);
           z-index:100; align-items:center; justify-content:center; flex-direction:column }
  .modal.open { display:flex }
  .modal img { max-width:90vw; max-height:82vh; border-radius:8px; box-shadow:0 8px 40px rgba(0,0,0,.4) }
  .modal p { color:white; margin-top:14px; font-size:15px; font-weight:600 }
  .modal-close { position:fixed; top:20px; right:28px; color:white; font-size:28px; cursor:pointer;
                 background:rgba(255,255,255,.1); border:none; border-radius:50%;
                 width:40px; height:40px; display:flex; align-items:center; justify-content:center }
</style>
</head>
<body>
<header>
  <h1>Imara — Demo Presentation Gallery</h1>
  <p>mosque-os-ai.vercel.app · ${files.length} screens captured · ${new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
</header>
<main>${sectionsHtml}</main>
<div class="modal" id="modal" onclick="closeModal()">
  <button class="modal-close" onclick="closeModal()">✕</button>
  <img id="modal-img" src="" alt="" />
  <p id="modal-label"></p>
</div>
<script>
  function openModal(src, label) {
    document.getElementById('modal-img').src = src
    document.getElementById('modal-label').textContent = label
    document.getElementById('modal').classList.add('open')
  }
  function closeModal() { document.getElementById('modal').classList.remove('open') }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal() })
</script>
</body>
</html>`

fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html)
console.log(`✅  Gallery written to docs/screenshots/index.html (${files.length} screenshots)`)
