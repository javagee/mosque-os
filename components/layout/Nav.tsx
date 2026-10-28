import Link from 'next/link'

export default function Nav({ mosqueName }: { mosqueName: string }) {
  return (
    <div className="sticky top-0 z-40">
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
    </div>
  )
}
