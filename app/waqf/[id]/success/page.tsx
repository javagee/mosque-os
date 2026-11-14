import Link from 'next/link'
import Nav from '@/components/layout/Nav'

export const dynamic = 'force-dynamic'

export default async function WaqfSuccessPage({ searchParams }: { searchParams: Promise<{ share_id?: string }> }) {
  const { share_id } = await searchParams
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1A3D2B]">Waqf Subscription Received</h1>
          {share_id && <p className="text-xs font-mono text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">Reference: {share_id}</p>}
          <p className="text-sm text-gray-500 leading-relaxed">
            Once your payment is verified, your shares will be recorded in the Waqf Registry. You are now part of a perpetual legacy.
          </p>
          <p className="arabic text-[#C9A84C] text-lg">جَزَاكُمُ اللَّهُ خَيْرًا</p>
          <p className="text-xs text-gray-400">May Allah reward you with goodness</p>
          <Link href="/waqf" className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors">
            Back to Waqf Portfolio
          </Link>
        </div>
      </main>
    </>
  )
}
