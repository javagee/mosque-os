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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const [denied, setDenied] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadProcessing, setUploadProcessing] = useState(false)
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
      setActive(true)
      // srcObject is set in the useEffect below once the video element is in the DOM
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setDenied(true)
      } else {
        setUnsupported(true)
      }
    }
  }, [])

  // Wire the stream to the video element after it mounts (active = true triggers the render)
  useEffect(() => {
    if (!active || !videoRef.current || !streamRef.current) return
    const video = videoRef.current
    video.srcObject = streamRef.current
    video.play().catch(() => {})

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
  }, [active, onScan, stopScanner])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploadProcessing(true)
    try {
      if (!('BarcodeDetector' in window)) {
        setUploadError('QR image reading is not supported on this browser. Enter the token manually.')
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })

      // Pass 1: original image
      const bitmap = await createImageBitmap(file)
      let codes = await detector.detect(bitmap)
      bitmap.close()

      // Pass 2: if no QR found, scale to ~1024px wide — helps when screenshot is very large
      // and the QR code is proportionally small (e.g. full phone screenshot of the coupon page)
      if (codes.length === 0) {
        const img = new window.Image()
        const objUrl = URL.createObjectURL(file)
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = objUrl })
        URL.revokeObjectURL(objUrl)

        const TARGET = 1024
        const scale = img.width > TARGET ? TARGET / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const scaled = await createImageBitmap(canvas)
        codes = await detector.detect(scaled)
        scaled.close()
      }

      // Pass 3: crop to centre 60% of the image — catches cases where the QR is
      // embedded in a complex campaign banner with other elements around it
      if (codes.length === 0) {
        const img2 = new window.Image()
        const objUrl2 = URL.createObjectURL(file)
        await new Promise<void>((res, rej) => { img2.onload = () => res(); img2.onerror = rej; img2.src = objUrl2 })
        URL.revokeObjectURL(objUrl2)

        const cropX = img2.width * 0.2
        const cropY = img2.height * 0.2
        const cropW = img2.width * 0.6
        const cropH = img2.height * 0.6
        const canvas2 = document.createElement('canvas')
        canvas2.width = cropW
        canvas2.height = cropH
        canvas2.getContext('2d')!.drawImage(img2, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
        const cropped = await createImageBitmap(canvas2)
        codes = await detector.detect(cropped)
        cropped.close()
      }

      if (codes.length === 0) {
        setUploadError('No QR code found. Try cropping the image to show just the QR code, or use the live camera scanner instead.')
        return
      }
      onScan(codes[0].rawValue as string)
    } catch {
      setUploadError('Could not read the image. Please try a clearer photo.')
    } finally {
      setUploadProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => () => stopScanner(), [stopScanner])

  if (unsupported) return null

  return (
    <div className="mb-4">
      {!active ? (
        <div className="space-y-2">
          {/* Live camera scan */}
          <button
            onClick={startScanner}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#1A3D2B]/30 text-[#1A3D2B] text-sm font-semibold hover:border-[#1A3D2B]/60 hover:bg-[#1A3D2B]/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan QR Code
          </button>

          {/* Upload from gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={() => { setUploadError(''); fileInputRef.current?.click() }}
            disabled={uploadProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {uploadProcessing ? 'Reading QR…' : 'Upload QR Image from Gallery'}
          </button>

          {uploadError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
              {uploadError}
            </p>
          )}
          {denied && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
              Camera access was denied. Enable it in your browser settings, or upload a QR image instead.
            </p>
          )}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <video ref={videoRef} className="w-full h-52 object-cover" playsInline autoPlay muted />
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
  const [recentRedemptions, setRecentRedemptions] = useState<Coupon[]>([])
  const [resetCountdown, setResetCountdown] = useState(0)

  const loadRecentRedemptions = useCallback(async () => {
    try {
      const res = await fetch('/api/merchant/history')
      if (res.ok) {
        const data: Coupon[] = await res.json()
        setRecentRedemptions(data.slice(0, 5))
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetch('/api/merchant/me').then(r => r.json()).then(d => setMerchantName(d.merchantName ?? '')).catch(() => {})
    loadRecentRedemptions()
    // Poll every 15 s so any device picks up redemptions made on another device
    const poll = setInterval(loadRecentRedemptions, 15_000)
    return () => clearInterval(poll)
  }, [loadRecentRedemptions])

  useEffect(() => {
    if (tokenFromUrl) fetchCoupon(tokenFromUrl)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl])

  // Countdown auto-reset after successful redemption — stays on redeem page for next customer
  useEffect(() => {
    if (resetCountdown <= 0) return
    if (resetCountdown === 1) {
      const t = setTimeout(() => {
        setToken(''); setCoupon(null); setSuccess(false); setError(''); setResetCountdown(0)
      }, 1000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setResetCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resetCountdown])

  async function fetchCoupon(t: string) {
    let clean = t.trim()
    // Accept full coupon URLs — check ?token= query param first, then last path segment
    if (clean.startsWith('http')) {
      try {
        const url = new URL(clean)
        const qp = url.searchParams.get('token')
        clean = qp ?? url.pathname.split('/').filter(Boolean).pop() ?? clean
      } catch { /* use as-is */ }
    }
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
      if (!res.ok) {
        setError(data.error ?? 'Redemption failed')
        // Auto-flip card to ALREADY REDEEMED when the coupon was concurrently redeemed
        if (res.status === 409 && data.coupon) setCoupon(data.coupon)
        setLoading(false)
        return
      }
      setSuccess(true)
      setCoupon(data.coupon)
      loadRecentRedemptions()
      // Auto-reset to blank form after 4 s — keeps the stall moving for the next customer
      setResetCountdown(4)
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

        {/* Recent redemptions — above the form so it's immediately visible on any device */}
        {recentRedemptions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">Recent redemptions</p>
              <a href="/merchant/history" className="text-xs text-[#1A3D2B] font-semibold hover:underline">View all →</a>
            </div>
            <div className="divide-y divide-gray-50">
              {recentRedemptions.map(r => {
                const price = r.campaign?.coupon_price ?? 0
                const cur = r.campaign?.currency ?? 'sgd'
                const share = Math.floor(price / 2)
                return (
                  <div key={r.token} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-gray-400">{r.serial_number}</span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Redeemed</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 truncate">{r.campaign?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{r.buyer_name}
                        {r.redeemed_at && <> · {new Date(r.redeemed_at).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}</>}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">Your share</p>
                      <p className="font-bold text-[#1A3D2B] text-sm">{fmt(share, cur)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
            {resetCountdown > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Ready for next customer in {resetCountdown}s…
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => { setResetCountdown(0); setToken(''); setCoupon(null); setSuccess(false); setError('') }}
                className="px-5 py-2 rounded-xl border border-[#1A3D2B] text-[#1A3D2B] text-sm font-semibold hover:bg-[#1A3D2B]/5 transition-colors"
              >
                Next customer
              </button>
              <a
                href="/merchant/history"
                className="px-5 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
              >
                View history →
              </a>
            </div>
          </div>
        )}

        {/* Coupon card */}
        {coupon && !success && (
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden relative ${
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

            {/* CDC-style REDEEMED stamp */}
            {isRedeemed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-[3px] border-red-500 text-red-500 text-2xl font-black px-6 py-2 rounded-lg rotate-[-18deg] opacity-55 tracking-widest select-none">
                  REDEEMED
                </div>
              </div>
            )}

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
