import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import CouponDisplay from '@/components/coupon/CouponDisplay'

export const dynamic = 'force-dynamic'

export default async function CouponPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const coupon = await db.getCouponByToken(token)
  if (!coupon) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const redemptionUrl = `${appUrl}/merchant/redeem?token=${token}`

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <CouponDisplay coupon={coupon} redemptionUrl={redemptionUrl} />
    </main>
  )
}
