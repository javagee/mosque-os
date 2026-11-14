'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import type { WaqfAsset, WaqfShare, WaqfTransaction } from '@/types'

type AssetWithMeta = WaqfAsset & { confirmed_shareholders: number; pending_shares: WaqfShare[] }

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
  } catch {
    return `${currency} ${(amount / 100).toFixed(0)}`
  }
}

const TX_COLORS: Record<string, string> = {
  contribution:  'bg-green-100 text-green-700',
  return_earned: 'bg-blue-100 text-blue-700',
  disbursement:  'bg-amber-100 text-amber-700',
  admin_fee:     'bg-gray-100 text-gray-500',
}

const CURRENCIES = ['USD', 'GBP', 'EUR', 'SGD', 'SAR', 'AED', 'JOD', 'MYR']

export default function AdminWaqfPage() {
  const [assets, setAssets] = useState<AssetWithMeta[]>([])
  const [txsByAsset, setTxsByAsset] = useState<Record<string, WaqfTransaction[]>>({})
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  // create form
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'cash', description: '', currency: 'USD', country: '', unit_price: '', established_at: '', shariah_cert_ref: '', registry_ref: '' })

  // per-asset action state
  const [returnForms, setReturnForms] = useState<Record<string, { amount: string; note: string }>>({})
  const [disburseForms, setDisburseForms] = useState<Record<string, { amount: string; note: string }>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/waqf')
    if (!res.ok) return
    const data: AssetWithMeta[] = await res.json()
    setAssets(data)
    // load transactions per asset
    const txMap: Record<string, WaqfTransaction[]> = {}
    await Promise.all(data.map(async a => {
      const r = await fetch(`/api/waqf/${a.id}`)
      if (r.ok) { const d = await r.json(); txMap[a.id] = d.transactions ?? [] }
    }))
    setTxsByAsset(txMap)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/admin/waqf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, unit_price: parseFloat(form.unit_price) }),
    })
    if (res.ok) { setShowCreate(false); setForm({ name: '', type: 'cash', description: '', currency: 'USD', country: '', unit_price: '', established_at: '', shariah_cert_ref: '', registry_ref: '' }); await load() }
    setCreating(false)
  }

  async function handleSeed() {
    setSeeding(true)
    await fetch('/api/admin/waqf/seed', { method: 'POST' })
    await load()
    setSeeding(false)
  }

  async function confirmShare(assetId: string, shareId: string) {
    setActionLoading(p => ({ ...p, [`confirm-${shareId}`]: true }))
    await fetch(`/api/admin/waqf/${assetId}/confirm-share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ share_id: shareId }) })
    await load()
    setActionLoading(p => ({ ...p, [`confirm-${shareId}`]: false }))
  }

  async function recordReturn(assetId: string) {
    const f = returnForms[assetId]
    if (!f?.amount) return
    setActionLoading(p => ({ ...p, [`return-${assetId}`]: true }))
    await fetch(`/api/admin/waqf/${assetId}/record-return`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(f.amount), note: f.note }) })
    setReturnForms(p => ({ ...p, [assetId]: { amount: '', note: '' } }))
    await load()
    setActionLoading(p => ({ ...p, [`return-${assetId}`]: false }))
  }

  async function disburse(assetId: string) {
    const f = disburseForms[assetId]
    if (!f?.amount || !f?.note) return
    setActionLoading(p => ({ ...p, [`disburse-${assetId}`]: true }))
    const res = await fetch(`/api/admin/waqf/${assetId}/disburse`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(f.amount), note: f.note }) })
    if (res.ok) { setDisburseForms(p => ({ ...p, [assetId]: { amount: '', note: '' } })); await load() }
    setActionLoading(p => ({ ...p, [`disburse-${assetId}`]: false }))
  }

  const totalPrincipal = assets.filter(a => a.currency === 'USD').reduce((s, a) => s + a.principal, 0)
  const totalReturnsYTD = assets.filter(a => a.currency === 'USD').reduce((s, a) => s + a.returns_ytd, 0)
  const totalShareholders = assets.reduce((s, a) => s + a.confirmed_shareholders, 0)

  return (
    <AdminSidebarLayout mosqueName={process.env.NEXT_PUBLIC_MOSQUE_NAME}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">WAQF</p>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">Waqf Portfolio</h1>
            <p className="arabic text-[#1A3D2B]/40 text-sm">إدارة الأوقاف</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {assets.length === 0 && !loading && (
              <button onClick={handleSeed} disabled={seeding} className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50">
                {seeding ? 'Seeding…' : 'Seed Demo Data'}
              </button>
            )}
            <button onClick={() => setShowCreate(v => !v)} className="px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors">
              {showCreate ? 'Cancel' : '+ New Programme'}
            </button>
            <a href="/waqf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:border-[#1A3D2B] hover:text-[#1A3D2B] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Public page
            </a>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Principal (USD)', value: fmt(totalPrincipal, 'USD') },
            { label: 'Returns YTD (USD)', value: fmt(totalReturnsYTD, 'USD') },
            { label: 'Active Programmes', value: String(assets.filter(a => a.status === 'active').length) },
            { label: 'Total Shareholders', value: String(totalShareholders) },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-[#1A3D2B]">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-[#1A3D2B]">Create Waqf Programme</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Programme Name *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Global Education Waqf" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Type *</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                  <option value="cash">Cash Endowment</option>
                  <option value="property">Property Waqf</option>
                  <option value="sukuk">Sukuk</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Currency *</label>
                <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Unit Price ({form.currency}) *</label>
                <input required type="number" min="1" step="0.01" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))} placeholder="e.g. 100" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Established Date *</label>
                <input required type="date" value={form.established_at} onChange={e => setForm(p => ({ ...p, established_at: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Country / Region</label>
                <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Jordan, Global, Singapore" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Purpose and beneficiaries of this waqf" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 resize-none"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Shariah Cert Ref</label>
                <input value={form.shariah_cert_ref} onChange={e => setForm(p => ({ ...p, shariah_cert_ref: e.target.value }))} placeholder="e.g. AAOIFI, Fatwa Council, Shariah Board ref." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Registry Reference</label>
                <input value={form.registry_ref} onChange={e => setForm(p => ({ ...p, registry_ref: e.target.value }))} placeholder="e.g. MUIS-2024-001, JAWF-2024-012, Waqf Registry No." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
            </div>
            <button type="submit" disabled={creating} className="px-6 py-2.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors disabled:opacity-50">
              {creating ? 'Creating…' : 'Create Programme'}
            </button>
          </form>
        )}

        {/* Asset cards */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No waqf programmes yet. Click &quot;Seed Demo Data&quot; to populate for the demo.</div>
        ) : assets.map(asset => {
          const rf = returnForms[asset.id] ?? { amount: '', note: '' }
          const df = disburseForms[asset.id] ?? { amount: '', note: '' }
          const txs = txsByAsset[asset.id] ?? []

          return (
            <div key={asset.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Asset header */}
              <div className="bg-[#1A3D2B] px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-semibold">{asset.type}</span>
                    {asset.country && <span className="text-white/40 text-[10px]">{asset.country}</span>}
                    <span className="px-2 py-0.5 rounded bg-green-900/50 text-green-300 text-[10px] font-semibold">{asset.status}</span>
                  </div>
                  <h2 className="text-white font-bold text-lg">{asset.name}</h2>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-white/40">Principal</p>
                  <p className="text-xl font-bold text-[#C9A84C]">{fmt(asset.principal, asset.currency)}</p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Returns Available', value: fmt(asset.returns_available, asset.currency), color: 'text-green-600' },
                    { label: 'Returns YTD', value: fmt(asset.returns_ytd, asset.currency), color: 'text-blue-600' },
                    { label: 'Returns Lifetime', value: fmt(asset.returns_lifetime, asset.currency), color: 'text-gray-700' },
                    { label: 'Shareholders', value: String(asset.confirmed_shareholders), color: 'text-gray-700' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-gray-400 mb-0.5">{s.label}</p>
                      <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Pending shares */}
                {asset.pending_shares.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-2">Pending Payment Confirmation ({asset.pending_shares.length})</p>
                    <div className="space-y-2">
                      {asset.pending_shares.map(s => (
                        <div key={s.id} className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.donor_name}</p>
                            <p className="text-xs text-gray-400">{s.donor_email} · {s.shares} share{s.shares > 1 ? 's' : ''} · {fmt(s.total, asset.currency)}</p>
                            {s.order_reference && <p className="text-[10px] font-mono text-gray-400">{s.order_reference}</p>}
                          </div>
                          <button
                            onClick={() => confirmShare(asset.id, s.id)}
                            disabled={actionLoading[`confirm-${s.id}`]}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading[`confirm-${s.id}`] ? '…' : 'Confirm'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Record Return */}
                  <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-blue-700">Record Return Earned</p>
                    <div className="flex gap-2">
                      <input type="number" min="0.01" step="0.01" value={rf.amount} onChange={e => setReturnForms(p => ({ ...p, [asset.id]: { ...rf, amount: e.target.value } }))} placeholder={`Amount (${asset.currency})`} className="flex-1 px-2.5 py-1.5 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"/>
                      <input value={rf.note} onChange={e => setReturnForms(p => ({ ...p, [asset.id]: { ...rf, note: e.target.value } }))} placeholder="Note (optional)" className="flex-1 px-2.5 py-1.5 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"/>
                      <button onClick={() => recordReturn(asset.id)} disabled={!rf.amount || actionLoading[`return-${asset.id}`]} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors">
                        {actionLoading[`return-${asset.id}`] ? '…' : 'Record'}
                      </button>
                    </div>
                  </div>

                  {/* Disburse */}
                  <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-700">Disburse Returns</p>
                    <div className="flex gap-2">
                      <input type="number" min="0.01" step="0.01" value={df.amount} onChange={e => setDisburseForms(p => ({ ...p, [asset.id]: { ...df, amount: e.target.value } }))} placeholder={`Amount (${asset.currency})`} className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"/>
                      <input required value={df.note} onChange={e => setDisburseForms(p => ({ ...p, [asset.id]: { ...df, note: e.target.value } }))} placeholder="Purpose *" className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"/>
                      <button onClick={() => disburse(asset.id)} disabled={!df.amount || !df.note || actionLoading[`disburse-${asset.id}`]} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-40 transition-colors">
                        {actionLoading[`disburse-${asset.id}`] ? '…' : 'Disburse'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transaction history */}
                {txs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2">Recent Transactions</p>
                    <div className="space-y-1.5">
                      {txs.slice(0, 8).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${TX_COLORS[tx.type] ?? 'bg-gray-100 text-gray-500'}`}>{tx.type.replace('_', ' ')}</span>
                            {tx.note && <span className="text-xs text-gray-500 truncate max-w-[200px]">{tx.note}</span>}
                          </div>
                          <span className={`font-semibold text-sm ${tx.amount < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {tx.amount < 0 ? '-' : '+'}{fmt(Math.abs(tx.amount), asset.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AdminSidebarLayout>
  )
}
