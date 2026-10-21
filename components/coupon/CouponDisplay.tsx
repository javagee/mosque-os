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
      {/* Status badge */}
      {isRedeemed && (
        <div className="mb-4 bg-gray-100 rounded-xl p-3 text-center">
          <p className="text-sm font-700 text-gray-500">Coupon redeemed</p>
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

      {/* Coupon card */}
      <div
        className={`bg-[#1A3D2B] rounded-2xl overflow-hidden shadow-xl ${isRedeemed || isExpired ? 'opacity-60' : ''}`}
      >
        {/* Header */}
        <div className="p-5 pb-4">
          <p className="text-xs text-green-300 font-600 tracking-wide mb-1">S/N: {coupon.serial_number}</p>
          <h1 className="text-2xl font-800 text-white leading-tight">
            {campaign?.name ?? 'Fundraising Coupon'}
          </h1>
          <p className="text-sm text-green-200 mt-1">{campaign?.merchant_name}</p>
        </div>

        {/* Price + QR */}
        <div className="bg-white mx-4 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              {campaign && (
                <p className="text-4xl font-800 text-[#1A3D2B]">
                  {formatCurrency(campaign.coupon_price, campaign.currency)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1 font-600">PER COUPON</p>
            </div>
            <div
              className={`p-2 border-2 rounded-xl ${
                isRedeemed ? 'border-gray-300' : 'border-[#1A3D2B]'
              }`}
            >
              <QRCode value={redemptionUrl} size={96} level="M" />
            </div>
          </div>
        </div>

        {/* Validity */}
        {campaign?.redemption_end && (
          <div className="px-5 pb-4">
            <p className="text-xs text-green-300 font-600 mb-1">Redemption period</p>
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
        <div className="bg-[#0f2a1e] px-5 py-4">
          <p className="text-xs text-green-300 text-center">
            Show this QR code at any participating outlet · All funds support the mosque
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
