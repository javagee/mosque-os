'use client'

import { useState } from 'react'
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

export default function CampaignCard({ campaign, compact = false }: { campaign: Campaign; compact?: boolean }) {
  const [lightbox, setLightbox] = useState(false)

  const soldOut = campaign.total_coupons != null && campaign.coupons_sold >= campaign.total_coupons
  const progress = campaign.total_coupons
    ? Math.min(100, Math.round((campaign.coupons_sold / campaign.total_coupons) * 100))
    : null
  const remaining = campaign.total_coupons ? campaign.total_coupons - campaign.coupons_sold : null

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-[#1A3D2B]/20 transition-all duration-200">

        {/* Image — click opens lightbox */}
        {campaign.image_url ? (
          <button
            type="button"
            className={`relative w-full block group/img overflow-hidden ${compact ? 'h-36' : 'h-56'}`}
            onClick={() => setLightbox(true)}
            aria-label="View full voucher"
          >
            <Image
              src={campaign.image_url}
              alt={campaign.name}
              fill
              className="object-cover transition-transform duration-300 group-hover/img:scale-[1.02]"
            />
            {/* Price badge */}
            <div className={`absolute top-2 right-2 bg-[#1A3D2B] text-white rounded-xl shadow-lg flex flex-col items-center leading-none ${compact ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
              {!compact && <span className="text-xs text-green-300 font-medium">per coupon</span>}
              <span className={`font-bold tabular-nums ${compact ? 'text-sm' : 'text-xl'}`}>
                {formatCurrency(campaign.coupon_price, campaign.currency)}
              </span>
            </div>
            {/* Zoom hint on hover */}
            {!compact && (
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5 shadow-md">
                  <svg className="w-5 h-5 text-[#1A3D2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            )}
            {soldOut && (
              <span className="absolute top-2 left-2 text-xs font-semibold text-white bg-gray-800/80 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                Sold out
              </span>
            )}
          </button>
        ) : (
          <div className={`w-full bg-gradient-to-br from-[#1A3D2B] to-[#2D6A4F] flex items-center justify-between px-4 relative ${compact ? 'h-28' : 'h-40 px-6'}`}>
            <span className={`font-bold text-white/10 select-none ${compact ? 'text-2xl' : 'text-5xl'}`}>{campaign.merchant_name}</span>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-right">
              {!compact && <p className="text-xs text-green-300 font-medium">per coupon</p>}
              <p className={`font-bold text-white ${compact ? 'text-base' : 'text-2xl'}`}>
                {formatCurrency(campaign.coupon_price, campaign.currency)}
              </p>
            </div>
          </div>
        )}

        {/* Card body — navigates to campaign page */}
        <Link href={`/campaigns/${campaign.id}`} className="block">
          <div className={compact ? 'p-3' : 'p-5'}>
            <div className={`flex items-start justify-between gap-3 ${compact ? 'mb-2' : 'mb-3'}`}>
              <div className="flex-1 min-w-0">
                <span className={`inline-block font-semibold text-[#C9A84C] bg-amber-50 border border-amber-100 rounded-md ${compact ? 'text-[10px] px-1.5 py-0.5 mb-1' : 'text-xs px-2 py-0.5 mb-1.5'}`}>
                  {campaign.merchant_name}
                </span>
                <h2 className={`font-bold text-gray-900 leading-snug ${compact ? 'text-sm' : 'text-lg'}`}>{campaign.name}</h2>
                {!compact && campaign.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{campaign.description}</p>
                )}
              </div>
            </div>

            {!compact && campaign.redemption_end && (
              <p className="text-xs text-gray-400 mb-3">
                Valid until{' '}
                <span className="text-gray-600 font-medium">
                  {new Date(campaign.redemption_end).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </p>
            )}

            {progress !== null && (
              <div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-[#1A3D2B] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    <strong className="text-[#1A3D2B] font-semibold">{campaign.coupons_sold}</strong> sold
                  </span>
                  {remaining !== null && remaining > 0 && (
                    <span className="text-emerald-600 font-medium">{remaining} left</span>
                  )}
                  {soldOut && <span className="text-gray-400">All sold</span>}
                </div>
              </div>
            )}

            {!compact && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">Tap to buy a coupon</span>
                <svg className="w-4 h-4 text-[#1A3D2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Lightbox */}
      {lightbox && campaign.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors"
            onClick={() => setLightbox(false)}
          >
            ✕ Close
          </button>
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={campaign.image_url}
              alt={campaign.name}
              width={1200}
              height={600}
              className="w-full h-auto object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-center text-white/50 text-sm mt-3">{campaign.name} · {campaign.merchant_name}</p>
          </div>
        </div>
      )}
    </>
  )
}
