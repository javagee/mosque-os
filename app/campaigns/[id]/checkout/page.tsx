'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Campaign } from '@/types'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

export default function CheckoutPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const initialQty = parseInt(searchParams.get('qty') ?? '1', 10)

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quantity, setQuantity] = useState(initialQty)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(data => { setCampaign(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  function validate() {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Please enter your name'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleCheckout() {
    if (!validate() || !campaign) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: id, quantity, buyer_name: name, buyer_email: email }),
      })
      const { reference, error } = await res.json()
      if (error) { alert(error); setSubmitting(false); return }
      if (reference) router.push(`/pay/${reference}`)
    } catch {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1A3D2B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Campaign not found.</p>
        <Link href="/campaigns" className="text-[#1A3D2B] font-semibold hover:underline">← Back to campaigns</Link>
      </div>
    )
  }

  const total = campaign.coupon_price * quantity
  const soldOut = campaign.total_coupons != null && campaign.coupons_sold >= campaign.total_coupons
  const remaining = campaign.total_coupons ? campaign.total_coupons - campaign.coupons_sold : null
  const maxQty = remaining ? Math.min(remaining, 10) : 10

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      {/* Nav */}
      <nav className="bg-[#1A3D2B] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-base font-bold text-white tracking-tight">Imara</span>
            <span className="text-[10px] text-green-300/70 font-medium">{process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'}</span>
          </Link>
          <Link href={`/campaigns/${id}`} className="text-sm text-green-200/70 hover:text-white transition-colors">
            ← Back
          </Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#1A3D2B] mb-8">Checkout</h1>

        <div className="space-y-4">
          {/* Campaign summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex gap-4 p-4">
              {campaign.image_url ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={campaign.image_url} alt={campaign.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#1A3D2B] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-2xl font-bold">{campaign.merchant_name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#C9A84C] mb-0.5">{campaign.merchant_name}</p>
                <p className="font-bold text-gray-900 leading-snug">{campaign.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{formatCurrency(campaign.coupon_price, campaign.currency)} per coupon</p>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <label className="text-xs font-semibold text-gray-500 mb-3 block">Number of coupons</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 font-bold text-lg hover:border-[#1A3D2B] hover:text-[#1A3D2B] disabled:opacity-30 transition-colors"
              >
                −
              </button>
              <span className="text-3xl font-bold text-[#1A3D2B] w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                disabled={quantity >= maxQty}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 font-bold text-lg hover:border-[#1A3D2B] hover:text-[#1A3D2B] disabled:opacity-30 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-gray-400 ml-1">
                {quantity > 1 && `× ${formatCurrency(campaign.coupon_price, campaign.currency)}`}
              </span>
            </div>
            {remaining && remaining <= 20 && (
              <p className="text-xs text-amber-600 mt-3 font-semibold">Only {remaining} coupons left</p>
            )}
          </div>

          {/* Buyer info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-700">Your details</h2>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Full name</label>
              <input
                value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
                placeholder="Ahmad bin Abdullah"
                className={`w-full text-sm px-4 py-3 rounded-xl border focus:outline-none focus:border-[#1A3D2B] bg-[#FAFAFA] transition-colors ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                placeholder="ahmad@example.com"
                className={`w-full text-sm px-4 py-3 rounded-xl border focus:outline-none focus:border-[#1A3D2B] bg-[#FAFAFA] transition-colors ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              <p className="text-xs text-gray-400 mt-1.5">Your digital coupons will be sent here</p>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-[#1A3D2B] rounded-2xl p-5 text-white">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-300/70">{quantity} × {formatCurrency(campaign.coupon_price, campaign.currency)}</span>
              <span>{formatCurrency(total, campaign.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-3 mt-3">
              <span>Total</span>
              <span className="text-[#C9A84C]">{formatCurrency(total, campaign.currency)}</span>
            </div>
            <p className="text-xs text-green-300/50 mt-2 text-center">100% of proceeds go to the mosque</p>
          </div>

          {/* Buy button */}
          <button
            onClick={handleCheckout}
            disabled={submitting || soldOut}
            className="w-full py-4 rounded-2xl bg-[#C9A84C] text-[#1A3D2B] font-bold text-base hover:bg-[#D4B865] disabled:opacity-50 transition-colors shadow-sm"
          >
            {submitting
              ? 'Creating order…'
              : soldOut
              ? 'Sold out'
              : `Pay with PayNow · ${formatCurrency(total, campaign.currency)}`}
          </button>

          <p className="text-xs text-center text-gray-400">
            Secured by Stripe · Coupons delivered to your email
          </p>
        </div>
      </div>
    </div>
  )
}
