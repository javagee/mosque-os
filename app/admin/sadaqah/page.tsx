'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import type { SadaqahFund, SadaqahAllocation, SadaqahClaim } from '@/types'

function fmt(amount: number, currency: string) {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100) }
  catch { return `${currency} ${(amount / 100).toFixed(0)}` }
}

const ALLOC_STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  claimed:  'bg-teal-100 text-teal-700',
  settled:  'bg-green-100 text-green-700',
}

const CLAIM_STATUS_COLORS: Record<string, string> = {
  pending:  'bg-teal-100 text-teal-700',
  redeemed: 'bg-amber-100 text-amber-700',
  settled:  'bg-green-100 text-green-700',
  expired:  'bg-gray-100 text-gray-400',
}

const CURRENCIES = ['SGD', 'USD', 'GBP', 'MYR', 'JOD', 'SAR', 'AED']

export default function AdminSadaqahPage() {
  const [tab, setTab] = useState<'funds' | 'allocations'>('funds')
  const [funds, setFunds] = useState<SadaqahFund[]>([])
  const [allocations, setAllocations] = useState<SadaqahAllocation[]>([])
  const [claimsByAlloc, setClaimsByAlloc] = useState<Record<string, SadaqahClaim>>({})
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // create fund form
  const [showCreateFund, setShowCreateFund] = useState(false)
  const [fundForm, setFundForm] = useState({ name: '', description: '', currency: 'SGD', purpose_tag: '' })
  const [creatingFund, setCreatingFund] = useState(false)

  // receive form per fund
  const [receiveForms, setReceiveForms] = useState<Record<string, string>>({})

  // create allocation form
  const [showCreateAlloc, setShowCreateAlloc] = useState(false)
  const [allocForm, setAllocForm] = useState({ fund_id: '', amount: '', purpose: '', beneficiary_name: '' })
  const [creatingAlloc, setCreatingAlloc] = useState(false)

  // settle refs per claim
  const [settleRefs, setSettleRefs] = useState<Record<string, string>>({})
  // new claim URL after issue
  const [newClaimUrls, setNewClaimUrls] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const [fRes, aRes] = await Promise.all([
      fetch('/api/admin/sadaqah/funds'),
      fetch('/api/admin/sadaqah/allocations'),
    ])
    const [f, a]: [SadaqahFund[], SadaqahAllocation[]] = await Promise.all([fRes.json(), aRes.json()])
    setFunds(f)
    setAllocations(a)

    // fetch claims for allocations that have one
    const claimed = a.filter(al => al.claim_id)
    const claimMap: Record<string, SadaqahClaim> = {}
    await Promise.all(claimed.map(async al => {
      const r = await fetch(`/api/sadaqah/claims/${al.claim_id}`)
      if (r.ok) claimMap[al.id] = await r.json()
    }))
    setClaimsByAlloc(claimMap)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSeed() {
    setSeeding(true)
    await fetch('/api/admin/sadaqah/funds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'seed' }) })
    await load()
    setSeeding(false)
  }

  async function handleCreateFund(e: React.FormEvent) {
    e.preventDefault(); setCreatingFund(true)
    const res = await fetch('/api/admin/sadaqah/funds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fundForm) })
    if (res.ok) { setShowCreateFund(false); setFundForm({ name: '', description: '', currency: 'SGD', purpose_tag: '' }); await load() }
    setCreatingFund(false)
  }

  async function handleReceive(fundId: string) {
    const amount = receiveForms[fundId]
    if (!amount) return
    setActionLoading(p => ({ ...p, [`receive-${fundId}`]: true }))
    await fetch(`/api/admin/sadaqah/funds/${fundId}/receive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(amount) }) })
    setReceiveForms(p => ({ ...p, [fundId]: '' }))
    await load()
    setActionLoading(p => ({ ...p, [`receive-${fundId}`]: false }))
  }

  async function handleCreateAlloc(e: React.FormEvent) {
    e.preventDefault(); setCreatingAlloc(true)
    const res = await fetch('/api/admin/sadaqah/allocations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...allocForm, amount: parseFloat(allocForm.amount) }) })
    if (res.ok) { setShowCreateAlloc(false); setAllocForm({ fund_id: '', amount: '', purpose: '', beneficiary_name: '' }); await load() }
    setCreatingAlloc(false)
  }

  async function handleApprove(allocId: string) {
    setActionLoading(p => ({ ...p, [`approve-${allocId}`]: true }))
    await fetch(`/api/admin/sadaqah/allocations/${allocId}/approve`, { method: 'POST' })
    await load()
    setActionLoading(p => ({ ...p, [`approve-${allocId}`]: false }))
  }

  async function handleIssueClaim(allocId: string) {
    setActionLoading(p => ({ ...p, [`claim-${allocId}`]: true }))
    const res = await fetch(`/api/admin/sadaqah/allocations/${allocId}/issue-claim`, { method: 'POST' })
    if (res.ok) {
      const { claim } = await res.json()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      setNewClaimUrls(p => ({ ...p, [allocId]: `${appUrl}/sadaqah/claim/${claim.id}` }))
      await load()
    }
    setActionLoading(p => ({ ...p, [`claim-${allocId}`]: false }))
  }

  async function handleSettle(claimId: string, allocId: string) {
    const ref = settleRefs[claimId]
    if (!ref?.trim()) return
    setActionLoading(p => ({ ...p, [`settle-${claimId}`]: true }))
    await fetch(`/api/admin/sadaqah/claims/${claimId}/settle`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settlement_ref: ref }) })
    setSettleRefs(p => ({ ...p, [claimId]: '' }))
    await load()
    setActionLoading(p => ({ ...p, [`settle-${claimId}`]: false }))
    void allocId
  }

  const totalBalance = funds.filter(f => f.currency === 'SGD').reduce((s, f) => s + f.balance, 0)
  const totalReceived = funds.filter(f => f.currency === 'SGD').reduce((s, f) => s + f.received_total, 0)
  const pendingAllocs = allocations.filter(a => a.status === 'pending').length
  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin) : ''

  return (
    <AdminSidebarLayout mosqueName={process.env.NEXT_PUBLIC_MOSQUE_NAME}>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">SADAQAH</p>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">Sadaqah Fund Journey</h1>
            <p className="arabic text-[#1A3D2B]/40 text-sm">صَدَقَة — إِدَارَةُ الصَّنَادِيقِ وَالتَّخْصِيصَات</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {funds.length === 0 && !loading && (
              <button onClick={handleSeed} disabled={seeding} className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50">
                {seeding ? 'Seeding…' : 'Seed Demo Data'}
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Available Balance (SGD)', value: fmt(totalBalance, 'SGD') },
            { label: 'Total Received (SGD)',    value: fmt(totalReceived, 'SGD') },
            { label: 'Active Funds',            value: String(funds.filter(f => f.status === 'active').length) },
            { label: 'Pending Approval',        value: String(pendingAllocs), highlight: pendingAllocs > 0 },
          ].map(c => (
            <div key={c.label} className={`bg-white rounded-2xl border shadow-sm p-4 ${c.highlight ? 'border-amber-200' : 'border-gray-100'}`}>
              <p className="text-xs font-semibold text-gray-400 mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${c.highlight ? 'text-amber-600' : 'text-[#1A3D2B]'}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* IAAS rule note */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">IAAS Sadaqah journey: </span>
            Receive donations into a fund → Create allocation for a beneficiary/purpose → Approve → Issue Claim QR → Beneficiary redeems at merchant → Admin records settlement reference.
            Unlike Waqf, there is no principal protection — funds are disbursed directly.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {(['funds', 'allocations'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-[#1A3D2B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'funds' ? 'Funds' : `Allocations${pendingAllocs > 0 ? ` (${pendingAllocs} pending)` : ''}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : tab === 'funds' ? (
          <>
            {/* Create fund */}
            <div className="flex justify-end">
              <button onClick={() => setShowCreateFund(v => !v)} className="px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors">
                {showCreateFund ? 'Cancel' : '+ New Fund'}
              </button>
            </div>

            {showCreateFund && (
              <form onSubmit={handleCreateFund} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-bold text-[#1A3D2B]">Create Sadaqah Fund</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fund Name *</label>
                    <input required value={fundForm.name} onChange={e => setFundForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. General Sadaqah Fund, Palestine Relief" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Currency</label>
                    <select value={fundForm.currency} onChange={e => setFundForm(p => ({ ...p, currency: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Purpose Tag</label>
                    <input value={fundForm.purpose_tag} onChange={e => setFundForm(p => ({ ...p, purpose_tag: e.target.value }))} placeholder="e.g. Food Aid, Medical, Education" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                    <textarea value={fundForm.description} onChange={e => setFundForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 resize-none"/>
                  </div>
                </div>
                <button type="submit" disabled={creatingFund} className="px-6 py-2.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] disabled:opacity-50 transition-colors">
                  {creatingFund ? 'Creating…' : 'Create Fund'}
                </button>
              </form>
            )}

            {funds.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">No funds yet. Click &quot;Seed Demo Data&quot; to populate, or create one above.</div>
            ) : (
              <div className="space-y-4">
                {funds.map(fund => (
                  <div key={fund.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-[#1A3D2B] px-5 py-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {fund.purpose_tag && <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-semibold">{fund.purpose_tag}</span>}
                          <span className="px-2 py-0.5 rounded bg-white/10 text-white/50 text-[10px] font-mono">{fund.currency}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${fund.status === 'active' ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{fund.status}</span>
                        </div>
                        <h2 className="text-white font-bold text-lg">{fund.name}</h2>
                        {fund.description && <p className="text-white/40 text-xs mt-0.5 max-w-md">{fund.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-white/40">Available Balance</p>
                        <p className="text-xl font-bold text-[#C9A84C]">{fmt(fund.balance, fund.currency)}</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: 'Total Received', value: fmt(fund.received_total, fund.currency) },
                          { label: 'Total Disbursed', value: fmt(fund.disbursed_total, fund.currency) },
                          { label: 'Allocations', value: String(allocations.filter(a => a.fund_id === fund.id).length) },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-gray-400 mb-0.5">{s.label}</p>
                            <p className="text-base font-bold text-gray-700">{s.value}</p>
                          </div>
                        ))}
                      </div>
                      {/* Record Receipt */}
                      <div className="bg-green-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-green-700 mb-2">Record Sadaqah Receipt</p>
                        <div className="flex gap-2">
                          <input type="number" min="0.01" step="0.01" value={receiveForms[fund.id] ?? ''} onChange={e => setReceiveForms(p => ({ ...p, [fund.id]: e.target.value }))} placeholder={`Amount (${fund.currency})`} className="flex-1 px-2.5 py-1.5 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"/>
                          <button onClick={() => handleReceive(fund.id)} disabled={!receiveForms[fund.id] || actionLoading[`receive-${fund.id}`]} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors">
                            {actionLoading[`receive-${fund.id}`] ? '…' : 'Record'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Create allocation */}
            <div className="flex justify-end">
              <button onClick={() => setShowCreateAlloc(v => !v)} className="px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors">
                {showCreateAlloc ? 'Cancel' : '+ New Allocation'}
              </button>
            </div>

            {showCreateAlloc && (
              <form onSubmit={handleCreateAlloc} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="font-bold text-[#1A3D2B]">Create Allocation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">From Fund *</label>
                    <select required value={allocForm.fund_id} onChange={e => setAllocForm(p => ({ ...p, fund_id: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                      <option value="">— Select fund —</option>
                      {funds.filter(f => f.status === 'active').map(f => (
                        <option key={f.id} value={f.id}>{f.name} — {fmt(f.balance, f.currency)} available</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Amount *</label>
                    <input required type="number" min="0.01" step="0.01" value={allocForm.amount} onChange={e => setAllocForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 150" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Beneficiary Name</label>
                    <input value={allocForm.beneficiary_name} onChange={e => setAllocForm(p => ({ ...p, beneficiary_name: e.target.value }))} placeholder="e.g. Ahmad bin Yusuf" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Purpose *</label>
                    <input required value={allocForm.purpose} onChange={e => setAllocForm(p => ({ ...p, purpose: e.target.value }))} placeholder="e.g. Monthly food basket for Bilal household" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
                  </div>
                </div>
                <button type="submit" disabled={creatingAlloc} className="px-6 py-2.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] disabled:opacity-50 transition-colors">
                  {creatingAlloc ? 'Creating…' : 'Create Allocation'}
                </button>
              </form>
            )}

            {allocations.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">No allocations yet.</div>
            ) : (
              <div className="space-y-3">
                {allocations.map(alloc => {
                  const claim = claimsByAlloc[alloc.id]
                  const claimUrl = claim ? `${appUrl}/sadaqah/claim/${claim.id}` : ''
                  return (
                    <div key={alloc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4 flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ALLOC_STATUS_COLORS[alloc.status]}`}>{alloc.status}</span>
                            <span className="text-[10px] font-mono text-gray-300">{alloc.id}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{alloc.fund_name}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm">{alloc.purpose}</h3>
                          {alloc.beneficiary_name && <p className="text-xs text-gray-500 mt-0.5">For: {alloc.beneficiary_name}</p>}
                        </div>
                        <p className="font-bold text-amber-600 text-lg flex-shrink-0">{fmt(alloc.amount, alloc.currency)}</p>
                      </div>

                      {/* Action row */}
                      <div className="border-t border-gray-50 px-4 py-3 bg-gray-50 flex flex-wrap items-center gap-2">
                        {alloc.status === 'pending' && (
                          <button onClick={() => handleApprove(alloc.id)} disabled={actionLoading[`approve-${alloc.id}`]} className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {actionLoading[`approve-${alloc.id}`] ? '…' : '✓ Approve Allocation'}
                          </button>
                        )}
                        {alloc.status === 'approved' && (
                          <button onClick={() => handleIssueClaim(alloc.id)} disabled={actionLoading[`claim-${alloc.id}`]} className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
                            {actionLoading[`claim-${alloc.id}`] ? '…' : 'Issue Claim QR'}
                          </button>
                        )}
                        {alloc.claim_id && (
                          <a href={claimUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-teal-400 hover:text-teal-700 transition-colors">
                            View QR · {alloc.claim_id}
                          </a>
                        )}
                        {newClaimUrls[alloc.id] && (
                          <div className="w-full mt-1 bg-white rounded-lg border border-teal-200 p-2 flex items-center gap-2 flex-wrap">
                            <p className="text-[10px] font-mono text-teal-600 flex-1 break-all">{newClaimUrls[alloc.id]}</p>
                            <button onClick={() => navigator.clipboard.writeText(newClaimUrls[alloc.id])} className="px-2 py-0.5 rounded bg-teal-100 text-teal-700 text-[10px] font-semibold">Copy</button>
                            <button onClick={() => setNewClaimUrls(p => ({ ...p, [alloc.id]: '' }))} className="px-2 py-0.5 rounded bg-gray-100 text-gray-400 text-[10px]">×</button>
                          </div>
                        )}
                      </div>

                      {/* Claim details */}
                      {claim && (
                        <div className="border-t border-gray-50 px-4 py-3 space-y-2">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${CLAIM_STATUS_COLORS[claim.status]}`}>{claim.status}</span>
                              <span className="font-mono text-[10px] text-gray-400">{claim.id}</span>
                              {claim.redeemed_by && <span className="text-[10px] text-gray-500">Redeemed by: {claim.redeemed_by}</span>}
                              {claim.invoice_ref && <span className="text-[10px] font-mono text-gray-400">Invoice: {claim.invoice_ref}</span>}
                            </div>
                          </div>
                          {claim.status === 'redeemed' && (
                            <div className="flex gap-1.5">
                              <input value={settleRefs[claim.id] ?? ''} onChange={e => setSettleRefs(p => ({ ...p, [claim.id]: e.target.value }))} placeholder="Bank / custodian settlement reference *" className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#1A3D2B]/20"/>
                              <button onClick={() => handleSettle(claim.id, alloc.id)} disabled={!settleRefs[claim.id]?.trim() || actionLoading[`settle-${claim.id}`]} className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors">
                                {actionLoading[`settle-${claim.id}`] ? '…' : 'Mark Settled'}
                              </button>
                            </div>
                          )}
                          {claim.settlement_ref && (
                            <p className="text-[10px] font-mono text-green-600">Settlement ref: {claim.settlement_ref}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AdminSidebarLayout>
  )
}
