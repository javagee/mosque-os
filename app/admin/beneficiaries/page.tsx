'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import { ASNAF_META } from '@/types'
import type { Beneficiary, AsnafCategory, BeneficiaryStatus } from '@/types'

const ASNAF_CATEGORIES = Object.keys(ASNAF_META) as AsnafCategory[]

const STATUS_COLORS: Record<BeneficiaryStatus, string> = {
  active:         'bg-green-100 text-green-700',
  inactive:       'bg-gray-100 text-gray-500',
  pending_review: 'bg-amber-100 text-amber-700',
}

const JURISDICTIONS = ['SG', 'MY-JHR', 'MY-KUL', 'MY-SEL', 'MY-KED', 'ID-BWI', 'JO', 'SA', 'AE', 'GB', 'Global']

export default function BeneficiariesPage() {
  const [all, setAll] = useState<Beneficiary[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [filterCategory, setFilterCategory] = useState<AsnafCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<BeneficiaryStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', asnaf_category: 'fakir' as AsnafCategory, ic_ref: '', phone: '', email: '', jurisdiction_code: '', case_ref: '', notes: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<BeneficiaryStatus>('active')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/beneficiaries')
    if (res.ok) setAll(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = all.filter(b => {
    if (filterCategory !== 'all' && b.asnaf_category !== filterCategory) return false
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    return true
  })

  async function handleSeed() {
    setSeeding(true)
    await fetch('/api/admin/beneficiaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'seed' }) })
    await load()
    setSeeding(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/admin/beneficiaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      setShowCreate(false)
      setForm({ name: '', asnaf_category: 'fakir', ic_ref: '', phone: '', email: '', jurisdiction_code: '', case_ref: '', notes: '' })
      await load()
    }
    setCreating(false)
  }

  async function handleSaveEdit(id: string) {
    setSaving(true)
    await fetch(`/api/admin/beneficiaries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: editStatus, notes: editNotes }) })
    setEditingId(null)
    await load()
    setSaving(false)
  }

  function startEdit(b: Beneficiary) {
    setEditingId(b.id)
    setEditStatus(b.status)
    setEditNotes(b.notes ?? '')
  }

  // summary counts
  const totalActive = all.filter(b => b.status === 'active').length
  const totalZakat = all.filter(b => b.zakat_eligible && b.status === 'active').length
  const totalPending = all.filter(b => b.status === 'pending_review').length
  const categoryCount = ASNAF_CATEGORIES.reduce((acc, c) => {
    acc[c] = all.filter(b => b.asnaf_category === c && b.status === 'active').length
    return acc
  }, {} as Record<AsnafCategory, number>)

  return (
    <AdminSidebarLayout mosqueName={process.env.NEXT_PUBLIC_MOSQUE_NAME}>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">IAAS · ASNAF</p>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">Beneficiary Registry</h1>
            <p className="arabic text-[#1A3D2B]/40 text-sm">سِجِلُّ الْمُسْتَفِيدِينَ وَالْأَصْنَاف</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {all.length === 0 && !loading && (
              <button onClick={handleSeed} disabled={seeding} className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50">
                {seeding ? 'Seeding…' : 'Seed Demo Data'}
              </button>
            )}
            <button onClick={() => setShowCreate(v => !v)} className="px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors">
              {showCreate ? 'Cancel' : '+ New Beneficiary'}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Beneficiaries', value: String(totalActive) },
            { label: 'Zakat Eligible',        value: String(totalZakat) },
            { label: 'Pending Review',         value: String(totalPending) },
            { label: 'Total Registered',       value: String(all.length) },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-[#1A3D2B]">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Asnaf category breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 mb-3">Active by Asnaf Category (8 Groups)</p>
          <div className="flex flex-wrap gap-2">
            {ASNAF_CATEGORIES.map(c => {
              const meta = ASNAF_META[c]
              const count = categoryCount[c]
              return (
                <button
                  key={c}
                  onClick={() => setFilterCategory(filterCategory === c ? 'all' : c)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterCategory === c ? 'ring-2 ring-[#1A3D2B] border-[#1A3D2B]' : 'border-gray-200'} ${meta.color}`}
                >
                  <span>{meta.label}</span>
                  <span className="arabic text-[10px] opacity-70">{meta.arabic}</span>
                  {count > 0 && <span className="ml-1 bg-white/50 rounded-full px-1.5">{count}</span>}
                  {!meta.zakat && <span className="ml-1 opacity-50 text-[9px]">sadaqah</span>}
                </button>
              )
            })}
            {filterCategory !== 'all' && (
              <button onClick={() => setFilterCategory('all')} className="px-3 py-1.5 rounded-xl text-xs text-gray-400 border border-dashed border-gray-200 hover:border-gray-400 transition-colors">
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* IAAS rule note */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex gap-3">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-green-700 leading-relaxed">
            <span className="font-semibold">IAAS eligibility rule: </span>
            Zakat distributions are restricted to the 8 asnaf categories. The <span className="font-semibold">General</span> category is not zakat-eligible — these beneficiaries may receive Sadaqah and Waqf income only. Verify eligibility with your appointed Zakat authority before distribution.
          </p>
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-[#1A3D2B]">Register Beneficiary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ahmad bin Yusuf, Community Youth Programme" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Asnaf Category *</label>
                <select value={form.asnaf_category} onChange={e => setForm(p => ({ ...p, asnaf_category: e.target.value as AsnafCategory }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                  {ASNAF_CATEGORIES.map(c => (
                    <option key={c} value={c}>{ASNAF_META[c].label} — {ASNAF_META[c].arabic}{!ASNAF_META[c].zakat ? ' (Sadaqah only)' : ''}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  {ASNAF_META[form.asnaf_category].zakat
                    ? '✓ Zakat eligible'
                    : '✗ Not zakat eligible — Sadaqah and Waqf income only'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Jurisdiction</label>
                <select value={form.jurisdiction_code} onChange={e => setForm(p => ({ ...p, jurisdiction_code: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                  <option value="">— Select —</option>
                  {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">IC / Passport (last 4 digits)</label>
                <input maxLength={4} value={form.ic_ref} onChange={e => setForm(p => ({ ...p, ic_ref: e.target.value }))} placeholder="e.g. 1234" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Case / File Reference</label>
                <input value={form.case_ref} onChange={e => setForm(p => ({ ...p, case_ref: e.target.value }))} placeholder="e.g. SG-2024-001" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+65 9XXX XXXX" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="optional" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Case Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Background, referral source, specific needs…" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20 resize-none"/>
              </div>
            </div>
            <button type="submit" disabled={creating} className="px-6 py-2.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#143020] transition-colors disabled:opacity-50">
              {creating ? 'Registering…' : 'Register Beneficiary'}
            </button>
          </form>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-gray-400">Status:</span>
          {(['all', 'active', 'pending_review', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-[#1A3D2B] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'}`}>
              {s === 'all' ? 'All' : s === 'pending_review' ? 'Pending Review' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} shown</span>
        </div>

        {/* Beneficiary list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {all.length === 0 ? 'No beneficiaries yet. Click "Seed Demo Data" to populate.' : 'No beneficiaries match the current filter.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => {
              const meta = ASNAF_META[b.asnaf_category]
              const isEditing = editingId === b.id
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${meta.color}`}>
                          {meta.label} <span className="arabic">{meta.arabic}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${meta.zakat ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                          {meta.zakat ? '✓ Zakat eligible' : '✗ Sadaqah only'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[b.status]}`}>
                          {b.status === 'pending_review' ? 'Pending Review' : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                        {b.jurisdiction_code && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-mono">{b.jurisdiction_code}</span>}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{b.name}</h3>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {b.case_ref && <span className="text-[10px] font-mono text-gray-400">Case: {b.case_ref}</span>}
                        {b.ic_ref && <span className="text-[10px] text-gray-400">IC: ···{b.ic_ref}</span>}
                        {b.phone && <span className="text-[10px] text-gray-400">{b.phone}</span>}
                        {b.email && <span className="text-[10px] text-gray-400">{b.email}</span>}
                      </div>
                      {b.notes && !isEditing && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{b.notes}</p>}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[10px] font-mono text-gray-300">{b.id}</p>
                      {!isEditing && (
                        <button onClick={() => startEdit(b)} className="mt-2 px-3 py-1 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-[#1A3D2B] hover:text-[#1A3D2B] transition-colors">
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 mb-1">Status</label>
                          <select value={editStatus} onChange={e => setEditStatus(e.target.value as BeneficiaryStatus)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                            <option value="active">Active</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 mb-1">Case Notes</label>
                          <input value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20"/>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(b.id)} disabled={saving} className="px-4 py-1.5 rounded-lg bg-[#1A3D2B] text-white text-xs font-semibold hover:bg-[#143020] disabled:opacity-50 transition-colors">
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-gray-400 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminSidebarLayout>
  )
}
