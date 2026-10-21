import DonationForm from '@/components/donation/DonationForm'
import Link from 'next/link'
import Nav from '@/components/layout/Nav'

export default function DonatePage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  return (
    <main className="min-h-screen bg-[#F7F6F2]">
      <Nav mosqueName={mosqueName} />

      {/* Hero */}
      <div className="bg-[#1A3D2B]">
        <div className="max-w-lg mx-auto px-6 py-14">
          <Link href="/" className="inline-flex items-center gap-1.5 text-green-300/70 hover:text-green-200 text-xs font-medium mb-6 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {mosqueName}
          </Link>
          <h1 className="text-4xl font-bold text-white leading-tight">Make a<br />donation</h1>
          <p className="text-green-200/70 mt-3 text-sm leading-relaxed">
            Every contribution goes directly to {mosqueName}. You own your data — we never share it.
          </p>
          {/* Quranic verse */}
          <div className="mt-8 border-l-2 border-[#C9A84C]/50 pl-4">
            <p className="text-white/90 text-sm leading-relaxed italic">
              "The example of those who spend their wealth in the way of Allah is like a seed which grows seven ears, each bearing a hundred seeds."
            </p>
            <p className="text-[#C9A84C] text-xs mt-1.5 font-medium">— Quran 2:261</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-6 -mt-4 pb-16">
        <DonationForm />
      </div>
    </main>
  )
}
