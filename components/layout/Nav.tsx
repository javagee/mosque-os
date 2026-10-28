import Link from 'next/link'

export default function Nav({ mosqueName }: { mosqueName: string }) {
  return (
    <div className="sticky top-0 z-40">
      {/* Demo persona switcher */}
      <div className="bg-[#111C16] border-b border-white/5 px-6 py-1.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-[10px] text-green-400/40 font-semibold tracking-widest">DEMO</span>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-green-400/40">Switch persona:</span>
            <Link href="/campaigns" className="text-green-300/60 hover:text-[#C9A84C] transition-colors font-semibold">
              👤 Buyer
            </Link>
            <Link href="/merchant/login" className="text-green-300/60 hover:text-[#C9A84C] transition-colors font-semibold">
              🏪 Merchant
            </Link>
            <Link href="/admin/login" className="text-green-300/60 hover:text-[#C9A84C] transition-colors font-semibold">
              🛡 Admin
            </Link>
          </div>
        </div>
      </div>

      <nav className="bg-[#1A3D2B]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-base font-bold text-white tracking-tight">Imara</span>
            <span className="text-[10px] text-green-300/70 font-medium">{mosqueName}</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/display" className="px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">
              Prayer Times
            </Link>
            <Link href="/campaigns" className="px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">
              Campaigns
            </Link>
            <Link href="/merchant/login" className="px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">
              Merchant
            </Link>
            <Link href="/admin/finance" className="px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">
              Admin
            </Link>
            <Link href="/donate" className="ml-2 px-4 py-2 rounded-lg bg-[#C9A84C] text-[#1A3D2B] text-sm font-bold hover:bg-[#D4B865] transition-colors">
              Donate
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
