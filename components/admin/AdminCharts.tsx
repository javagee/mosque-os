'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#1A3D2B', '#2D6A4F', '#C9A84C', '#8B5CF6', '#6B7280']

interface Props {
  byCategory: { name: string; total: number }[]
}

export default function AdminCharts({ byCategory }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-700 text-gray-800 mb-4">Donations by category</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={byCategory} barCategoryGap="30%">
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `S$${v}`} />
          <Tooltip
            formatter={(value) => [`S$${Number(value).toFixed(2)}`, 'Total']}
            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: 'none' }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {byCategory.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
