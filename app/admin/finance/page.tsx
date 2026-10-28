import { db } from '@/lib/db'
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import { getAllOrders } from '@/lib/order-store'
import type { Order, Coupon, Donor } from '@/types'
import { WeeklyChart, ChannelDonut, CouponStatus, SettlementPipeline } from './FinanceCharts'

export const dynamic = 'force-dynamic'

const SGD = (cents: number) =>
  new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)

function isoWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  // Monday of that week
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (dt: Date) => `${dt.getDate()} ${dt.toLocaleString('en-SG', { month: 'short' })}`
  return `${fmt(mon)} – ${fmt(sun)}`
}

function buildWeeklyData(orders: Order[], donors: Donor[]) {
  const map: Record<string, { donations: number; coupons: number }> = {}

  for (const o of orders) {
    if (o.status !== 'verified') continue
    const label = isoWeekLabel(o.created_at)
    if (!map[label]) map[label] = { donations: 0, coupons: 0 }
    map[label].coupons += o.total
  }
  for (const d of donors) {
    const label = isoWeekLabel(d.created_at)
    if (!map[label]) map[label] = { donations: 0, coupons: 0 }
    map[label].donations += d.amount
  }

  // Sort by first date seen within each week label, keep last 5 weeks
  return Object.entries(map)
    .sort(([a], [b]) => {
      const parseFirst = (s: string) => new Date(s.split('–')[0].trim() + ' 2026').getTime()
      return parseFirst(a) - parseFirst(b)
    })
    .slice(-5)
    .map(([week, v]) => ({ week, ...v }))
}

function buildChannelData(orders: Order[], donors: Donor[]) {
  const couponTotal = orders.filter(o => o.status === 'verified').reduce((s, o) => s + o.total, 0)
  const donationOneTime = donors.filter(d => d.type === 'one-time').reduce((s, d) => s + d.amount, 0)
  const donationMonthly = donors.filter(d => d.type === 'monthly').reduce((s, d) => s + d.amount, 0)
  return {
    total: couponTotal + donationOneTime + donationMonthly,
    channels: [
      { name: 'PayNow Coupons',     value: couponTotal,      color: '#1A3D2B' },
      { name: 'One-time Donations', value: donationOneTime,  color: '#C9A84C' },
      { name: 'Monthly Donations',  value: donationMonthly,  color: '#2D6A4F' },
    ].filter(c => c.value > 0),
  }
}

function buildSettlementData(orders: Order[], coupons: Coupon[]) {
  const collected = orders.filter(o => o.status === 'verified').reduce((s, o) => s + o.mosque_portion, 0)
  const pendingCoupons = coupons.filter(c => !c.merchant_settled)
  const pendingAmount = pendingCoupons.reduce((s, c) => s + Math.ceil((c.campaign?.coupon_price ?? 0) / 2), 0)
  const settled = collected - pendingAmount
  return { collected, settled: Math.max(0, settled), pending: Math.max(0, pendingAmount) }
}

type RecentActivity =
  | { kind: 'donation'; date: string; name: string; type: string; category: string; amount: number }
  | { kind: 'coupon';   date: string; name: string; campaign: string; qty: number; amount: number }

function buildRecentActivity(orders: Order[], donors: Donor[]): RecentActivity[] {
  const items: RecentActivity[] = [
    ...donors.map(d => ({
      kind: 'donation' as const,
      date: d.created_at,
      name: d.name,
      type: d.type === 'monthly' ? 'Monthly' : 'One-time',
      category: d.category,
      amount: d.amount,
    })),
    ...orders.filter(o => o.status === 'verified').map(o => ({
      kind: 'coupon' as const,
      date: o.created_at,
      name: o.buyer_name,
      campaign: o.campaign_name,
      qty: o.quantity,
      amount: o.total,
    })),
  ]
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12)
}

