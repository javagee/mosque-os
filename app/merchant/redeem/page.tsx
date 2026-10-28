'use client'

import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Coupon } from '@/types'
import MerchantSidebarLayout from '@/components/merchant/MerchantSidebarLayout'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 0 }).format(amount / 100)
}

// QR Scanner using browser BarcodeDetector API
function QrScanner({ onScan }: { onScan: (token: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const [denied, setDenied] = useState(false)
  const scanLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopScanner = useCallback(() => {
    if (scanLoopRef.current) clearTimeout(scanLoopRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setActive(false)
  }, [])

  const startScanner = useCallback(async () => {
    if (!('BarcodeDetector' in window)) { setUnsupported(true); return }
    setDenied(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0) {
            stopScanner()
            onScan(codes[0].rawValue as string)
            return
          }
        } catch { /* ignore */ }
        scanLoopRef.current = setTimeout(scan, 400)
      }
      scanLoopRef.current = setTimeout(scan, 800)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setDenied(true)
      } else {
        setUnsupported(true)
      }
    }
  }, [onScan, stopScanner])

  useEffect(() => () => stopScanner(), [stopScanner])

  if (unsupported) return null

  return (
    <div className="mb-4">
      {!active ? (
        <div className="space-y-2">
          <button
            onClick={startScanner}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#1A3D2B]/30 text-[#1A3D2B] text-sm font-semibold hover:border-[#1A3D2B]/60 hover:bg-[#1A3D2B]/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan QR Code
          </button>
          {denied && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
              Camera access was denied. Enable it in your browser settings and try again, or enter the token manually below.
            </p>
          )}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <video ref={videoRef} className="w-full h-52 object-cover" playsInline muted />
          {/* Scan frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-36 h-36 border-2 border-[#C9A84C] rounded-xl opacity-80" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-2 text-center">
            <p className="text-white text-xs">Point camera at QR code on coupon</p>
          </div>
          <button
            onClick={stopScanner}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-lg px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl])

  async function fetchCoupon(t: string) {
    const clean = t.trim()
    if (!clean) return
    setLoading(true)
    setError('')
    setCoupon(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/coupons/${clean}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Coupon not found'); setLoading(false); return }
      setCoupon(data)
    } catch { setError('Failed to load coupon') }
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
    } catch { setError('Redemption failed') }
    setLoading(false)
  }

  const campaign = coupon?.campaign
  const isRedeemed = coupon?.status === 'redeemed'
  const isExpired = coupon?.status === 'expired' || (campaign?.redemption_end && new Date() > new Date(campaign.redemption_end))
  const isActive = coupon?.status === 'active' && !isExpired

  return (
    <MerchantSidebarLayout merchantName={merchantName || 'Merchant'}>
      <div className="p-6 max-w-xl space-y-5">

        {/* Header */}
        <div>
          <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">MERCHANT PORTAL</p>
          <h1 className="text-2xl font-bold text-[#1A3D2B]">Redeem Voucher</h1>
          <p className="text-sm text-gray-400 mt-0.5">Scan or enter a customer coupon token</p>
        </div>

        {/* QR Scanner + Token Input */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <QrScanner onScan={(scanned) => { setToken(scanned); fetchCoupon(scanned) }} />

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or enter manually</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={token}
              onChange={e => { setToken(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && fetchCoupon(token)}
              placeholder="Paste coupon token…"
              className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
            />
            <button
              onClick={() => fetchCoupon(token)}
              disabled={!token.trim() || loading}
              className="px-5 py-3 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#2D6A4F] disabled:opacity-40 transition-colors"
            >
              {loading && !coupon ? 'Looking…' : 'Look up'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-semibold">
            {error}
          </div>
        )}

        {/* Success flash */}
        {success && (
          <div className="bg-[#E8F0EC] border border-[#1A3D2B]/20 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1A3D2B] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-[#1A3D2B]">Voucher Redeemed!</p>
            <p className="text-sm text-gray-500 mt-1">Please fulfil the meal / service for the customer now.</p>
            <button
              onClick={() => { setToken(''); setCoupon(null); setSuccess(false); setError('') }}
              className="mt-4 px-5 py-2 rounded-xl border border-[#1A3D2B] text-[#1A3D2B] text-sm font-semibold hover:bg-[#1A3D2B]/5 transition-colors"
            >
              Redeem another
            </button>
          </div>
        )}

        {/* Coupon card */}
        {coupon && !success && (
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
            isRedeemed ? 'border-gray-200' : isExpired ? 'border-red-200' : 'border-[#1A3D2B]'
          }`}>
            {/* Status bar */}
            <div className={`px-5 py-2 text-xs font-bold text-center tracking-widest ${
              isRedeemed ? 'bg-gray-100 text-gray-400' :
              isExpired  ? 'bg-red-50 text-red-600' :
                           'bg-[#E8F0EC] text-[#1A3D2B]'
            }`}>
              {isRedeemed ? 'ALREADY REDEEMED' : isExpired ? 'EXPIRED' : '✓ VALID'}
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-base">{campaign?.name ?? '—'}</p>
                  <p className="text-sm text-gray-500">{campaign?.merchant_name}</p>
                </div>
                {campaign && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#1A3D2B]">{fmt(campaign.coupon_price, campaign.currency)}</p>
                    <p className="text-xs text-gray-400">voucher value</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#F7F6F2] rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Serial No.</p>
                  <p className="font-bold font-mono text-gray-800">{coupon.serial_number}</p>
                </div>
                <div className="bg-[#F7F6F2] rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Buyer</p>
                  <p className="font-semibold text-gray-800 truncate">{coupon.buyer_name}</p>
                </div>
              </div>

              {isRedeemed && coupon.redeemed_at && (
                <p className="text-xs text-gray-400 text-center">
                  Redeemed {new Date(coupon.redeemed_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {/* Redeem action */}
            {isActive && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                <input
                  type="text"
                  value={outlet}
                  onChange={e => setOutlet(e.target.value)}
                  placeholder="Outlet location (optional)"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30"
                />
                <button
                  onClick={handleRedeem}
                  disabled={loading}
                  className="w-full py-4 rounded-xl text-base font-bold bg-[#1A3D2B] hover:bg-[#2D6A4F] text-white disabled:opacity-50 transition-colors shadow-lg shadow-[#1A3D2B]/20"
                >
                  {loading ? 'Processing…' : 'Confirm & Mark Redeemed'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </MerchantSidebarLayout>
  )
}

export default function MerchantRedeemPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F4F3]" />}>
      <RedeemContent />
    </Suspense>
  )
}
