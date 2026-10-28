export default function CouponNotFound() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1A3D2B]/8 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#1A3D2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#1A3D2B] mb-2">Coupon not found</h1>
        <p className="text-sm text-gray-500 mb-6">
          This coupon link is invalid or has already been used. Check the email you received for the correct link.
        </p>
        <a
          href="/orders"
          className="inline-block px-6 py-3 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
        >
          Track your order →
        </a>
        <p className="mt-6 text-xs text-gray-400">{mosqueName} · Powered by Imara</p>
      </div>
    </main>
  )
}
