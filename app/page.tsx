import Link from 'next/link'
import PrayerTimes from '@/components/prayer/PrayerTimes'
import ChatWidget from '@/components/chatbot/ChatWidget'
import DonationForm from '@/components/donation/DonationForm'

export default function HomePage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  return (
    <div className="min-h-screen bg-[#F7F6F2]">

      {/* Nav */}
      <nav className="bg-[#1A3D2B] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-white tracking-tight">Imara</span>
              <span className="text-[10px] text-green-300/70 font-medium">{mosqueName}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/display" className="px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">
              Prayer Times
            </Link>
            <Link href="/campaigns" className="px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">
              Campaigns
            </Link>
            <Link href="/orders" className="px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">
              Track Order
            </Link>
            <Link href="/merchant/login" className="px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">
              Merchant
            </Link>
            <Link href="/admin/login" className="px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">
              Admin
            </Link>
            <Link href="/donate" className="ml-2 px-4 py-2 rounded-lg bg-[#C9A84C] text-[#1A3D2B] text-sm font-bold hover:bg-[#D4B865] transition-colors">
              Donate
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#1A3D2B] text-white">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-24 sm:pt-20 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#C9A84C] text-2xl sm:text-3xl font-semibold tracking-wide mb-6">إِمَارَة · Imara</p>
              <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight">
                Developing,<br />building and<br />flourishing.
              </h1>
              <p className="mt-6 text-green-200/60 text-lg leading-relaxed max-w-sm">
                The digital home for {mosqueName} — donations, prayer times, and community in one place.
              </p>
              <div className="mt-10 flex gap-3 flex-wrap">
                <Link href="/campaigns">
                  <button className="px-6 py-3.5 rounded-xl bg-[#C9A84C] text-[#1A3D2B] font-bold hover:bg-[#D4B865] transition-colors shadow-sm">
                    View campaigns
                  </button>
                </Link>
                <Link href="/donate">
                  <button className="px-6 py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors">
                    Make a donation
                  </button>
                </Link>
              </div>
            </div>

            {/* Prayer times card */}
            <div className="bg-white/8 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-green-300/60 text-xs font-semibold tracking-widest mb-5">PRAYER TIMES TODAY</p>
              <PrayerTimes />
            </div>
          </div>
        </div>
      </section>

      {/* Donation section */}
      <section className="py-20 px-6 bg-[#F7F6F2]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="lg:pt-2">
              <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-4">GIVE WITH INTENTION</p>
              <h2 className="text-4xl font-bold text-[#1A3D2B] leading-tight">Every dollar reaches the mosque.</h2>
              <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                No platform fees. No middlemen. Your donation goes directly to {mosqueName} — and your data stays yours.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  { label: '100% reaches the mosque', desc: 'No platform fees deducted from your donation' },
                  { label: 'Your data stays yours', desc: 'Donor records stored securely, never sold or shared' },
                  { label: 'PayNow — zero fees', desc: 'Pay directly via Singapore PayNow, no gateway charges' },
                ].map(item => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-5 h-5 rounded-full bg-[#1A3D2B] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-5 bg-[#1A3D2B]/5 border border-[#1A3D2B]/10 rounded-2xl">
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  "The example of those who spend their wealth in the way of Allah is like a seed which grows seven ears, each bearing a hundred seeds."
                </p>
                <p className="text-[#C9A84C] text-xs font-semibold mt-2">Quran 2:261</p>
              </div>
            </div>

            <DonationForm />
          </div>
        </div>
      </section>

      {/* Campaigns strip */}
      <section className="bg-[#1A3D2B] py-14 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-2">FUNDRAISING</p>
            <h3 className="text-2xl font-bold text-white">Support through meal vouchers</h3>
            <p className="text-green-200/60 text-sm mt-1">Buy a coupon redeemable at our merchant partners.</p>
          </div>
          <Link href="/campaigns">
            <button className="shrink-0 px-6 py-3.5 rounded-xl bg-white text-[#1A3D2B] font-bold hover:bg-green-50 transition-colors shadow-sm">
              View campaigns
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111C16] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold text-white">Imara</p>
            <p className="text-xs text-green-400/50 mt-0.5">{mosqueName}</p>
          </div>
          <div className="flex gap-6 text-sm text-green-400/40">
            <Link href="/donate" className="hover:text-green-300 transition-colors">Donate</Link>
            <Link href="/campaigns" className="hover:text-green-300 transition-colors">Campaigns</Link>
            <Link href="/display" className="hover:text-green-300 transition-colors">Prayer Times</Link>
            <Link href="/admin/login" className="hover:text-green-300 transition-colors">Admin</Link>
          </div>
          <p className="text-xs text-green-400/30">PayNow · Zero fees · Built with Imara</p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  )
}
