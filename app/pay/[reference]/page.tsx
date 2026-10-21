import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrder } from '@/lib/order-store'
import PayNowPayment from './PayNowPayment'

export const dynamic = 'force-dynamic'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

export default async function PayNowPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const order = await getOrder(reference)
  if (!order) notFound()

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const qrImageUrl = process.env.PAYNOW_QR_URL ?? null
  const uen = process.env.PAYNOW_UEN ?? null

  // Already confirmed — redirect to success
  if (order.status === 'pending_verification' || order.status === 'verified') {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-[#1A3D2B]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#1A3D2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-bold text-[#1A3D2B] text-xl">Payment already confirmed</p>
        <p className="text-sm text-gray-500 text-center">
          Your voucher for <strong>{order.campaign_name}</strong> has been sent to {order.buyer_email}.
        </p>
        <Link href="/campaigns" className="text-sm text-[#1A3D2B] font-semibold hover:underline">
          ← Back to campaigns
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      {/* Nav */}
      <nav className="bg-[#1A3D2B] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-base font-bold text-white">Imara</span>
            <span className="text-[10px] text-green-300/70">{mosqueName}</span>
          </Link>
          <Link href={`/campaigns/${order.campaign_id}`} className="text-sm text-green-200/70 hover:text-white transition-colors">
            ← Cancel
          </Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Order summary header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-[#C9A84C] mb-1">{order.merchant_name}</p>
          <h1 className="text-2xl font-bold text-[#1A3D2B]">{order.campaign_name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {order.quantity} coupon{order.quantity > 1 ? 's' : ''} · {formatCurrency(order.unit_price, order.currency)} each · <strong className="text-gray-700">{formatCurrency(order.total, order.currency)} total</strong>
          </p>
        </div>

        <PayNowPayment order={order} qrImageUrl={qrImageUrl} uen={uen} />
      </div>
    </div>
  )
}
