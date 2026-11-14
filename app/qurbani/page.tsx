import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import { getActiveCampaign, getCampaignOrders } from '@/lib/qurbani-store'

export const dynamic = 'force-dynamic'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function QurbaniPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const campaign = await getActiveCampaign()

  if (!campaign) {
    return (
      <>
        <Nav mosqueName={mosqueName} />
        <main className="min-h-screen bg-[#F0F4F3]">
          <div className="bg-[#1A3D2B] text-white px-6 py-20 text-center">
            <p className="arabic text-[#C9A84C] text-3xl mb-3">أُضْحِيَة</p>
            <h1 className="text-4xl font-bold mb-3">Qurbani</h1>
            <p className="text-white/60 max-w-md mx-auto text-sm">No Qurbani campaign is currently active. Check back closer to Eid al-Adha.</p>
          </div>
        </main>
      </>
    )
  }

  const orders = await getCampaignOrders(campaign.id)
  const activeOrders = orders.filter(o => o.status !== 'cancelled')

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3]">
        {/* Hero */}
        <div className="bg-[#1A3D2B] text-white px-6 py-16 text-center">
          <p className="arabic text-[#C9A84C] text-3xl mb-2">أُضْحِيَة</p>
          <h1 className="text-4xl font-bold mb-2">Qurbani {campaign.year}</h1>
          <p className="arabic text-white/50 text-sm mb-4">وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ — They were commanded only to worship Allah</p>
          <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed mb-5">
            Fulfil your Sunnah this Eid al-Adha. Place your order online — we coordinate fulfilment with certified halal partners worldwide.
          </p>
          <div className="inline-flex flex-col sm:flex-row gap-2 items-center justify-center text-xs">
            <span className="px-3 py-1.5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C] font-semibold">
              Eid al-Adha · {fmtDate(campaign.eid_date)}{campaign.hijri_year ? ` · ${campaign.hijri_year}` : ''}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/70">
              Qurbani performed by {fmtDate(campaign.fulfilment_deadline)}
            </span>
          </div>
        </div>

        {/* Animal cards */}
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
          {campaign.animals.map(animal => {
            const taken = activeOrders.filter(o => o.animal_type === animal.type).length
            const remaining = animal.capacity != null ? animal.capacity - taken : null
            const isFull = remaining != null && remaining <= 0
            return (
              <div key={animal.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="arabic text-[#C9A84C] text-xl">{animal.arabic}</p>
                    <span className="text-sm font-semibold text-gray-700">{animal.label}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Fulfils obligation for <strong>{animal.pax}</strong> person{animal.pax !== 1 ? 's' : ''}
                    {animal.type === 'cow_full' && ' — coordinate 7 shareholders with mosque'}
                  </p>
                  {remaining != null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{taken} ordered</span>
                        <span>{remaining > 0 ? `${remaining} remaining` : 'Fully booked'}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C9A84C] rounded-full"
                          style={{ width: `${Math.min(100, (taken / animal.capacity!) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right space-y-2">
                  <p className="text-2xl font-bold text-[#1A3D2B]">{fmt(animal.price, campaign.currency)}</p>
                  {isFull ? (
                    <span className="inline-block px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold">Fully Booked</span>
                  ) : (
                    <Link
                      href={`/qurbani/order?type=${animal.type}`}
                      className="inline-block px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors"
                    >
                      Order Now →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="max-w-3xl mx-auto px-6 pb-16 text-center space-y-2">
          <p className="arabic text-[#1A3D2B]/40 text-lg">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          <p className="text-xs text-gray-400">Zero platform fees — 100% of your payment goes to Qurbani</p>
          <Link href="/qurbani/track" className="text-xs text-[#1A3D2B]/60 hover:text-[#1A3D2B] underline underline-offset-2">Track your order →</Link>
        </div>
      </main>
    </>
  )
}
