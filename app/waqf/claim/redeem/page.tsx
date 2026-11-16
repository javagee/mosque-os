'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import type { WaqfClaim } from '@/types'

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
  } catch {
    return `${currency} ${(amount / 100).toFixed(2)}`
  }
}

function RedeemForm() {
  const searchParams = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [claim, setClaim] = useState<WaqfClaim | null>(null)
  const [step, setStep] = useState<'lookup' | 'confirm' | 'done'>(searchParams.get('token') ? 'lookup' : 'lookup')
  const [looking, setLooking] = useState(false)
  const [error, setError] = useState('')
  const [outlet, setOutlet] = useState('')
  const [invoiceRef, setInvoiceRef] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Auto-lookup if token in URL
  useEffect(() => {
    const t = searchParams.get('token')
    if (t) { setToken(t); lookupToken(t) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function lookupToken(t?: string) {
    const tok = (t ?? token).trim().toUpperCase()
    if (!tok) return
    setLooking(true)
    setError('')
    const res = await fetch(`/api/waqf/claims/${tok}`)
    if (!res.ok) {
      setError('Claim not found. Check the token and try again.')
      setLooking(false)
      return
    }
    const data: WaqfClaim = await res.json()
    setClaim(data)
    setStep('confirm')
    setLooking(false)
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    if (!claim || !outlet.trim()) return
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/waqf/claims/${claim.id}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redeemed_by: outlet, invoice_ref: invoiceRef }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Redemption failed')
      setSubmitting(false)
      return
    }
    const updated: WaqfClaim = await res.json()
    setClaim(updated)
    setStep('done')
    setSubmitting(false)
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="text-center mb-6">
        <p className="arabic text-[#C9A84C] text-2xl mb-1">وَقْف</p>
        <h1 className="text-2xl font-bold text-[#1A3D2B]">Waqf Claim Redemption</h1>
        <p className="text-sm text-gray-500 mt-1">Merchant / Supplier Portal</p>
      </div>

      {step === 'lookup' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Enter Claim Token</h2>
          <div className="flex gap-2">
            <input
              value={token}
              onChange={e => setToken(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && lookupToken()}
              placeholder="CLM-XXXXXX"
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 uppercase"
            />
            <button
              onClick={() => lookupToken()}
              disabled={looking || !token.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] disabled:opacity-50 transition-colors"
            >
              {looking ? '…' : 'Look up'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-gray-400">The token is on the beneficiary&apos;s QR voucher — format CLM-XXXXXX</p>
        </div>
      )}

      {step === 'confirm' && claim && (
        <form onSubmit={handleRedeem} className="space-y-4">
          {/* Claim details */}
          <div className="bg-[#1A3D2B] rounded-2xl p-5 text-white">
            <p className="text-[10px] text-[#C9A84C] font-semibold tracking-widest mb-2">{claim.id}</p>
            <h2 className="font-bold text-lg">{claim.asset_name}</h2>
            {claim.beneficiary_name && <p className="text-green-200/70 text-sm mt-0.5">Beneficiary: {claim.beneficiary_name}</p>}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40">Claim Amount</p>
                <p className="text-3xl font-bold text-[#C9A84C]">{fmt(claim.amount, claim.currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40">Purpose</p>
                <p className="text-sm text-white/80">{claim.purpose}</p>
              </div>
            </div>
            {claim.status !== 'pending' && (
              <p className="mt-3 text-sm font-semibold text-amber-300">This claim has already been {claim.status}.</p>
            )}
          </div>

          {claim.status === 'pending' ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Confirm Redemption</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Outlet / Business Name *</label>
                <input
                  required
                  value={outlet}
                  onChange={e => setOutlet(e.target.value)}
                  placeholder="e.g. Al-Barakah Grocery, Madinah Pharmacy"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Invoice / Receipt Reference</label>
                <input
                  value={invoiceRef}
                  onChange={e => setInvoiceRef(e.target.value)}
                  placeholder="e.g. INV-2024-0042 (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || !outlet.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Redeeming…' : 'Confirm Redemption'}
                </button>
                <button
                  type="button"
                  onClick={() => { setClaim(null); setStep('lookup'); setToken('') }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setClaim(null); setStep('lookup'); setToken('') }}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition-colors"
            >
              Look up another claim
            </button>
          )}
        </form>
      )}

      {step === 'done' && claim && (
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-bold text-green-800 text-lg">Claim Redeemed</h2>
          <p className="text-sm text-gray-600">{fmt(claim.amount, claim.currency)} claim for {claim.purpose} has been recorded.</p>
          {claim.invoice_ref && <p className="text-xs font-mono text-gray-400">Invoice ref: {claim.invoice_ref}</p>}
          <p className="text-xs text-gray-400">The institution will process the bank settlement and notify you of the settlement reference.</p>
          <button
            onClick={() => { setClaim(null); setStep('lookup'); setToken('') }}
            className="mt-2 px-6 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors"
          >
            Redeem another claim
          </button>
        </div>
      )}
    </div>
  )
}

export default function WaqfClaimRedeemPage() {
  return (
    <main className="min-h-screen bg-[#F0F4F3] flex items-center justify-center px-4 py-12">
      <Suspense>
        <RedeemForm />
      </Suspense>
    </main>
  )
}
