import { Suspense } from 'react'
import Nav from '@/components/layout/Nav'
import { getActiveCampaign } from '@/lib/qurbani-store'
import QurbaniOrderForm from './QurbaniOrderForm'

export const dynamic = 'force-dynamic'

export default async function QurbaniOrderPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const campaign = await getActiveCampaign()

  if (!campaign) {
    return (
      <>
        <Nav mosqueName={mosqueName} />
        <main className="min-h-screen bg-[#F0F4F3] flex items-center justify-center">
          <p className="text-gray-500">No active Qurbani campaign.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3]">
        <div className="bg-[#1A3D2B] text-white px-6 py-10 text-center">
          <p className="arabic text-[#C9A84C] text-2xl mb-1">أُضْحِيَة</p>
          <h1 className="text-3xl font-bold">Place Qurbani Order</h1>
          <p className="text-white/60 text-sm mt-1">Eid al-Adha {campaign.year}{campaign.hijri_year ? ` · ${campaign.hijri_year}` : ''}</p>
        </div>
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <Suspense>
              <QurbaniOrderForm campaign={campaign} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  )
}
