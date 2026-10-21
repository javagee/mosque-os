'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Order } from '@/types'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

function useCountdown(createdAt: string, minutes = 15) {
  const expiry = new Date(createdAt).getTime() + minutes * 60 * 1000
  const [remaining, setRemaining] = useState(Math.max(0, expiry - Date.now()))

  useEffect(() => {
    const t = setInterval(() => setRemaining(Math.max(0, expiry - Date.now())), 1000)
    return () => clearInterval(t)
  }, [expiry])

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return { remaining, mins, secs, expired: remaining === 0 }
}

export default function PayNowPayment({
  order,
  qrImageUrl,
  uen,
}: {
  order: Order
  qrImageUrl: string | null
  uen: string | null
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const { mins, secs, expired } = useCountdown(order.created_at)

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  async function handleIPaid() {
    setConfirming(true)
    try {
      const res = await fetch(`/api/orders/${order.reference}/confirm`, { method: 'POST' })
      if (res.ok) {
        router.push(`/donate/success?type=coupon&ref=${order.reference}`)
      } else {
        const { error } = await res.json()
        alert(error ?? 'Something went wrong. Please contact the mosque.')
        setConfirming(false)
      }
    } catch {
      alert('Network error. Please try again.')
      setConfirming(false)
    }
  }

  const amountStr = formatCurrency(order.total, order.currency)

  return (
    <div className="space-y-4">

      {/* Timer */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold ${expired ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
        <span>{expired ? 'Order expired — please start again' : 'Complete payment before'}</span>
        {!expired && (
          <span className="font-mono text-base">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Amount + reference — copy buttons */}
      <div className="bg-[#1A3D2B] rounded-2xl p-5 text-white">
        <p className="text-green-300/60 text-xs font-semibold mb-1">Pay exactly</p>
        <p className="text-4xl font-bold text-[#C9A84C] mb-4">{amountStr}</p>
        <div className="border-t border-white/10 pt-4 space-y-3">
          {uen && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-300/60">PayNow UEN</p>
                <p className="font-mono font-bold text-white">{uen}</p>
              </div>
              <button
                onClick={() => copyToClipboard(uen, 'uen')}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                {copied === 'uen' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-300/60">Payment reference</p>
              <p className="font-mono font-bold text-white text-lg tracking-wider">{order.reference}</p>
            </div>
            <button
              onClick={() => copyToClipboard(order.reference, 'ref')}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {copied === 'ref' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* QR code */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {qrImageUrl ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Scan to pay</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="PayNow QR code"
              className="w-52 h-52 object-contain rounded-xl border border-gray-100"
            />
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Scan with DBS PayLah!, OCBC, UOB, or any Singapore banking app.<br />
              <strong className="text-gray-600">Enter {order.reference} as the payment reference.</strong>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-[#1A3D2B]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#1A3D2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 mb-1">Open your banking app</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Go to PayNow → Transfer → search UEN<br />
                {uen ? <><strong className="text-gray-700">{uen}</strong> · </> : ''}Enter <strong className="text-gray-700">{order.reference}</strong> as reference
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step-by-step instructions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 mb-3">How to pay via PayNow</p>
        <ol className="space-y-2.5">
          {[
            `Open your bank app (DBS, OCBC, UOB, PayLah, etc.)`,
            `Go to PayNow and select "Transfer to UEN"${uen ? ` · enter ${uen}` : ''}`,
            `Enter amount: ${amountStr}`,
            `Enter reference: ${order.reference} (important!)`,
            `Confirm and complete the transfer`,
            `Come back here and tap "I've completed payment"`,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-[#1A3D2B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* I've paid button */}
      <button
        onClick={handleIPaid}
        disabled={confirming || expired}
        className="w-full py-4 rounded-2xl bg-[#C9A84C] text-[#1A3D2B] font-bold text-base hover:bg-[#D4B865] disabled:opacity-50 transition-colors shadow-sm"
      >
        {confirming ? 'Confirming…' : "I've completed payment"}
      </button>

      <p className="text-xs text-center text-gray-400 leading-relaxed">
        Your voucher will be emailed to <strong>{order.buyer_email}</strong> immediately.<br />
        Payment is verified by the mosque within 24 hours.
      </p>
    </div>
  )
}
