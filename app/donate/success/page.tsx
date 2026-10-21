import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import { db } from '@/lib/db'
import type { Coupon } from '@/types'

export const dynamic = 'force-dynamic'

async function getCouponsBySession(sessionId: string): Promise<Coupon[]> {
  try {
    // For Supabase provider — fetch by session
    const supabase = (await import('@/lib/supabase')).getSupabaseAdmin()
    if (!supabase) return []
    const { data } = await supabase
      .from('coupons')
      .select('*, campaign:campaigns(*)')
      .eq('stripe_session_id', sessionId)
    return (data as Coupon[]) ?? []
  } catch { return [] }
}

export default async function DonationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; type?: string; demo?: string }>
}) {
  const { session_id, type, demo } = await searchParams
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const isCoupon = type === 'coupon'
  const coupons = isCoupon && session_id && !demo ? await getCouponsBySession(session_id) : []

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Nav mosqueName={mosqueName} />

      {/* Green confirmation band */}
      <div className="bg-[#1A3D2B] pt-16 pb-24">
        <div className="max-w-md mx-auto px-6 text-center">
          {/* Check circle */}
          <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white">JazakAllah<br />Khayran</h1>
          <p className="text-green-200/70 mt-4 text-sm leading-relaxed">
            {isCoupon
              ? 'Your coupon purchase was successful. Your digital coupons have been sent to your email.'
              : `Your donation to ${mosqueName} has been received. A confirmation has been sent to your email.`}
          </p>
        </div>
      </div>

      {/* Content card — floats over the green band */}
      <div className="max-w-md mx-auto px-6 -mt-8 pb-16 space-y-4">

        {/* Coupon links */}
        {coupons.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Your coupon{coupons.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {coupons.map((c) => (
                <Link
                  key={c.id}
                  href={`/coupons/${c.token}`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#F0F7F3] hover:bg-[#E3F1E8] border border-[#1A3D2B]/10 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-[#1A3D2B] text-sm">{c.campaign?.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">S/N: {c.serial_number}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#1A3D2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Present the QR code at any participating outlet to redeem
            </p>
          </div>
        )}

        {/* Verse */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="border-l-2 border-[#C9A84C] pl-4">
            <p className="text-gray-700 text-sm italic leading-relaxed">
              "The example of those who spend their wealth in the way of Allah is like a seed which grows seven ears, each bearing a hundred seeds."
            </p>
            <p className="text-[#C9A84C] text-xs font-semibold mt-2">Quran 2:261</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href={isCoupon ? '/campaigns' : '/donate'} className="flex-1">
            <button className="w-full py-3.5 rounded-xl border-2 border-[#1A3D2B] text-[#1A3D2B] text-sm font-bold hover:bg-[#1A3D2B] hover:text-white transition-colors">
              {isCoupon ? 'More campaigns' : 'Donate again'}
            </button>
          </Link>
          <Link href="/" className="flex-1">
            <button className="w-full py-3.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-bold hover:bg-[#2D6A4F] transition-colors">
              Back home
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
