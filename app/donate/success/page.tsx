import Link from 'next/link'
import Nav from '@/components/layout/Nav'

export const dynamic = 'force-dynamic'

export default async function DonationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; type?: string; demo?: string; ref?: string }>
}) {
  const { type, demo, ref } = await searchParams
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const isCoupon = type === 'coupon'
  const isDemo = demo === 'true'

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Nav mosqueName={mosqueName} />

      {/* Green confirmation band */}
      <div className="bg-[#1A3D2B] pt-16 pb-28">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white">JazakAllah<br />Khayran</h1>
          <p className="text-green-200/70 mt-4 text-sm leading-relaxed">
            {isCoupon
              ? 'Payment received. The mosque team will verify your PayNow transfer and email your e-coupon within a few hours. JazakAllah Khayran.'
              : `Your donation to ${mosqueName} has been received. A confirmation has been sent to your email.`}
          </p>
          {isDemo && (
            <p className="mt-3 text-xs text-amber-300/80 bg-white/5 border border-white/10 rounded-xl px-4 py-2 inline-block">
              Demo mode — no real payment was processed
            </p>
          )}
        </div>
      </div>

      {/* Floating card area */}
      <div className="max-w-md mx-auto px-6 -mt-10 pb-16 space-y-4">

        {/* Verse */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="border-l-2 border-[#C9A84C] pl-4">
            <p className="text-gray-700 text-sm italic leading-relaxed">
              "The example of those who spend their wealth in the way of Allah is like a seed which grows seven ears, each bearing a hundred seeds."
            </p>
            <p className="text-[#C9A84C] text-xs font-semibold mt-2">Quran 2:261</p>
          </div>
        </div>

        {/* Order reference + status for coupon buyers */}
        {isCoupon && ref && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Awaiting bank verification</span>
            </div>
            <p className="text-xs text-amber-600 mb-2">Your order reference</p>
            <p className="font-mono text-xl font-bold text-[#1A3D2B] tracking-widest">{ref}</p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Screenshot this reference. Once the mosque team confirms your PayNow transfer, your e-coupon will be emailed to you automatically.
            </p>
            <Link
              href={`/orders/${ref}`}
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#1A3D2B] hover:underline"
            >
              Check order status →
            </Link>
          </div>
        )}

        {/* What happens next */}
        {isCoupon && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">What happens next?</h2>
            <ol className="space-y-3">
              {[
                { step: '1', text: 'The mosque team checks your PayNow transfer against the bank statement (usually within a few hours)' },
                { step: '2', text: 'Admin clicks "Verify & Send E-Coupon" — your voucher is immediately emailed to you' },
                { step: '3', text: 'Show the QR code at the merchant outlet to redeem. JazakAllah Khayran for your support!' },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1A3D2B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <span className="text-sm text-gray-600">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

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
