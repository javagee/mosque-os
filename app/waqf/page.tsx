import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import { getAllWaqfAssets, getAssetShares } from '@/lib/waqf-store'
import type { WaqfAsset } from '@/types'

export const dynamic = 'force-dynamic'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
}

const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  cash:     { en: 'Cash Endowment', ar: 'نقدي' },
  property: { en: 'Property Waqf',  ar: 'عقاري' },
  sukuk:    { en: 'Sukuk',          ar: 'صكوك' },
  other:    { en: 'Other',          ar: 'أخرى' },
}

export default async function WaqfPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const assets = await getAllWaqfAssets()
  const active = assets.filter(a => a.status === 'active')

  const sharesByAsset = await Promise.all(active.map(a => getAssetShares(a.id)))
  const confirmedSharesByAsset = sharesByAsset.map(s => s.filter(x => x.status === 'confirmed'))

  const totalPrincipalUSD = active
    .filter(a => a.currency === 'USD')
    .reduce((sum, a) => sum + a.principal, 0)

  const totalShareholders = confirmedSharesByAsset.reduce((sum, s) => sum + s.length, 0)
  const totalReturnsLifetime = active
    .filter(a => a.currency === 'USD')
    .reduce((sum, a) => sum + a.returns_lifetime, 0)

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3]">
        {/* Hero */}
        <div className="bg-[#1A3D2B] text-white px-6 py-16 text-center">
          <p className="arabic text-[#C9A84C] text-3xl mb-2">وَقْف</p>
          <h1 className="text-4xl font-bold mb-3">Waqf Portfolio</h1>
          <p className="arabic text-white/50 text-sm mb-4">وَقَفْنَا لِلَّهِ — We endow for the sake of Allah</p>
          <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
            Perpetual endowments that give forever — across borders, across generations.
            Your principal is permanently preserved by code — only returns are disbursed to benefit the ummah.
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto px-6 -mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Endowed', value: totalPrincipalUSD > 0 ? fmt(totalPrincipalUSD, 'USD') : '—' },
              { label: 'Returns Generated', value: totalReturnsLifetime > 0 ? fmt(totalReturnsLifetime, 'USD') : '—' },
              { label: 'Active Programmes', value: String(active.length) },
              { label: 'Shareholders', value: String(totalShareholders) },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-xs font-semibold text-gray-400 mb-1">{s.label}</p>
                <p className="text-xl font-bold text-[#1A3D2B]">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Asset cards */}
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
          {active.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No active waqf programmes. Check back soon.</div>
          ) : active.map((asset, i) => {
            const shareholders = confirmedSharesByAsset[i].length
            const lbl = TYPE_LABELS[asset.type] ?? { en: asset.type, ar: '' }
            return (
              <div key={asset.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg bg-[#1A3D2B]/10 text-[#1A3D2B] text-[10px] font-semibold">{lbl.en}</span>
                    <span className="arabic text-[#C9A84C] text-sm">{lbl.ar}</span>
                    {asset.country && <span className="text-[10px] text-gray-400">{asset.country}</span>}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{asset.name}</h2>
                  {asset.description && <p className="text-sm text-gray-500 leading-relaxed">{asset.description}</p>}
                </div>
                <div className="flex-shrink-0 text-right space-y-1 min-w-[180px]">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold">Principal Endowed</p>
                    <p className="text-xl font-bold text-[#C9A84C] flex items-center justify-end gap-1">
                      <svg className="w-4 h-4 text-[#C9A84C]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      {fmt(asset.principal, asset.currency)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">{shareholders} shareholder{shareholders !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-gray-500 font-medium">{fmt(asset.unit_price, asset.currency)} per share</p>
                  <Link
                    href={`/waqf/${asset.id}`}
                    className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors"
                  >
                    Subscribe →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div className="max-w-4xl mx-auto px-6 pb-16 text-center">
          <p className="arabic text-[#1A3D2B]/40 text-lg mb-1">الْأَصْلُ مَحْفُوظٌ وَالنَّفْعُ جَارٍ</p>
          <p className="text-xs text-gray-400">The principal is preserved and the benefit flows — in accordance with AAOIFI Waqf Standards</p>
        </div>
      </main>
    </>
  )
}
