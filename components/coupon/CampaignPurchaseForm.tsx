'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Campaign } from '@/types'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

export default function CampaignPurchaseForm({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)

  const soldOut = campaign.total_coupons != null && campaign.coupons_sold >= campaign.total_coupons
  const remaining = campaign.total_coupons ? campaign.total_coupons - campaign.coupons_sold : null
  const maxQty = remaining ? Math.min(remaining, 10) : 10

  const total = campaign.coupon_price * quantity
  const unitPrice = formatCurrency(campaign.coupon_price, campaign.currency)
  const totalPrice = formatCurrency(total, campaign.currency)

  return (
    <div className="space-y-4">
      {soldOut ? (
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
          This campaign is sold out. All proceeds have been received by the mosque.
        </div>
      ) : (
        <>
          <div>
            <label className="text-xs font-600 text-gray-500 mb-2 block">Number of coupons</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 font-700 hover:border-[#1A3D2B] hover:text-[#1A3D2B] transition-colors"
              >
                −
              </button>
              <span className="text-2xl font-800 text-[#1A3D2B] w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 font-700 hover:border-[#1A3D2B] hover:text-[#1A3D2B] transition-colors"
              >
                +
              </button>
              <span className="text-sm text-gray-400 ml-1">
                × {unitPrice} {quantity > 1 && `= ${totalPrice}`}
              </span>
            </div>
            {remaining && remaining <= 20 && (
              <p className="text-xs text-amber-600 mt-2 font-600">Only {remaining} left!</p>
            )}
          </div>

          <Button
            onClick={() => router.push(`/campaigns/${campaign.id}/checkout?qty=${quantity}`)}
            className="w-full py-6 rounded-xl text-base font-700 bg-[#1A3D2B] hover:bg-[#2D6A4F] text-white transition-colors"
          >
            Checkout · {totalPrice}
          </Button>

          <p className="text-xs text-center text-gray-400">
            Secured by Stripe · Digital coupons sent to your email
          </p>
        </>
      )}
    </div>
  )
}
