'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function MerchantNav({ merchantName }: { merchantName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/merchant/auth', { method: 'DELETE' })
    router.push('/merchant/login')
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <p className="text-xs font-semibold text-[#C9A84C] mb-0.5 tracking-wide">Merchant · Imara</p>
        <p className="text-sm font-bold text-[#1A3D2B]">{merchantName}</p>
      </div>
      <div className="flex items-center gap-1">
        <Link
          href="/merchant/redeem"
          className={`text-sm px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            pathname === '/merchant/redeem'
              ? 'bg-[#1A3D2B] text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Redeem
        </Link>
        <Link
          href="/merchant/history"
          className={`text-sm px-3 py-1.5 rounded-lg font-semibold transition-colors ${
            pathname === '/merchant/history'
              ? 'bg-[#1A3D2B] text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          History
        </Link>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600 ml-2 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
