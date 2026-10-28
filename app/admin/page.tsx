import { db } from '@/lib/db'
import { DONATION_CATEGORIES } from '@/types'
import AdminOrderVerify from '@/components/admin/AdminOrderVerify'
import AdminDonationVerify from '@/components/admin/AdminDonationVerify'
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import { getPendingOrders } from '@/lib/order-store'
import { getPendingDonations } from '@/lib/donation-store'

export const dynamic = 'force-dynamic'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

export default async function AdminPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  const [donors, campaigns, pendingOrders, pendingDonations] = await Promise.all([
    db.getDonors(),
    db.getCampaigns(),
    getPendingOrders(),
    getPendingDonations(),
  ])
  const couponCounts = await db.getCouponCountsByCampaign(campaigns.map((c) => c.id))

  const totalRaisedCents = donors.reduce((sum, d) => sum + d.amount, 0)
  const totalCouponsSold = campaigns.reduce((s, c) => s + (couponCounts[c.id]?.total ?? 0), 0)
  const totalCouponsRedeemed = campaigns.reduce((s, c) => s + (couponCounts[c.id]?.redeemed ?? 0), 0)
  const couponRevenueCents = campaigns.reduce((s, c) => s + (couponCounts[c.id]?.total ?? 0) * c.coupon_price, 0)
  const pendingCount = pendingOrders.length + pendingDonations.length

  const recentDonors = [...donors].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6)

  const byCategory = Object.entries(DONATION_CATEGORIES).map(([key, cat]) => ({
    label: cat.label,
    arabic: cat.arabic,
    color: cat.color,
    total: donors.filter((d) => d.category === key).reduce((s, d) => s + d.amount / 100, 0),
    count: donors.filter((d) => d.category === key).length,
  })).filter(c => c.total > 0)

  const totalRaised = totalRaisedCents / 100
  const couponRevenue = couponRevenueCents / 100

  return (
    <AdminSidebarLayout mosqueName={mosqueName}>
      <div className="p-6 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">IMAM ADMINISTRATION</p>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">{mosqueName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Overview · {new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {pendingCount} pending
              </span>
            )}
            <a href="/admin/finance" className="px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors">
              Finance →
            </a>
          </div>
        </div>

        {/* KPI cards — Image #12 style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Raised',
              value: sgd(totalRaisedCents + couponRevenueCents),
              sub: 'donations + coupons',
              color: 'bg-[#E8F0EC]',
              iconColor: 'text-[#1A3D2B]',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: 'Total Donors',
              value: donors.length,
              sub: `${donors.filter(d => d.type === 'monthly').length} recurring`,
              color: 'bg-blue-50',
              iconColor: 'text-blue-600',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              label: 'Coupons Sold',
              value: totalCouponsSold,
              sub: `${totalCouponsRedeemed} redeemed`,
              color: 'bg-amber-50',
              iconColor: 'text-amber-600',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              ),
            },
            {
              label: 'Pending Actions',
              value: pendingCount,
              sub: 'awaiting verification',
              color: pendingCount > 0 ? 'bg-red-50' : 'bg-gray-50',
              iconColor: pendingCount > 0 ? 'text-red-500' : 'text-gray-400',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-[#1A3D2B]">{card.value}</p>
              <p className="text-xs font-semibold text-gray-500 mt-1">{card.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Donation breakdown by category */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Donations by Category</h2>
              <span className="text-xs text-gray-400">{donors.length} donors · {sgd(totalRaisedCents)}</span>
            </div>
            {byCategory.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No donations yet.</p>
            ) : (
              <div className="space-y-3">
                {byCategory.sort((a, b) => b.total - a.total).map(cat => (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${cat.color}`}>{cat.label}</span>
                        <span className="arabic text-sm text-[#C9A84C]">{cat.arabic}</span>
                        <span className="text-xs text-gray-400">{cat.count} donor{cat.count !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-sm font-bold text-[#1A3D2B]">{sgd(cat.total * 100)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1A3D2B] rounded-full"
                        style={{ width: `${totalRaised > 0 ? Math.round((cat.total / totalRaised) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coupon campaign summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Coupon Campaigns</h2>
              <span className="text-xs text-gray-400">{campaigns.length} campaigns · {sgd(couponRevenueCents)}</span>
            </div>
            {campaigns.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No campaigns yet.</p>
            ) : (
              <div className="space-y-3">
                {campaigns.slice(0, 5).map(c => {
                  const counts = couponCounts[c.id] ?? { total: 0, redeemed: 0 }
                  const pct = counts.total > 0 ? Math.round((counts.redeemed / counts.total) * 100) : 0
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{c.merchant_name}</span>
                          <span className="text-xs text-gray-400 ml-2">{counts.total} sold · {counts.redeemed} redeemed</span>
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C9A84C] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pending verifications */}
        {(pendingOrders.length > 0 || pendingDonations.length > 0) && (
          <div className="space-y-4">
            {pendingOrders.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-200 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h2 className="font-bold text-amber-800">
                    {pendingOrders.length} coupon payment{pendingOrders.length > 1 ? 's' : ''} awaiting verification
                  </h2>
                  <span className="text-xs text-amber-600 ml-auto">Check your bank · then verify below</span>
                </div>
                <div className="divide-y divide-amber-100">
                  {pendingOrders.map(order => (
                    <AdminOrderVerify key={order.reference} order={order} />
                  ))}
                </div>
              </div>
            )}

            {pendingDonations.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-purple-200 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <h2 className="font-bold text-purple-800">
                    {pendingDonations.length} donation{pendingDonations.length > 1 ? 's' : ''} awaiting verification
                  </h2>
                  <span className="text-xs text-purple-600 ml-auto">Check your bank · then verify below</span>
                </div>
                <div className="divide-y divide-purple-100">
                  {pendingDonations.map(donation => (
                    <AdminDonationVerify key={donation.reference} donation={donation} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent donations */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Recent Donations</h2>
            <a href="/admin/finance" className="text-xs text-[#1A3D2B] font-semibold hover:underline">View all →</a>
          </div>
          {recentDonors.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No donations yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentDonors.map((donor) => {
                const cat = DONATION_CATEGORIES[donor.category as keyof typeof DONATION_CATEGORIES]
                return (
                  <div key={donor.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#FAFAFA] transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-[#1A3D2B]/8 flex items-center justify-center flex-shrink-0">
                      <span className="arabic text-base text-[#C9A84C]">{cat?.arabic ?? '—'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{donor.name}</p>
                      <p className="text-xs text-gray-400">{cat?.label ?? donor.category} · {donor.type}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[#1A3D2B]">S${(donor.amount / 100).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(donor.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </AdminSidebarLayout>
  )
}
