'use client'

import QRCode from 'react-qr-code'
import type { WaqfClaim } from '@/types'

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
  } catch {
    return `${currency} ${(amount / 100).toFixed(2)}`
  }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Valid — Awaiting Redemption', color: 'text-green-700' },
  redeemed: { label: 'Redeemed',                    color: 'text-gray-500' },
  settled:  { label: 'Settled',                     color: 'text-blue-600' },
  expired:  { label: 'Expired',                     color: 'text-red-500' },
}

export default function WaqfClaimDisplay({ claim, claimUrl }: { claim: WaqfClaim; claimUrl: string }) {
  const s = STATUS_LABEL[claim.status] ?? STATUS_LABEL.pending
  const isActive = claim.status === 'pending'

  return (
    <div className="w-full max-w-sm space-y-4">

      {/* Status banner (non-pending) */}
      {!isActive && (
        <div className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${
          claim.status === 'redeemed' || claim.status === 'settled' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'
        }`}>
          {s.label}
          {claim.redeemed_at && (
            <p className="text-xs font-normal text-gray-400 mt-0.5">
              {new Date(claim.redeemed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {claim.redeemed_by ? ` · ${claim.redeemed_by}` : ''}
            </p>
          )}
          {claim.settled_at && claim.settlement_ref && (
            <p className="text-xs font-mono text-gray-400 mt-0.5">Settlement ref: {claim.settlement_ref}</p>
          )}
        </div>
      )}

      {/* Main card */}
      <div className={`bg-[#1A3D2B] rounded-2xl overflow-hidden shadow-xl ${!isActive ? 'opacity-60' : ''}`}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-[10px] text-[#C9A84C] font-semibold tracking-widest mb-1">WAQF CLAIM · {claim.id}</p>
          <h1 className="text-xl font-bold text-white leading-tight">{claim.asset_name}</h1>
          {claim.beneficiary_name && (
            <p className="text-sm text-green-200/70 mt-0.5">For: {claim.beneficiary_name}</p>
          )}
        </div>

        <div className="mx-5 border-t border-white/10" />

        {/* QR */}
        <div className="px-5 py-4 flex flex-col items-center gap-3">
          <div className={`bg-white p-3 rounded-xl border-2 ${isActive ? 'border-[#C9A84C]' : 'border-gray-300'}`}>
            <QRCode value={claimUrl} size={140} level="M" />
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-white tracking-tight">{fmt(claim.amount, claim.currency)}</p>
            <p className="text-xs text-green-300 font-semibold tracking-widest mt-0.5">CLAIM AMOUNT</p>
          </div>
        </div>

        {/* Purpose */}
        <div className="px-5 pb-3">
          <p className="text-[10px] text-[#C9A84C] font-semibold tracking-widest mb-1">PURPOSE</p>
          <p className="text-sm text-white/80">{claim.purpose}</p>
        </div>

        {claim.jurisdiction_code && (
          <div className="px-5 pb-3">
            <span className="px-2 py-0.5 rounded bg-white/10 text-white/50 text-[10px] font-mono">{claim.jurisdiction_code}</span>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#0f2a1e] px-5 py-3 mt-1">
          <p className="text-xs text-green-300/70 text-center">
            Issued {new Date(claim.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · Waqf principal is preserved
          </p>
        </div>
      </div>

      {/* Merchant shortcut */}
      {isActive && (
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-600">Are you a merchant or supplier?</p>
            <p className="text-xs text-gray-400 mt-0.5">Tap to open the claim redemption portal</p>
          </div>
          <a
            href={`/waqf/claim/redeem?token=${claim.id}`}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-xs font-semibold hover:bg-[#143020] transition-colors whitespace-nowrap"
          >
            Redeem →
          </a>
        </div>
      )}

      {isActive && (
        <p className="text-center text-xs text-gray-400">
          Show this QR at the outlet · This claim is single-use
        </p>
      )}
    </div>
  )
}
