'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RamadanConfig, RamadanNightData } from '@/types'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

export default function RamadanAdminConfig({
  config: initialConfig,
  nights,
}: {
  config: RamadanConfig
  nights: RamadanNightData[]
}) {
  const router = useRouter()
  const [config, setConfig] = useState(initialConfig)
  const [defaultTargetStr, setDefaultTargetStr] = useState(String(initialConfig.default_target / 100))
  const [hijriMonth, setHijriMonth] = useState(initialConfig.hijri_month ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmingNight, setConfirmingNight] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const updated: RamadanConfig = {
      ...config,
      default_target: Math.round(parseFloat(defaultTargetStr || '100') * 100),
      hijri_month: hijriMonth.trim() || undefined,
    }
    await fetch('/api/admin/ramadan/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    setConfig(updated)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function handleConfirmSponsor(nightNum: number, sponsorId: string, orderRef: string) {
    setConfirmingNight(sponsorId)
    await fetch('/api/ramadan/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: orderRef }),
    })
    setConfirmingNight(null)
    router.refresh()
  }

  const pendingNights = nights.filter(n => n.sponsors.some(s => s.status === 'pending'))

  return (
    <div className="space-y-6">
      {/* Config card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-[#1A3D2B] mb-4">Board Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">Board active</p>
              <p className="text-xs text-gray-400">Show board to public</p>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, active: !c.active }))}
              className={`w-11 h-6 rounded-full transition-colors ${config.active ? 'bg-[#1A3D2B]' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform shadow ${config.active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Default target */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Default nightly target (S$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S$</span>
              <input
                type="number"
                min="1"
                value={defaultTargetStr}
                onChange={e => setDefaultTargetStr(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"
              />
            </div>
          </div>

          {/* Hijri month label */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Hijri month label <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              type="text"
              value={hijriMonth}
              onChange={e => setHijriMonth(e.target.value)}
              placeholder="Ramadan 1446"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#1A3D2B] text-white text-sm font-semibold rounded-xl hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-semibold">Saved!</span>}
        </div>
      </div>

      {/* Pending confirmations */}
      {pendingNights.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="font-bold text-amber-800 mb-3 text-sm">
            Pending Payment Verification ({pendingNights.reduce((s, n) => s + n.sponsors.filter(sp => sp.status === 'pending').length, 0)})
          </h2>
          <div className="space-y-3">
            {pendingNights.map(n =>
              n.sponsors.filter(s => s.status === 'pending').map(s => (
                <div key={s.id} className="bg-white rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Night {n.night} — {s.anonymous ? 'Anonymous' : s.donor_name}</p>
                    <p className="text-xs text-gray-500">{s.donor_email} · {sgd(s.amount)}</p>
                    {s.order_reference && (
                      <p className="text-xs font-mono text-gray-400">{s.order_reference}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleConfirmSponsor(n.night, s.id, s.order_reference!)}
                    disabled={confirmingNight === s.id || !s.order_reference}
                    className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {confirmingNight === s.id ? 'Confirming…' : 'Confirm'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Nights overview table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1A3D2B] text-sm">All 30 Nights</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-semibold">Night</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Raised</th>
                <th className="text-right px-5 py-3 font-semibold">Target</th>
                <th className="text-right px-5 py-3 font-semibold">Confirmed</th>
                <th className="text-right px-5 py-3 font-semibold">Pending</th>
              </tr>
            </thead>
            <tbody>
              {nights.map(n => (
                <tr key={n.night} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-2.5 font-semibold text-[#1A3D2B]">Night {n.night}</td>
                  <td className="px-5 py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      n.status === 'sponsored' ? 'bg-emerald-100 text-emerald-700' :
                      n.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {n.status === 'sponsored' ? 'Sponsored' : n.status === 'partial' ? 'Partial' : 'Available'}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-semibold text-gray-700">{sgd(n.raised)}</td>
                  <td className="px-5 py-2.5 text-right text-gray-400">{sgd(n.target)}</td>
                  <td className="px-5 py-2.5 text-right text-emerald-600">{n.sponsors.filter(s => s.status === 'confirmed').length}</td>
                  <td className="px-5 py-2.5 text-right text-amber-600">{n.sponsors.filter(s => s.status === 'pending').length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
