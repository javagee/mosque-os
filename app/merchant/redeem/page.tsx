'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Coupon } from '@/types'
import { Suspense } from 'react'
import MerchantNav from '@/components/merchant/MerchantNav'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

function RedeemContent() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get('token') ?? ''

  const [token, setToken] = useState(tokenFromUrl)
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [error, setError] = useState('')
  const [outlet, setOutlet] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [merchantName, setMerchantName] = useState('')

  useEffect(() => {
    fetch('/api/merchant/me').then(r => r.json()).then(d => setMerchantName(d.merchantName ?? '')).catch(() => {})
  }, [])

  useEffect(() => {
    if (tokenFromUrl) fetchCoupon(tokenFromUrl)
  }, [tokenFromUrl])

  async function fetchCoupon(t: string) {
    setLoading(true)
    setError('')
    setCoupon(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/coupons/${t}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Coupon not found'); setLoading(false); return }
      setCoupon(data)
    } catch {
      setError('Failed to load coupon')
    }
    setLoading(false)
  }

  async function handleRedeem() {
    if (!coupon) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/coupons/${coupon.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outlet: outlet || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Redemption failed'); setLoading(false); return }
      setSuccess(true)
      setCoupon(data.coupon)
    } catch {
      setError('Redemption failed')
    }
    setLoading(false)
  }

  const campaign = coupon?.campaign
  const isRedeemed = coupon?.status === 'redeemed'
  const isExpired =
    coupon?.status === 'expired' ||
    (campaign?.redemption_end && new Date() > new Date(campaign.redemption_end))
  const isActive = coupon?.status === 'active' && !isExpired

  return (
    <div className="max-w-sm w-full mx-auto">
      <MerchantNav merchantName={merchantName} />
      <h1 className="text-2xl font-bold text-[#1A3D2B] mb-6">Coupon redemption</h1>

      {/* Token lookup (when no URL param) */}
      {!tokenFromUrl && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <label className="text-xs font-600 text-gray-500 mb-2 block">Enter coupon token</label>
          <div className="flex gap-2">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste coupon token…"
              className="rounded-xl border-gray-200 font-mono text-sm"
            />
            <Button
              onClick={() => fetchCoupon(token)}
              disabled={!token || loading}
              className="rounded-xl bg-[#1A3D2B] hover:bg-[#2D6A4F] text-white shrink-0"
            >
              Look up
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !coupon && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          Checking coupon…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-600 mb-4">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-[#E8F0EC] border border-[#1A3D2B]/20 rounded-2xl p-5 text-center mb-4">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-lg font-800 text-[#1A3D2B]">Coupon redeemed!</p>
          <p className="text-sm text-gray-500 mt-1">Please fulfil the meal/service now.</p>
        </div>
      )}

      {/* Coupon details */}
      {coupon && (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isRedeemed ? 'border-gray-200 opacity-70' : isExpired ? 'border-red-200' : 'border-[#1A3D2B]'}`}>
          {/* Status bar */}
          <div className={`px-5 py-2 text-xs font-700 text-center ${
            success || isRedeemed ? 'bg-gray-100 text-gray-500' :
            isExpired ? 'bg-red-50 text-red-600' :
            'bg-[#E8F0EC] text-[#1A3D2B]'
          }`}>
            {success || isRedeemed ? 'REDEEMED' : isExpired ? 'EXPIRED' : 'VALID'}
          </div>

          <div className="p-5 space-y-3">
            <div>
              <p className="text-xs text-gray-400 font-600">Campaign</p>
              <p className="font-700 text-gray-800">{campaign?.name ?? '—'}</p>
              <p className="text-sm text-gray-500">{campaign?.merchant_name}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-gray-400 font-600">Serial No.</p>
                <p className="font-700 text-gray-800 font-mono">{coupon.serial_number}</p>
              </div>
              {campaign && (
                <div>
                  <p className="text-xs text-gray-400 font-600">Value</p>
                  <p className="font-700 text-[#1A3D2B]">
                    {formatCurrency(campaign.coupon_price, campaign.currency)}
                  </p>
                </div>
              )}
            </div>
            {campaign?.redemption_end && (
              <div>
                <p className="text-xs text-gray-400 font-600">Valid until</p>
                <p className="text-sm text-gray-700">
                  {new Date(campaign.redemption_end).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            )}
            {isRedeemed && coupon.redeemed_at && (
              <div>
                <p className="text-xs text-gray-400 font-600">Redeemed on</p>
                <p className="text-sm text-gray-700">
                  {new Date(coupon.redeemed_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Redeem action */}
          {isActive && !success && (
            <div className="px-5 pb-5 space-y-3">
              <div>
                <label className="text-xs font-600 text-gray-500 mb-1.5 block">
                  Outlet location (optional)
                </label>
                <Input
                  value={outlet}
                  onChange={(e) => setOutlet(e.target.value)}
                  placeholder="e.g. City Plaza outlet"
                  className="rounded-xl border-gray-200"
                />
              </div>
              <Button
                onClick={handleRedeem}
                disabled={loading}
                className="w-full py-5 rounded-xl text-base font-700 bg-[#1A3D2B] hover:bg-[#2D6A4F] text-white"
              >
                {loading ? 'Processing…' : 'Confirm & Mark Redeemed'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MerchantRedeemPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-gray-400 text-sm">Loading…</div>}>
        <RedeemContent />
      </Suspense>
    </main>
  )
}
