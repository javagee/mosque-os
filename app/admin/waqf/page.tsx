'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import type { WaqfAsset, WaqfShare, WaqfTransaction, WaqfClaim } from '@/types'

type AssetWithMeta = WaqfAsset & { confirmed_shareholders: number; pending_shares: WaqfShare[] }

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
  } catch {
    return `${currency} ${(amount / 100).toFixed(0)}`
  }
}

const TX_COLORS: Record<string, string> = {
  contribution:      'bg-green-100 text-green-700',
  return_earned:     'bg-blue-100 text-blue-700',
  disbursement:      'bg-amber-100 text-amber-700',
  admin_fee:         'bg-gray-100 text-gray-500',
  asset_acquisition: 'bg-purple-100 text-purple-700',
  asset_registered:  'bg-indigo-100 text-indigo-700',
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
  const [form, setForm] = useState({ name: '', type: 'cash', waqf_mode: 'income', designation: 'am', description: '', currency: 'USD', country: '', jurisdiction_code: '', trustee_name: '', deed_ref: '', unit_price: '', established_at: '', shariah_cert_ref: '', registry_ref: '' })

  // per-asset action state
  const [returnForms, setReturnForms] = useState<Record<string, { amount: string; note: string }>>({})
  const [disburseForms, setDisburseForms] = useState<Record<string, { amount: string; note: string; beneficiary_name: string; settlement_ref: string }>>({})
  const [claimForms, setClaimForms] = useState<Record<string, { amount: string; purpose: string; beneficiary_name: string }>>({})
  const [claimsByAsset, setClaimsByAsset] = useState<Record<string, WaqfClaim[]>>({})
  const [settleRefs, setSettleRefs] = useState<Record<string, string>>({})
  const [newClaimUrl, setNewClaimUrl] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/waqf')
    if (!res.ok) return
    const data: AssetWithMeta[] = await res.json()
    setAssets(data)
    // load transactions + claims per asset
    const txMap: Record<string, WaqfTransaction[]> = {}
    const claimMap: Record<string, WaqfClaim[]> = {}
    await Promise.all(data.map(async a => {
      const [txRes, claimRes] = await Promise.all([
        fetch(`/api/waqf/${a.id}`),
        fetch(`/api/admin/waqf/${a.id}/claims`),
      ])
      if (txRes.ok) { const d = await txRes.json(); txMap[a.id] = d.transactions ?? [] }
      if (claimRes.ok) { claimMap[a.id] = await claimRes.json() }
    }))
    setTxsByAsset(txMap)
    setClaimsByAsset(claimMap)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/admin/waqf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, unit_price: parseFloat(form.unit_price), designation: form.designation || undefined }),
    })
    if (res.ok) { setShowCreate(false); setForm({ name: '', type: 'cash', waqf_mode: 'income', designation: 'am', description: '', currency: 'USD', country: '', jurisdiction_code: '', trustee_name: '', deed_ref: '', unit_price: '', established_at: '', shariah_cert_ref: '', registry_ref: '' }); await load() }
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
    const res = await fetch(`/api/admin/waqf/${assetId}/disburse`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(f.amount), note: f.note, beneficiary_name: f.beneficiary_name || undefined, settlement_ref: f.settlement_ref || undefined }) })
    if (res.ok) { setDisburseForms(p => ({ ...p, [assetId]: { amount: '', note: '', beneficiary_name: '', settlement_ref: '' } })); await load() }
    setActionLoading(p => ({ ...p, [`disburse-${assetId}`]: false }))
  }

  async function issueClaim(assetId: string) {
    const f = claimForms[assetId]
    if (!f?.amount || !f?.purpose) return
    setActionLoading(p => ({ ...p, [`claim-${assetId}`]: true }))
    const res = await fetch(`/api/admin/waqf/${assetId}/issue-claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(f.amount), purpose: f.purpose, beneficiary_name: f.beneficiary_name || undefined }),
    })
    if (res.ok) {
      const { claim } = await res.json()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      setNewClaimUrl(p => ({ ...p, [assetId]: `${appUrl}/waqf/claim/${claim.id}` }))
      setClaimForms(p => ({ ...p, [assetId]: { amount: '', purpose: '', beneficiary_name: '' } }))
      await load()
    }
    setActionLoading(p => ({ ...p, [`claim-${assetId}`]: false }))
  }

  async function settleClaim(token: string) {
    const ref = settleRefs[token]
    if (!ref?.trim()) return
    setActionLoading(p => ({ ...p, [`settle-${token}`]: true }))
    const res = await fetch(`/api/admin/waqf/claims/${token}/settle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settlement_ref: ref }),
    })
    if (res.ok) {
      setSettleRefs(p => ({ ...p, [token]: '' }))
      await load()
    }
    setActionLoading(p => ({ ...p, [`settle-${token}`]: false }))
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">Designation (Am/Khas) *</label>
                <select value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                  <option value="am">Am — General Purpose</option>
                  <option value="khas">Khas — Deed-Restricted Specific Purpose</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Waqf Mode</label>
                <select value={form.waqf_mode} onChange={e => setForm(p => ({ ...p, waqf_mode: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                  <option value="income">Route A — Income Distribution (returns to beneficiaries)</option>
                  <option value="asset">Route B — Asset Acquisition (capital converts to registered asset)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Currency *</label>
                <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Jurisdiction Code</label>
                <select value={form.jurisdiction_code} onChange={e => setForm(p => ({ ...p, jurisdiction_code: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                  <option value="">— Select jurisdiction —</option>
                  <option value="SG">SG — Singapore (MUIS)</option>
                  <option value="MY-JHR">MY-JHR — Malaysia, Johor</option>
                  <option value="MY-KUL">MY-KUL — Malaysia, Kuala Lumpur</option>
                  <option value="MY-SEL">MY-SEL — Malaysia, Selangor</option>
                  <option value="MY-KED">MY-KED — Malaysia, Kedah</option>
                  <option value="ID-BWI">ID-BWI — Indonesia (BWI)</option>
                  <option value="JO">JO — Jordan (JAWF)</option>
                  <option value="SA">SA — Saudi Arabia</option>
                  <option value="AE">AE — United Arab Emirates</option>
                  <option value="GB">GB — United Kingdom</option>
                  <option value="Global">Global — Multi-jurisdiction</option>
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
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Trustee / Mutawalli / Nazhir</label>
                <input value={form.trustee_name} onChange={e => setForm(p => ({ ...p, trustee_name: e.target.value }))} placeholder="e.g. MUIS, Jordan Awqaf Foundation, BWI" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Deed Reference</label>
                <input value={form.deed_ref} onChange={e => setForm(p => ({ ...p, deed_ref: e.target.value }))} placeholder="e.g. MUIS-DEED-2024-001, JAWF-DEED-2024-012" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Purpose and beneficiaries of this waqf" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 resize-none"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Shariah Cert Ref</label>
                <input value={form.shariah_cert_ref} onChange={e => setForm(p => ({ ...p, shariah_cert_ref: e.target.value }))} placeholder="e.g. AAOIFI GS-13, Fatwa Council, Shariah Board ref." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
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
          const df = disburseForms[asset.id] ?? { amount: '', note: '', beneficiary_name: '', settlement_ref: '' }
          const cf = claimForms[asset.id] ?? { amount: '', purpose: '', beneficiary_name: '' }
          const claims = claimsByAsset[asset.id] ?? []
          const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin) : ''
          const txs = txsByAsset[asset.id] ?? []

          return (
            <div key={asset.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Asset header */}
              <div className="bg-[#1A3D2B] px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-semibold">{asset.type}</span>
                    {asset.designation && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${asset.designation === 'khas' ? 'bg-amber-500/30 text-amber-300' : 'bg-blue-500/20 text-blue-200'}`}>
                        {asset.designation === 'khas' ? 'Khas — Deed-Restricted' : 'Am — General Purpose'}
                      </span>
                    )}
                    {asset.waqf_mode && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${asset.waqf_mode === 'asset' ? 'bg-purple-500/30 text-purple-200' : 'bg-teal-500/20 text-teal-200'}`}>
                        {asset.waqf_mode === 'asset' ? 'Route B · Asset' : 'Route A · Income'}
                      </span>
                    )}
                    {asset.jurisdiction_code && <span className="px-2 py-0.5 rounded bg-white/10 text-white/50 text-[10px] font-mono">{asset.jurisdiction_code}</span>}
                    {asset.country && <span className="text-white/40 text-[10px]">{asset.country}</span>}
                    <span className="px-2 py-0.5 rounded bg-green-900/50 text-green-300 text-[10px] font-semibold">{asset.status}</span>
                  </div>
                  {(asset.trustee_name || asset.deed_ref) && (
                    <div className="flex flex-wrap gap-3 mt-1 mb-1">
                      {asset.trustee_name && <p className="text-white/50 text-[10px]">Trustee: {asset.trustee_name}</p>}
                      {asset.deed_ref && <p className="text-white/40 text-[10px] font-mono">Deed: {asset.deed_ref}</p>}
                    </div>
                  )}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                  {/* Disburse (direct, no QR) */}
                  <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-700">Direct Disburse (no QR)</p>
                    <div className="flex gap-2 flex-wrap">
                      <input type="number" min="0.01" step="0.01" value={df.amount} onChange={e => setDisburseForms(p => ({ ...p, [asset.id]: { ...df, amount: e.target.value } }))} placeholder={`Amount (${asset.currency})`} className="flex-1 min-w-[100px] px-2.5 py-1.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"/>
                      <input required value={df.note} onChange={e => setDisburseForms(p => ({ ...p, [asset.id]: { ...df, note: e.target.value } }))} placeholder="Purpose *" className="flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"/>
                      <input value={df.beneficiary_name} onChange={e => setDisburseForms(p => ({ ...p, [asset.id]: { ...df, beneficiary_name: e.target.value } }))} placeholder="Beneficiary name" className="flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"/>
                      <input value={df.settlement_ref} onChange={e => setDisburseForms(p => ({ ...p, [asset.id]: { ...df, settlement_ref: e.target.value } }))} placeholder="Settlement ref (bank/custodian)" className="flex-1 min-w-[150px] px-2.5 py-1.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"/>
                      <button onClick={() => disburse(asset.id)} disabled={!df.amount || !df.note || actionLoading[`disburse-${asset.id}`]} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-40 transition-colors">
                        {actionLoading[`disburse-${asset.id}`] ? '…' : 'Disburse'}
                      </button>
                    </div>
                  </div>
                  {/* Issue Claim QR */}
                  <div className="bg-teal-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-teal-700">Issue Claim QR (IAAS)</p>
                    <div className="space-y-1.5">
                      <input type="number" min="0.01" step="0.01" value={cf.amount} onChange={e => setClaimForms(p => ({ ...p, [asset.id]: { ...cf, amount: e.target.value } }))} placeholder={`Amount (${asset.currency})`} className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"/>
                      <input value={cf.purpose} onChange={e => setClaimForms(p => ({ ...p, [asset.id]: { ...cf, purpose: e.target.value } }))} placeholder="Purpose *" className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"/>
                      <input value={cf.beneficiary_name} onChange={e => setClaimForms(p => ({ ...p, [asset.id]: { ...cf, beneficiary_name: e.target.value } }))} placeholder="Beneficiary name" className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"/>
                      <button onClick={() => issueClaim(asset.id)} disabled={!cf.amount || !cf.purpose || actionLoading[`claim-${asset.id}`]} className="w-full px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-40 transition-colors">
                        {actionLoading[`claim-${asset.id}`] ? '…' : 'Issue Claim QR'}
                      </button>
                    </div>
                    {newClaimUrl[asset.id] && (
                      <div className="mt-2 bg-white rounded-lg border border-teal-200 p-2 space-y-1">
                        <p className="text-[10px] font-semibold text-teal-700">Claim issued — share this link:</p>
                        <p className="text-[10px] font-mono text-teal-600 break-all">{newClaimUrl[asset.id]}</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => { navigator.clipboard.writeText(newClaimUrl[asset.id]); }} className="px-2 py-1 rounded bg-teal-100 text-teal-700 text-[10px] font-semibold hover:bg-teal-200 transition-colors">Copy</button>
                          <a href={newClaimUrl[asset.id]} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded bg-teal-100 text-teal-700 text-[10px] font-semibold hover:bg-teal-200 transition-colors">Open →</a>
                          <button onClick={() => setNewClaimUrl(p => ({ ...p, [asset.id]: '' }))} className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-[10px] hover:bg-gray-200 transition-colors">Dismiss</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Claims section */}
                {claims.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2">Claim QR Vouchers ({claims.length})</p>
                    <div className="space-y-2">
                      {claims.map(c => {
                        const statusColor = { pending: 'bg-teal-100 text-teal-700', redeemed: 'bg-amber-100 text-amber-700', settled: 'bg-green-100 text-green-700', expired: 'bg-gray-100 text-gray-400' }[c.status] ?? 'bg-gray-100 text-gray-500'
                        return (
                          <div key={c.id} className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusColor}`}>{c.status}</span>
                                <span className="font-mono text-[10px] text-gray-400">{c.id}</span>
                                {c.beneficiary_name && <span className="text-xs text-gray-600">→ {c.beneficiary_name}</span>}
                              </div>
                              <span className="font-semibold text-sm text-amber-600">{fmt(c.amount, c.currency)}</span>
                            </div>
                            <p className="text-xs text-gray-500">{c.purpose}</p>
                            <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                              {c.redeemed_by && <span>Redeemed by: {c.redeemed_by}</span>}
                              {c.invoice_ref && <span>Invoice: {c.invoice_ref}</span>}
                              {c.settlement_ref && <span className="font-mono">Settlement: {c.settlement_ref}</span>}
                            </div>
                            {/* Settle button for redeemed claims */}
                            {c.status === 'redeemed' && (
                              <div className="flex gap-1.5 mt-1">
                                <input
                                  value={settleRefs[c.id] ?? ''}
                                  onChange={e => setSettleRefs(p => ({ ...p, [c.id]: e.target.value }))}
                                  placeholder="Bank / custodian settlement ref *"
                                  className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#1A3D2B]/20"
                                />
                                <button
                                  onClick={() => settleClaim(c.id)}
                                  disabled={!settleRefs[c.id]?.trim() || actionLoading[`settle-${c.id}`]}
                                  className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors"
                                >
                                  {actionLoading[`settle-${c.id}`] ? '…' : 'Mark Settled'}
                                </button>
                                <a href={`/waqf/claim/${c.id}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-gray-400 transition-colors">View QR</a>
                              </div>
                            )}
                            {c.status === 'pending' && (
                              <a href={`/waqf/claim/${c.id}`} target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] text-teal-600 hover:underline">View claim QR →</a>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Transaction history */}
                {txs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2">Recent Transactions</p>
                    <div className="space-y-1.5">
                      {txs.slice(0, 8).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${TX_COLORS[tx.type] ?? 'bg-gray-100 text-gray-500'}`}>{tx.type.replace(/_/g, ' ')}</span>
                            {tx.note && <span className="text-xs text-gray-500 truncate max-w-[180px]">{tx.note}</span>}
                            {tx.beneficiary_name && <span className="text-[10px] text-gray-400">→ {tx.beneficiary_name}</span>}
                            {tx.settlement_ref && <span className="text-[10px] font-mono text-gray-400">ref: {tx.settlement_ref}</span>}
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
