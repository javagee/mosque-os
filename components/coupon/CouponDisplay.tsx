'use client'

import QRCode from 'react-qr-code'
import type { Coupon } from '@/types'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

export default function CouponDisplay({
  coupon,
  redemptionUrl,
}: {
  coupon: Coupon
  redemptionUrl: string
}) {
  const campaign = coupon.campaign
  const isRedeemed = coupon.status === 'redeemed'
  const isExpired =
    coupon.status === 'expired' ||
    (campaign?.redemption_end && new Date() > new Date(campaign.redemption_end))

  return (
    <div className="w-full max-w-sm">
      {/* Redeemed banner */}
      {isRedeemed && (
        <div className="mb-4 bg-gray-100 rounded-xl p-3 text-center">
          <p className="text-sm font-semibold text-gray-500">Coupon redeemed</p>
          {coupon.redeemed_at && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(coupon.redeemed_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
              {coupon.redeemed_outlet ? ` · ${coupon.redeemed_outlet}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Card */}
      <div className={`bg-[#1A3D2B] rounded-2xl overflow-hidden shadow-xl ${isRedeemed || isExpired ? 'opacity-60' : ''}`}>

        {/* Campaign image hero — shown when image_url present */}
        {campaign?.image_url ? (
          <div className="relative h-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.image_url}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
            {/* gradient so text is readable over any photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A3D2B] via-[#1A3D2B]/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
              <p className="text-[10px] text-[#C9A84C] font-semibold tracking-widest mb-1">
                S/N: {coupon.serial_number}
              </p>
              <h1 className="text-xl font-bold text-white leading-tight">{campaign.name}</h1>
              <p className="text-sm text-green-200 mt-0.5">{campaign.merchant_name}</p>
            </div>
          </div>
        ) : (
          /* No image — text header */
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] text-[#C9A84C] font-semibold tracking-widest mb-1">
              S/N: {coupon.serial_number}
            </p>
            <h1 className="text-2xl font-bold text-white leading-tight">
              {campaign?.name ?? 'Fundraising Coupon'}
            </h1>
            <p className="text-sm text-green-200 mt-1">{campaign?.merchant_name}</p>
          </div>
        )}

        {/* Divider */}
        <div className="mx-5 border-t border-white/10 my-1" />

        {/* QR code — centred and large */}
        <div className="px-5 pt-4 pb-3 flex flex-col items-center gap-3">
          <div className={`bg-white p-3 rounded-xl border-2 ${isRedeemed ? 'border-gray-300' : 'border-[#C9A84C]'}`}>
            <QRCode value={redemptionUrl} size={140} level="M" />
          </div>

          {/* Price badge */}
          {campaign && (
            <div className="text-center">
              <p className="text-4xl font-bold text-white tracking-tight">
                {formatCurrency(campaign.coupon_price, campaign.currency)}
              </p>
              <p className="text-xs text-green-300 font-semibold tracking-widest mt-0.5">PER COUPON</p>
            </div>
          )}
        </div>

        {/* Validity */}
        {campaign?.redemption_end && (
          <div className="px-5 pb-4">
            <p className="text-[10px] text-[#C9A84C] font-semibold tracking-widest mb-1">REDEMPTION PERIOD</p>
            <p className="text-sm text-white">
              {campaign.redemption_start
                ? `${new Date(campaign.redemption_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – `
                : ''}
              {new Date(campaign.redemption_end).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#0f2a1e] px-5 py-3 mt-1">
          <p className="text-xs text-green-300 text-center">
            Show this QR code at the outlet · All funds support the mosque
          </p>
        </div>
      </div>

      {isExpired && !isRedeemed && (
        <p className="text-center text-sm text-gray-400 mt-4">
          This coupon has expired. Any unredeemed value benefits the mosque directly.
        </p>
      )}

      {!isRedeemed && !isExpired && (
        <p className="text-center text-xs text-gray-400 mt-4">
          Tap &quot;Share&quot; to save to your phone · Do not screenshot — QR may not scan
        </p>
      )}
    </div>
  )
}
