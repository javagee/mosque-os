'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const PRIMARY_LINKS = [
  { href: '/display',      label: 'Prayer Times' },
  { href: '/campaigns',    label: 'Campaigns' },
  { href: '/waqf',         label: 'Waqf' },
  { href: '/qurbani',      label: 'Qurbani' },
]

const COMMUNITY_LINKS = [
  { href: '/ramadan',   label: 'Ramadan' },
  { href: '/jemaah',    label: 'Jemaah' },
  { href: '/events',    label: 'Events' },
  { href: '/facilities',label: 'Facilities' },
]

const UTILITY_LINKS = [
  { href: '/orders',         label: 'Track Order' },
  { href: '/merchant/login', label: 'Merchant' },
  { href: '/admin/login',    label: 'Admin' },
]

export default function Nav({ mosqueName }: { mosqueName: string }) {
  const [open, setOpen] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const pathname = usePathname()

  const linkCls = 'px-3 py-2 rounded-lg text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors'
  const activeLinkCls = 'px-3 py-2 rounded-lg text-sm text-white bg-white/10'

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="sticky top-0 z-40">
      <nav className="bg-[#1A3D2B]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none flex-shrink-0" onClick={() => setOpen(false)}>
            <span className="text-base font-bold text-white tracking-tight">Imara</span>
            <span className="text-[10px] text-green-300/70 font-medium truncate max-w-[140px]">{mosqueName}</span>
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <div className="hidden md:flex items-center gap-0.5">
            {PRIMARY_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={isActive(href) ? activeLinkCls : linkCls}>{label}</Link>
            ))}

            {/* Community dropdown */}
            <div className="relative group">
              <button className={`${linkCls} flex items-center gap-1`}>
                Community
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div className="absolute left-0 top-full pt-1 hidden group-hover:block z-50">
                <div className="bg-[#1A3D2B] border border-white/10 rounded-xl shadow-xl py-1 min-w-[140px]">
                  {COMMUNITY_LINKS.map(({ href, label }) => (
                    <Link key={href} href={href} className="block px-4 py-2 text-sm text-green-200/70 hover:text-white hover:bg-white/10 transition-colors">{label}</Link>
                  ))}
                </div>
              </div>
            </div>

            {UTILITY_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={isActive(href) ? activeLinkCls : linkCls}>{label}</Link>
            ))}

            <Link href="/donate" className="ml-2 px-4 py-2 rounded-lg bg-[#C9A84C] text-[#1A3D2B] text-sm font-bold hover:bg-[#D4B865] transition-colors flex-shrink-0">
              Donate
            </Link>
          </div>

          {/* Mobile right side: Donate CTA + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/donate" className="px-3 py-1.5 rounded-lg bg-[#C9A84C] text-[#1A3D2B] text-sm font-bold hover:bg-[#D4B865] transition-colors">
              Donate
            </Link>
            <button
              onClick={() => setOpen(v => !v)}
              className="p-2 rounded-lg text-white/70 hover:bg-white/10 active:bg-white/20 transition-colors"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-white/10 px-4 pb-4 pt-2 space-y-1">
            {PRIMARY_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`block py-2.5 px-3 rounded-xl text-sm ${isActive(href) ? 'text-white bg-white/10 font-semibold' : 'text-green-200/70 hover:text-white hover:bg-white/8'} transition-colors`}>
                {label}
              </Link>
            ))}

            {/* Community expandable */}
            <button
              onClick={() => setCommunityOpen(v => !v)}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm text-green-200/70 hover:text-white hover:bg-white/8 transition-colors"
            >
              <span>Community</span>
              <svg className={`w-4 h-4 transition-transform ${communityOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {communityOpen && (
              <div className="pl-3 space-y-0.5">
                {COMMUNITY_LINKS.map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className="block py-2 px-3 rounded-xl text-sm text-green-200/60 hover:text-white hover:bg-white/8 transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            )}

            <div className="border-t border-white/10 my-2"/>

            {UTILITY_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`block py-2.5 px-3 rounded-xl text-sm ${isActive(href) ? 'text-white bg-white/10 font-semibold' : 'text-green-200/50 hover:text-white hover:bg-white/8'} transition-colors`}>
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  )
}
