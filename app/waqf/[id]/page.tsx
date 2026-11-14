import { notFound } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import { getWaqfAsset, getAssetShares, getAssetTransactions } from '@/lib/waqf-store'
import WaqfSubscribeForm from './WaqfSubscribeForm'

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

export default async function WaqfAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const asset = await getWaqfAsset(id)
  if (!asset || asset.status !== 'active') notFound()

  const [shares, txs] = await Promise.all([getAssetShares(id), getAssetTransactions(id)])
  const confirmed = shares.filter(s => s.status === 'confirmed')
  const lbl = TYPE_LABELS[asset.type] ?? { en: asset.type, ar: '' }

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3]">
        <div className="bg-[#1A3D2B] text-white px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <a href="/waqf" className="text-white/50 text-sm hover:text-white transition-colors">Waqf Portfolio</a>
              <span className="text-white/30">›</span>
              <span className="text-white/70 text-sm">{asset.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/70 text-[10px] font-semibold">{lbl.en}</span>
              <span className="arabic text-[#C9A84C] text-sm">{lbl.ar}</span>
              {asset.country && <span className="text-white/40 text-[10px]">{asset.country}</span>}
            </div>
            <h1 className="text-3xl font-bold">{asset.name}</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: asset details */}
          <div className="space-y-5">
            {asset.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm text-gray-600 leading-relaxed">{asset.description}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Endowment Details</h3>

              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Established</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(asset.established_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <svg className="w-4 h-4 text-[#C9A84C]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  Principal (locked)
                </span>
                <span className="text-lg font-bold text-[#C9A84C]">{fmt(asset.principal, asset.currency)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Returns Available</span>
                <span className="text-sm font-semibold text-green-600">{fmt(asset.returns_available, asset.currency)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Returns This Year</span>
                <span className="text-sm font-medium text-gray-900">{fmt(asset.returns_ytd, asset.currency)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Returns Lifetime</span>
                <span className="text-sm font-medium text-gray-900">{fmt(asset.returns_lifetime, asset.currency)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Shareholders</span>
                <span className="text-sm font-medium text-gray-900">{confirmed.length}</span>
              </div>

              {asset.shariah_cert_ref && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Shariah Cert</span>
                  <span className="text-xs font-mono text-gray-700">{asset.shariah_cert_ref}</span>
                </div>
              )}

              {asset.registry_ref && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Registry Ref</span>
                  <span className="text-xs font-mono text-gray-700">{asset.registry_ref}</span>
                </div>
              )}
            </div>

            {txs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {txs.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold mr-2 ${
                          tx.type === 'contribution' ? 'bg-green-100 text-green-700' :
                          tx.type === 'return_earned' ? 'bg-blue-100 text-blue-700' :
                          tx.type === 'disbursement' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>{tx.type.replace('_', ' ')}</span>
                        <span className="text-gray-500 text-xs">{tx.note}</span>
                      </div>
                      <span className={`font-medium ${tx.amount < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {tx.amount < 0 ? '-' : '+'}{fmt(Math.abs(tx.amount), asset.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: subscription form */}
          <div>
            <WaqfSubscribeForm asset={asset} />
          </div>
        </div>
      </main>
    </>
  )
}
