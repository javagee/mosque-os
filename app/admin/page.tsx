import { db } from '@/lib/db'
import { DONATION_CATEGORIES } from '@/types'
import AdminCharts from '@/components/admin/AdminCharts'
import AdminOrderVerify from '@/components/admin/AdminOrderVerify'
import { getPendingOrders } from '@/lib/order-store'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [donors, campaigns, pendingOrders] = await Promise.all([
    db.getDonors(),
    db.getCampaigns(),
    getPendingOrders(),
  ])
  const couponCounts = await db.getCouponCountsByCampaign(campaigns.map((c) => c.id))

  const totalRaisedPence = donors.reduce((sum, d) => sum + d.amount, 0)
  const totalRaised = (totalRaisedPence / 100).toFixed(2)
  const totalDonors = donors.length
  const monthlyDonors = donors.filter((d) => d.type === 'monthly').length

  const totalCouponsSold = campaigns.reduce((s, c) => s + (couponCounts[c.id]?.total ?? 0), 0)
  const totalCouponsRedeemed = campaigns.reduce((s, c) => s + (couponCounts[c.id]?.redeemed ?? 0), 0)
  const couponRevenue = campaigns.reduce((s, c) => s + (couponCounts[c.id]?.total ?? 0) * c.coupon_price, 0)

  const byCategory = Object.keys(DONATION_CATEGORIES).map((cat) => ({
    name: DONATION_CATEGORIES[cat as keyof typeof DONATION_CATEGORIES].label,
    total: donors.filter((d) => d.category === cat).reduce((s, d) => s + d.amount / 100, 0),
  }))

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-800 text-[#1A3D2B]">Admin Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Imara · Donation overview</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin/campaigns" className="text-sm font-semibold text-[#1A3D2B] bg-[#1A3D2B]/10 px-4 py-2 rounded-xl hover:bg-[#1A3D2B]/20 transition-colors">
              Campaigns →
            </a>
            <a href="/admin/settlements" className="text-sm font-semibold text-[#1A3D2B] bg-[#1A3D2B]/10 px-4 py-2 rounded-xl hover:bg-[#1A3D2B]/20 transition-colors">
              Settlement →
            </a>
            <a href="/" className="text-sm text-[#1A3D2B] font-600 hover:underline">← Back to site</a>
          </div>
        </div>

        {/* Pending PayNow verifications */}
        {pendingOrders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-200 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="font-700 text-amber-800">
                {pendingOrders.length} payment{pendingOrders.length > 1 ? 's' : ''} awaiting verification
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

        {/* Donation stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total raised', value: `£${totalRaised}`, sub: 'direct donations' },
            { label: 'Total donors', value: totalDonors, sub: 'completed donations' },
            { label: 'Monthly givers', value: monthlyDonors, sub: 'active recurring' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 font-600">{stat.label}</p>
              <p className="text-3xl font-800 text-[#1A3D2B] mt-1">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Coupon stats */}
        {campaigns.length > 0 && (
          <>
            <div>
              <h2 className="text-lg font-800 text-[#1A3D2B] mb-4">Coupon campaigns</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Coupons sold', value: totalCouponsSold, sub: 'across all campaigns' },
                  { label: 'Coupons redeemed', value: totalCouponsRedeemed, sub: `${totalCouponsSold - totalCouponsRedeemed} unredeemed` },
                  { label: 'Coupon revenue', value: `$${(couponRevenue / 100).toFixed(0)}`, sub: 'total collected' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-xs text-gray-400 font-600">{stat.label}</p>
                    <p className="text-3xl font-800 text-[#1A3D2B] mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-700 text-gray-800">Campaign breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="text-left px-5 py-3 font-600">Campaign</th>
                        <th className="text-left px-5 py-3 font-600">Merchant</th>
                        <th className="text-right px-5 py-3 font-600">Price</th>
                        <th className="text-right px-5 py-3 font-600">Sold</th>
                        <th className="text-right px-5 py-3 font-600">Redeemed</th>
                        <th className="text-right px-5 py-3 font-600">Unredeemed</th>
                        <th className="text-left px-5 py-3 font-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => {
                        const counts = couponCounts[c.id] ?? { total: 0, redeemed: 0 }
                        const unredeemed = counts.total - counts.redeemed
                        return (
                          <tr key={c.id} className="border-b border-gray-50 hover:bg-[#FAFAFA]">
                            <td className="px-5 py-3 font-600 text-gray-800">{c.name}</td>
                            <td className="px-5 py-3 text-gray-500">{c.merchant_name}</td>
                            <td className="px-5 py-3 text-right font-700 text-[#1A3D2B]">
                              ${(c.coupon_price / 100).toFixed(0)}
                            </td>
                            <td className="px-5 py-3 text-right text-gray-700">{counts.total}</td>
                            <td className="px-5 py-3 text-right text-gray-500">{counts.redeemed}</td>
                            <td className="px-5 py-3 text-right text-amber-600 font-600">{unredeemed}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-600 px-2 py-0.5 rounded-lg ${c.active ? 'bg-[#E8F0EC] text-[#1A3D2B]' : 'bg-gray-100 text-gray-500'}`}>
                                {c.active ? 'Active' : 'Ended'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Charts */}
        <AdminCharts byCategory={byCategory} />

        {/* Recent donors table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-700 text-gray-800">Recent donations</h2>
          </div>
          {donors.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No donations yet. Share your donation page to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-600">Donor</th>
                    <th className="text-left px-5 py-3 font-600">Category</th>
                    <th className="text-left px-5 py-3 font-600">Type</th>
                    <th className="text-right px-5 py-3 font-600">Amount</th>
                    <th className="text-right px-5 py-3 font-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map((donor) => (
                    <tr key={donor.id} className="border-b border-gray-50 hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-600 text-gray-800">{donor.name}</p>
                        <p className="text-gray-400 text-xs">{donor.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-600 border ${DONATION_CATEGORIES[donor.category as keyof typeof DONATION_CATEGORIES]?.color ?? 'bg-gray-100 text-gray-700'}`}>
                          {DONATION_CATEGORIES[donor.category as keyof typeof DONATION_CATEGORIES]?.label ?? donor.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 capitalize">{donor.type}</td>
                      <td className="px-5 py-3 text-right font-700 text-[#1A3D2B]">
                        £{(donor.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 text-xs">
                        {new Date(donor.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
