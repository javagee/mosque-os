'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'

const GREEN = '#1A3D2B'
const GOLD  = '#C9A84C'
const TEAL  = '#2D6A4F'
const SLATE = '#94A3B8'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

// ── Weekly stacked bar ────────────────────────────────────────────────────────
interface WeekRow { week: string; donations: number; coupons: number }

export function WeeklyChart({ data }: { data: WeekRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="28%">
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `S$${(v / 100).toFixed(0)}`}
          width={52}
        />
        <Tooltip
          formatter={(value, name) => [sgd(Number(value)), name === 'donations' ? 'Direct Donations' : 'Coupon Sales']}
          contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: 'none', fontSize: 12 }}
        />
        <Legend
          formatter={v => v === 'donations' ? 'Direct Donations' : 'Coupon Sales'}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="donations" stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
        <Bar dataKey="coupons"   stackId="a" fill={GOLD}  radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Channel donut ─────────────────────────────────────────────────────────────
interface ChannelRow { name: string; value: number; color: string }

const RADIAN = Math.PI / 180
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.06) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ChannelDonut({ data, total }: { data: ChannelRow[]; total: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={76}
              dataKey="value"
              labelLine={false}
              label={CustomLabel as (props: unknown) => React.ReactElement | null}
            >
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2.5 flex-1">
        <p className="text-xs font-700 text-gray-500 mb-1">{sgd(total)} Total</p>
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-gray-600">{d.name}</span>
            </div>
            <span className="text-xs font-700 text-gray-800">{sgd(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Coupon status 3-up ────────────────────────────────────────────────────────
export function CouponStatus({ issued, redeemed, outstanding }: { issued: number; redeemed: number; outstanding: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      {[
        { label: 'Issued',      value: issued,      color: 'text-[#1A3D2B]' },
        { label: 'Redeemed',    value: redeemed,    color: 'text-[#C9A84C]' },
        { label: 'Outstanding', value: outstanding, color: 'text-slate-500' },
      ].map(s => (
        <div key={s.label} className="bg-[#FAFAFA] rounded-xl p-3">
          <p className={`text-2xl font-800 ${s.color}`}>{s.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Settlement pipeline ───────────────────────────────────────────────────────
export function SettlementPipeline({ collected, settled, pending }: { collected: number; settled: number; pending: number }) {
  const Arrow = () => (
    <div className="flex items-center text-gray-300 flex-shrink-0">
      <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
        <path d="M0 8h20M14 2l8 6-8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )

  return (
    <div className="flex items-center justify-between gap-2">
      {[
        { label: 'Collected',  value: collected, sub: 'from all sales', color: 'text-[#1A3D2B]',  bg: 'bg-[#E8F0EC]' },
        { label: 'Settled',    value: settled,   sub: 'to mosque',       color: 'text-[#2D6A4F]',  bg: 'bg-[#F0F7F3]' },
        { label: 'Pending',    value: pending,   sub: 'awaiting payout', color: 'text-red-600',    bg: 'bg-red-50' },
      ].map((s, i) => (
        <div key={s.label} className="flex items-center gap-2 flex-1">
          {i > 0 && <Arrow />}
          <div className={`${s.bg} rounded-xl px-4 py-3 flex-1 text-center`}>
            <p className={`text-lg font-800 ${s.color}`}>{sgd(s.value)}</p>
            <p className="text-xs font-600 text-gray-600 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
