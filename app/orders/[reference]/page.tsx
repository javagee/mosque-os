import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrder } from '@/lib/order-store'
import Nav from '@/components/layout/Nav'
import StatusRefresh from './StatusRefresh'

export const dynamic = 'force-dynamic'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 }).format(cents / 100)
}

const STATUS_STEPS = [
  { key: 'pending_payment',      label: 'Payment initiated',           desc: 'Buyer transferred via PayNow' },
  { key: 'pending_verification', label: 'Awaiting bank verification',  desc: 'Mosque team checking bank statement' },
  { key: 'verified',             label: 'Verified — e-coupon sent',    desc: 'E-coupon emailed to buyer' },
]

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const order = await getOrder(reference)
  if (!order) notFound()

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  const currentStep = STATUS_STEPS.findIndex(s => s.key === order.status)

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Nav mosqueName={mosqueName} />

      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-[#C9A84C] mb-1">ORDER STATUS</p>
          <h1 className="text-2xl font-bold text-[#1A3D2B]">{order.campaign_name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {order.merchant_name} · {order.quantity} coupon{order.quantity > 1 ? 's' : ''} · {sgd(order.total)}
          </p>
        </div>

        {/* Reference card */}
        <div className="bg-[#1A3D2B] rounded-2xl p-5 text-white mb-5">
          <p className="text-green-300/60 text-xs font-semibold mb-1">Order reference</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-[#C9A84C]">{order.reference}</p>
          <p className="text-green-200/60 text-xs mt-2">{order.buyer_name} · {order.buyer_email}</p>
        </div>

        {/* Status timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Progress</p>
          <div className="space-y-4">
            {STATUS_STEPS.map((step, i) => {
              const isPast    = i < currentStep
              const isCurrent = i === currentStep
              const isFuture  = i > currentStep
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isPast    ? 'bg-[#1A3D2B] text-white' :
                      isCurrent ? 'bg-[#C9A84C] text-[#1A3D2B]' :
                                  'bg-gray-100 text-gray-300'
                    }`}>
                      {isPast ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i + 1}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${isPast ? 'bg-[#1A3D2B]' : 'bg-gray-100'}`} />
                    )}
                  </div>
                  <div className="pt-0.5">
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-[#1A3D2B]' : isFuture ? 'text-gray-300' : 'text-gray-600'}`}>
                      {step.label}
                      {isCurrent && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                    </p>
                    <p className={`text-xs mt-0.5 ${isFuture ? 'text-gray-300' : 'text-gray-400'}`}>{step.desc}</p>
                    {step.key === 'pending_payment' && order.paid_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.paid_at).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {step.key === 'verified' && order.verified_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.verified_at).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status message */}
        {order.status === 'pending_verification' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">Your payment is being verified</p>
            <p className="text-xs text-amber-600 leading-relaxed">
              The mosque team will check the PayNow transfer and verify within a few hours.
              Your e-coupon will be automatically emailed to <strong>{order.buyer_email}</strong> once verified.
            </p>
            <StatusRefresh />
          </div>
        )}

        {order.status === 'verified' && (
          <div className="bg-[#E8F0EC] border border-[#1A3D2B]/20 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-[#1A3D2B] mb-1">Payment verified — e-coupon sent!</p>
            <p className="text-xs text-[#1A3D2B]/70 leading-relaxed">
              Your e-coupon has been emailed to <strong>{order.buyer_email}</strong>.
              Check your inbox (and spam folder) for the voucher with your QR code.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/campaigns" className="flex-1">
            <button className="w-full py-3.5 rounded-xl border-2 border-[#1A3D2B] text-[#1A3D2B] text-sm font-bold hover:bg-[#1A3D2B] hover:text-white transition-colors">
              More campaigns
            </button>
          </Link>
          <Link href="/" className="flex-1">
            <button className="w-full py-3.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-bold hover:bg-[#2D6A4F] transition-colors">
              Back home
            </button>
          </Link>
        </div>

      </div>
    </div>
  )
}
