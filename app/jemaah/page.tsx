import Link from 'next/link'
import Nav from '@/components/layout/Nav'

export default function JemaahLandingPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3] flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-1">JEMAAH</p>
            <h1 className="text-3xl font-bold text-[#1A3D2B]">Congregation Check-in</h1>
            <p className="text-gray-500 text-sm mt-2">Register once. Scan your QR at every prayer.</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/jemaah/register"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#1A3D2B] text-white font-semibold text-sm hover:bg-[#153024] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Register as Jemaah
            </Link>
            <Link
              href="/jemaah/lookup"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-[#1A3D2B] text-[#1A3D2B] font-semibold text-sm hover:bg-[#1A3D2B]/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find my QR card
            </Link>
          </div>

          <p className="text-xs text-gray-400">
            Already registered? Use your email to find your QR card.
          </p>
        </div>
      </main>
    </>
  )
}