export default async function FinancePage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Al-Noor Mosque'

  const [orders, campaigns, donors, redeemedCoupons] = await Promise.all([
    getAllOrders(),
    db.getAllCampaigns(),
    db.getDonors(),
    db.getRedeemedCoupons(),
  ])

  const verifiedOrders = orders.filter(o => o.status === 'verified')
  const couponCounts = await db.getCouponCountsByCampaign(campaigns.map(c => c.id))

  // ── KPI calculations ─────────────────────────────────────────────────────────
  const directDonations = donors.reduce((s, d) => s + d.amount, 0)
  const couponSales     = verifiedOrders.reduce((s, o) => s + o.total, 0)
  const totalFundraising = directDonations + couponSales

  const totalIssued      = campaigns.reduce((s, c) => s + (couponCounts[c.id]?.total ?? 0), 0)
  const totalRedeemed    = campaigns.reduce((s, c) => s + (couponCounts[c.id]?.redeemed ?? 0), 0)
  const totalOutstanding = totalIssued - totalRedeemed

  const { collected, settled, pending } = buildSettlementData(verifiedOrders, redeemedCoupons)

  // ── Chart data ───────────────────────────────────────────────────────────────
  const weeklyData  = buildWeeklyData(orders, donors)
  const channelData = buildChannelData(orders, donors)
  const recentActivity = buildRecentActivity(orders, donors)

  // ── Campaign table ───────────────────────────────────────────────────────────
  const campaignRows = campaigns.map(c => {
    const counts = couponCounts[c.id] ?? { total: 0, redeemed: 0 }
    return {
      ...c,
      sold:      counts.total,
      redeemed:  counts.redeemed,
      grossSales: counts.total * c.coupon_price,
    }
  }).sort((a, b) => b.grossSales - a.grossSales)

  const kpis = [
    { label: 'Total Fundraising',  value: SGD(totalFundraising), sub: 'Donations + Coupon sales', accent: false },
    { label: 'Direct Donations',   value: SGD(directDonations),  sub: `${donors.length} donors`,  accent: false },
    { label: 'Coupon Sales',       value: SGD(couponSales),      sub: `${verifiedOrders.length} orders verified`, accent: false },
    { label: 'Mosque Received',    value: SGD(collected),        sub: '50% of all coupon sales',  accent: false },
    { label: 'Pending Settlement', value: SGD(pending),          sub: 'Merchant payouts pending', accent: true  },
  ]

  const CATEGORY_LABELS: Record<string, string> = {
    zakat: 'Zakat', sadaqah: 'Sadaqah', waqf: 'Waqf', lillah: 'Lillah', general: 'General'
  }

  return (
    <AdminSidebarLayout mosqueName={mosqueName}>
    <main className="min-h-screen bg-[#F0F4F3] p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-600 text-[#C9A84C] uppercase tracking-widest mb-0.5">FINANCE & DONATIONS</p>
            <h1 className="text-2xl font-800 text-[#1A3D2B]">{mosqueName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <span className="text-xs font-600 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            DEMO DATA — ILLUSTRATIVE ONLY
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {kpis.map(k => (
            <div
              key={k.label}
              className={`rounded-2xl p-4 border ${k.accent
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-gray-100'}`}
            >
              <p className="text-xs text-gray-400 font-600 mb-1">{k.label}</p>
              <p className={`text-xl font-800 ${k.accent ? 'text-red-600' : 'text-[#1A3D2B]'}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Weekly bar */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-700 text-gray-800 mb-4">Collections by Week</h2>
            <WeeklyChart data={weeklyData} />
          </div>

          {/* Channel donut */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-700 text-gray-800 mb-4">Collections by Channel</h2>
            <ChannelDonut data={channelData.channels} total={channelData.total} />
          </div>
        </div>

        {/* Coupon status + settlement pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎫</span>
              <h2 className="font-700 text-gray-800">Coupon Status</h2>
            </div>
            <CouponStatus issued={totalIssued} redeemed={totalRedeemed} outstanding={totalOutstanding} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🏦</span>
              <h2 className="font-700 text-gray-800">Settlement Pipeline</h2>
            </div>
            <SettlementPipeline collected={collected} settled={settled} pending={pending} />
          </div>
        </div>

        {/* Campaign table + Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Campaign table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-700 text-gray-800">Merchant Coupon Campaigns</h2>
              <a href="/admin/campaigns" className="text-xs text-[#1A3D2B] font-600 hover:underline">
                Manage →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-600">Campaign</th>
                    <th className="text-left px-5 py-3 font-600 hidden sm:table-cell">Merchant</th>
                    <th className="text-right px-4 py-3 font-600">Price</th>
                    <th className="text-right px-4 py-3 font-600">Sold</th>
                    <th className="text-right px-4 py-3 font-600">Redeemed</th>
                    <th className="text-right px-5 py-3 font-600">Gross Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignRows.map((c, i) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-[#FAFAFA]">
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-400 mr-2">{i + 1}</span>
                        <span className="font-600 text-gray-800">{c.name}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{c.merchant_name}</td>
                      <td className="px-4 py-3 text-right font-600 text-gray-700">S${(c.coupon_price / 100).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{c.sold}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{c.redeemed}</td>
                      <td className="px-5 py-3 text-right font-700 text-[#1A3D2B]">{SGD(c.grossSales)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAFAFA] border-t border-gray-200">
                    <td className="px-5 py-3 font-700 text-gray-800" colSpan={3}>Total</td>
                    <td className="px-4 py-3 text-right font-700 text-gray-800">{totalIssued}</td>
                    <td className="px-4 py-3 text-right font-700 text-gray-800">{totalRedeemed}</td>
                    <td className="px-5 py-3 text-right font-800 text-[#1A3D2B]">{SGD(couponSales)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent activity feed */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-700 text-gray-800">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {recentActivity.map((item, i) => {
                const date = new Date(item.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
                if (item.kind === 'donation') {
                  return (
                    <div key={i} className="px-5 py-3 flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E8F0EC] flex items-center justify-center mt-0.5">
                        <span className="text-xs">💚</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 font-600 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{CATEGORY_LABELS[item.category] ?? item.category} · {item.type}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-700 text-[#1A3D2B]">{SGD(item.amount)}</p>
                        <p className="text-xs text-gray-400">{date}</p>
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={i} className="px-5 py-3 flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mt-0.5">
                      <span className="text-xs">🎫</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 font-600 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 truncate">{item.campaign} ×{item.qty}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-700 text-[#C9A84C]">{SGD(item.amount)}</p>
                      <p className="text-xs text-gray-400">{date}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </main>
    </AdminSidebarLayout>
  )
}
