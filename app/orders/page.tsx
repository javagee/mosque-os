'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/layout/Nav'

export default function OrderLookupPage() {
  const router = useRouter()
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const referenceRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!reference.trim()) {
      referenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      referenceRef.current?.focus()
      return
    }
    if (!email.trim()) {
      emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      emailRef.current?.focus()
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Order not found')
        setLoading(false)
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
        return
      }
      router.push(`/orders/${data.reference}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Nav mosqueName={mosqueName} />

      {/* Hero band */}
      <div className="bg-[#1A3D2B] pt-14 pb-28">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Track your order</h1>
          <p className="text-green-200/70 mt-3 text-sm leading-relaxed">
            Enter your order reference and the email used at checkout to check your voucher status.
          </p>
        </div>
      </div>

      {/* Lookup card */}
      <div className="max-w-md mx-auto px-6 -mt-12 pb-16 space-y-4">
        <form onSubmit={handleLookup} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Order Reference
            </label>
            <input
              ref={referenceRef}
              type="text"
              value={reference}
              onChange={e => { setReference(e.target.value.toUpperCase()); setError('') }}
              placeholder="IMA-XXXXXX"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-lg font-bold text-[#1A3D2B] tracking-widest placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B] uppercase"
              autoComplete="off"
            />
            <p className="text-xs text-gray-400 mt-1">Found on your payment confirmation page (e.g. IMA-Y5MNEA)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email address
            </label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
              autoComplete="email"
            />
            <p className="text-xs text-gray-400 mt-1">Must match the email you used when purchasing</p>
          </div>

          {error && (
            <div ref={errorRef} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!reference.trim() || !email.trim() || loading}
            className="w-full py-3.5 rounded-xl bg-[#1A3D2B] text-white font-bold text-sm hover:bg-[#2D6A4F] disabled:opacity-40 transition-colors shadow-lg shadow-[#1A3D2B]/20"
          >
            {loading ? 'Looking up…' : 'Check order status →'}
          </button>
        </form>

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">How it works</h3>
          <div className="space-y-3">
            {[
              { icon: '💳', text: 'Pay via PayNow and click "I\'ve completed payment"' },
              { icon: '⏳', text: 'Mosque team verifies your transfer against the bank statement' },
              { icon: '📧', text: 'E-coupon is emailed to you automatically once verified' },
              { icon: '🎫', text: 'Show the QR code at the merchant outlet to redeem' },
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-start gap-3">
                <span className="text-base flex-shrink-0">{icon}</span>
                <span className="text-sm text-gray-500">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <a href="/campaigns" className="text-sm text-[#1A3D2B] font-semibold hover:underline">
            ← Browse more campaigns
          </a>
        </div>
      </div>
    </div>
  )
}
