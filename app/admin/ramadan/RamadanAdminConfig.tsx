'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RamadanConfig, RamadanNightData, RamadanSlot, AuditEvent } from '@/types'

function sgd(cents: number) {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 0 }).format(cents / 100)
}

function computeGap(night: RamadanNightData, slots: RamadanSlot[]): number {
  if (!slots.length) return 0
  const slotTotal = slots.reduce((s, sl) => s + sl.amount, 0)
  return Math.max(0, night.target - slotTotal)
}

export default function RamadanAdminConfig({
  config: initialConfig,
  nights,
  pendingSlots = [],
  slotsByNight = {},
}: {
  config: RamadanConfig
  nights: RamadanNightData[]
  pendingSlots?: RamadanSlot[]
  slotsByNight?: Record<number, RamadanSlot[]>
}) {
  const router = useRouter()
  const [config, setConfig] = useState(initialConfig)
  const [defaultTargetStr, setDefaultTargetStr] = useState(String(initialConfig.default_target / 100))
  const [hijriMonth, setHijriMonth] = useState(initialConfig.hijri_month ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmingNight, setConfirmingNight] = useState<string | null>(null)
  const [slotNight, setSlotNight] = useState('1')
  const [slotAmount, setSlotAmount] = useState('400')
  const [slotQty, setSlotQty] = useState('25')
  const [slotMealType, setSlotMealType] = useState<'IFTAR' | 'SAHUR' | 'GENERAL'>('IFTAR')
  const [slotDate, setSlotDate] = useState('')
  const [creatingSlots, setCreatingSlots] = useState(false)
  const [slotsCreated, setSlotsCreated] = useState(0)
  const [verifyingSlot, setVerifyingSlot] = useState<string | null>(null)
  const [expenseNight, setExpenseNight] = useState('1')
  const [expenseLabel, setExpenseLabel] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [auditLoaded, setAuditLoaded] = useState(false)

  async function loadAudit() {
    if (auditLoaded) return
    const res = await fetch('/api/admin/ramadan/audit')
    if (res.ok) setAuditEvents(await res.json())
    setAuditLoaded(true)
  }

  function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    const night = parseInt(expenseNight)
    const amount = Math.round(parseFloat(expenseAmount) * 100)
    if (!expenseLabel.trim() || !amount) return
    setConfig(c => ({
      ...c,
      night_expenses: {
        ...c.night_expenses,
        [night]: [...(c.night_expenses?.[night] ?? []), { label: expenseLabel.trim(), amount_cents: amount }],
      },
    }))
    setExpenseLabel('')
    setExpenseAmount('')
  }

  function handleRemoveExpense(night: number, idx: number) {
    setConfig(c => ({
      ...c,
      night_expenses: {
        ...c.night_expenses,
        [night]: (c.night_expenses?.[night] ?? []).filter((_, i) => i !== idx),
      },
    }))
  }

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

  async function handleCreateSlots(e: React.FormEvent) {
    e.preventDefault()
    setCreatingSlots(true)
    setSlotsCreated(0)
    const res = await fetch(`/api/admin/ramadan/nights/${slotNight}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_cents: Math.round(parseFloat(slotAmount) * 100),
        quantity: parseInt(slotQty),
        meal_type: slotMealType,
        meal_civil_date: slotDate,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setSlotsCreated(data.created)
      router.refresh()
    }
    setCreatingSlots(false)
  }

  async function handleVerifySlot(slotId: string) {
    setVerifyingSlot(slotId)
    await fetch(`/api/admin/ramadan/slots/${slotId}/verify`, { method: 'POST' })
    setVerifyingSlot(null)
    router.refresh()
  }

  const pendingNights = nights.filter(n => n.sponsors.some(s => s.status === 'pending'))

  // Funding gap: nights where slot total < nightly target
  const gapNights = nights.filter(n => {
    const slots = slotsByNight[n.night] ?? []
    return slots.length > 0 && computeGap(n, slots) > 0
  })

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

      {/* Funding gap alert — prominent red review prompt (spec §6.2) */}
      {gapNights.length > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-600 text-sm font-bold">!</span>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-red-800 text-sm mb-1">Funding Gap — Review Required</h2>
              <p className="text-xs text-red-600 mb-3">
                {gapNights.length} night{gapNights.length > 1 ? 's have' : ' has'} slots that do not cover the nightly target. Create additional slots or adjust the target.
              </p>
              <div className="space-y-2">
                {gapNights.map(n => {
                  const slots = slotsByNight[n.night] ?? []
                  const slotTotal = slots.reduce((s, sl) => s + sl.amount, 0)
                  const gap = n.target - slotTotal
                  return (
                    <div key={n.night} className="bg-white rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-800">Night {n.night}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Target: <strong>{sgd(n.target)}</strong></span>
                        <span>Slots: <strong>{sgd(slotTotal)}</strong></span>
                        <span className="font-bold text-red-600">Gap: {sgd(gap)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Cash Slots */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-[#1A3D2B] mb-1">Create Cash Slots</h2>
        <p className="text-xs text-gray-400 mb-4">Batch-create fixed-amount slots for a night (e.g. 25 × S$400 Iftar slots).</p>
        <form onSubmit={handleCreateSlots} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Night (1–30)</label>
            <input type="number" min="1" max="30" value={slotNight} onChange={e => setSlotNight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Amount per slot (S$)</label>
            <input type="number" min="1" value={slotAmount} onChange={e => setSlotAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity</label>
            <input type="number" min="1" max="100" value={slotQty} onChange={e => setSlotQty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Meal type</label>
            <select value={slotMealType} onChange={e => setSlotMealType(e.target.value as 'IFTAR' | 'SAHUR' | 'GENERAL')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
              <option value="IFTAR">Iftar (4 PM cutoff)</option>
              <option value="SAHUR">Sahur (D-3 cutoff)</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Civil date (YYYY-MM-DD)</label>
            <input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" required />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={creatingSlots}
              className="w-full py-2 bg-[#1A3D2B] text-white text-sm font-semibold rounded-xl hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors">
              {creatingSlots ? 'Creating…' : 'Create Slots'}
            </button>
          </div>
        </form>
        {slotsCreated > 0 && (
          <p className="text-sm text-emerald-600 font-semibold mt-3">{slotsCreated} slot(s) created.</p>
        )}
      </div>

      {/* Pending slot verifications */}
      {pendingSlots.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="font-bold text-amber-800 mb-3 text-sm">
            Pending Slot Verifications ({pendingSlots.length})
          </h2>
          <div className="space-y-3">
            {pendingSlots.map(slot => (
              <div key={slot.id} className="bg-white rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Night {slot.night} · {slot.meal_type} · {sgd(slot.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {slot.donor_anonymous ? 'Anonymous' : slot.donor_name} · {slot.donor_email}
                  </p>
                  {slot.order_reference && (
                    <p className="text-xs font-mono text-gray-400">{slot.order_reference}</p>
                  )}
                </div>
                <button
                  onClick={() => handleVerifySlot(slot.id)}
                  disabled={verifyingSlot === slot.id}
                  className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {verifyingSlot === slot.id ? 'Verifying…' : 'Mark Sponsored'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planned expenses editor */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-[#1A3D2B] mb-1">Planned Expenses</h2>
        <p className="text-xs text-gray-400 mb-4">Non-binding per-night budget line items. Saved with board settings.</p>

        {/* Existing line items */}
        {Object.entries(config.night_expenses ?? {}).filter(([, lines]) => lines.length > 0).map(([night, lines]) => (
          <div key={night} className="mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Night {night}</p>
            <div className="space-y-1">
              {lines.map((line, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
                  <span className="text-sm text-gray-700">{line.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">{sgd(line.amount_cents)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(parseInt(night), i)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <form onSubmit={handleAddExpense} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Night</label>
            <input type="number" min="1" max="30" value={expenseNight} onChange={e => setExpenseNight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Label</label>
            <input type="text" placeholder="e.g. Food & beverage" value={expenseLabel} onChange={e => setExpenseLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Amount (S$)</label>
            <input type="number" min="0.01" step="0.01" placeholder="150" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" required />
          </div>
          <div className="col-span-2 sm:col-span-4 flex gap-3 items-center">
            <button type="submit"
              className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors">
              Add line item
            </button>
            <span className="text-xs text-gray-400">Click &quot;Save settings&quot; above to persist changes.</span>
          </div>
        </form>
      </div>

      {/* Audit log */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#1A3D2B]">Audit Log</h2>
          {!auditLoaded && (
            <button onClick={loadAudit}
              className="text-xs font-semibold text-[#1A3D2B] hover:underline">
              Load events
            </button>
          )}
        </div>
        {!auditLoaded && (
          <p className="text-xs text-gray-400">Click &quot;Load events&quot; to fetch the audit trail.</p>
        )}
        {auditLoaded && auditEvents.length === 0 && (
          <p className="text-xs text-gray-400">No events recorded yet.</p>
        )}
        {auditEvents.length > 0 && (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {auditEvents.slice(0, 50).map(ev => (
              <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-[#1A3D2B] bg-emerald-50 px-1.5 py-0.5 rounded">{ev.action}</span>
                    <span className="text-xs text-gray-500 truncate">{ev.entity_type} / {ev.entity_id}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{new Date(ev.timestamp).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{ev.actor}</span>
                    {ev.note && <span className="text-xs text-gray-400 italic truncate">{ev.note}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                <th className="text-right px-5 py-3 font-semibold">Slots</th>
                <th className="text-right px-5 py-3 font-semibold">Gap</th>
                <th className="text-right px-5 py-3 font-semibold">Raised</th>
                <th className="text-right px-5 py-3 font-semibold">Target</th>
              </tr>
            </thead>
            <tbody>
              {nights.map(n => {
                const slots = slotsByNight[n.night] ?? []
                const sponsored = slots.filter(s => s.status === 'SPONSORED').length
                const gap = computeGap(n, slots)
                return (
                  <tr key={n.night} className={`border-b border-gray-50 hover:bg-gray-50 ${gap > 0 ? 'bg-red-50/40' : ''}`}>
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
                    <td className="px-5 py-2.5 text-right text-gray-700">
                      {slots.length > 0 ? `${sponsored}/${slots.length}` : '—'}
                    </td>
                    <td className={`px-5 py-2.5 text-right font-semibold ${gap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {slots.length > 0 ? (gap > 0 ? `-${sgd(gap)}` : '✓') : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-gray-700">{sgd(n.raised)}</td>
                    <td className="px-5 py-2.5 text-right text-gray-400">{sgd(n.target)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
