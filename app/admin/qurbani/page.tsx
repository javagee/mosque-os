'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import type { QurbaniCampaign, QurbaniOrder, QurbaniOrderStatus, QurbaniPartner, QurbaniSettlement, QurbaniAnimalType } from '@/types'

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
}

const STATUS_COLORS: Record<QurbaniOrderStatus, string> = {
  pending_payment:         'bg-gray-100 text-gray-600',
  confirmed:               'bg-blue-100 text-blue-700',
  partner_allocated:       'bg-indigo-100 text-indigo-700',
  animal_verified:         'bg-violet-100 text-violet-700',
  evidence_uploaded:       'bg-orange-100 text-orange-700',
  slaughter_approved:      'bg-emerald-100 text-emerald-700',
  slaughtered:             'bg-amber-100 text-amber-700',
  meat_processed:          'bg-yellow-100 text-yellow-700',
  distribution_dispatched: 'bg-teal-100 text-teal-700',
  distributed:             'bg-green-100 text-green-700',
  certificate_issued:      'bg-green-200 text-green-800',
  financially_settled:     'bg-emerald-200 text-emerald-800',
  closed:                  'bg-gray-200 text-gray-700',
  cancelled:               'bg-red-100 text-red-600',
}

const ANIMAL_TYPES: QurbaniAnimalType[] = ['sheep', 'goat', 'cow_share', 'cow_full', 'buffalo_share', 'buffalo_full']
const CURRENCIES = ['USD', 'GBP', 'EUR', 'SGD', 'SAR', 'AED', 'JOD', 'MYR']

export default function AdminQurbaniPage() {
  const [campaigns, setCampaigns] = useState<QurbaniCampaign[]>([])
  const [orders, setOrders] = useState<QurbaniOrder[]>([])
  const [partners, setPartners] = useState<QurbaniPartner[]>([])
  const [settlements, setSettlements] = useState<QurbaniSettlement[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  // Create campaign form
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [campYear, setCampYear] = useState(2027)
  const [campHijri, setCampHijri] = useState('1448H')
  const [campEidDate, setCampEidDate] = useState('2027-06-16')
  const [campDeadline, setCampDeadline] = useState('2027-06-18')
  const [campCurrency, setCampCurrency] = useState('USD')
  const [campAnimals, setCampAnimals] = useState([
    { type: 'sheep' as QurbaniAnimalType, label: 'Sheep / Goat', arabic: 'خروف / ماعز', pax: 1, price: 250, capacity: 50, enabled: true },
    { type: 'cow_share' as QurbaniAnimalType, label: 'Cow Share (1/7)', arabic: 'سُبُع البقر', pax: 1, price: 500, capacity: 70, enabled: true },
    { type: 'cow_full' as QurbaniAnimalType, label: 'Full Cow (7 shares)', arabic: 'بقرة كاملة', pax: 7, price: 3500, capacity: 10, enabled: true },
  ])

  // Update order inline
  const [editingOrder, setEditingOrder] = useState<string | null>(null)
  const [orderEdits, setOrderEdits] = useState<Partial<QurbaniOrder & { status: QurbaniOrderStatus }>>({})
  const [notifying, setNotifying] = useState<string | null>(null)
  const [notified, setNotified] = useState<Record<string, boolean>>({})
  const [notifyingAll, setNotifyingAll] = useState(false)
  const [notifyAllResult, setNotifyAllResult] = useState<string | null>(null)

  // Add partner form
  const [showAddPartner, setShowAddPartner] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const [partnerCountry, setPartnerCountry] = useState('')
  const [partnerCert, setPartnerCert] = useState('')
  const [partnerCap, setPartnerCap] = useState(50)
  const [partnerTypes, setPartnerTypes] = useState<QurbaniAnimalType[]>(['sheep', 'goat'])

  // Settlement form
  const [showCreateSettlement, setShowCreateSettlement] = useState(false)
  const [settlPartner, setSettlPartner] = useState('')
  const [settlAmount, setSettlAmount] = useState('')
  const [settlDate, setSettlDate] = useState(new Date().toISOString().split('T')[0])
  const [settlRef, setSettlRef] = useState('')
  const [settlNote, setSettlNote] = useState('')

  const load = useCallback(async () => {
    const [c, o, p, s] = await Promise.all([
      fetch('/api/admin/qurbani/campaigns').then(r => r.json()),
      fetch('/api/admin/qurbani/orders').then(r => r.json()),
      fetch('/api/admin/qurbani/partners').then(r => r.json()),
      fetch('/api/admin/qurbani/settlements').then(r => r.json()),
    ])
    setCampaigns(c)
    setOrders(o)
    setPartners(p)
    setSettlements(s)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function seed() {
    setSeeding(true)
    await fetch('/api/admin/qurbani/seed', { method: 'POST' })
    await load()
    setSeeding(false)
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault()
    const animals = campAnimals.filter(a => a.enabled).map(({ enabled: _, price, ...a }) => ({ ...a, price: price * 100 }))
    const res = await fetch('/api/admin/qurbani/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: campYear, hijri_year: campHijri, eid_date: campEidDate, fulfilment_deadline: campDeadline, currency: campCurrency, animals }),
    })
    if (res.ok) { await load(); setShowCreateCampaign(false) }
  }

  async function toggleCampaign(c: QurbaniCampaign) {
    await fetch(`/api/admin/qurbani/campaigns/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    })
    await load()
  }

  async function saveOrderEdit(id: string) {
    await fetch(`/api/admin/qurbani/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderEdits),
    })
    setEditingOrder(null)
    setOrderEdits({})
    await load()
  }

  async function sendNotification(id: string) {
    setNotifying(id)
    const res = await fetch(`/api/admin/qurbani/orders/${id}/notify`, { method: 'POST' })
    if (res.ok) setNotified(p => ({ ...p, [id]: true }))
    setNotifying(null)
  }

  async function notifyAll() {
    const NOTIFY_ELIGIBLE: QurbaniOrderStatus[] = ['slaughtered', 'distributed', 'certificate_issued']
    const targets = orders.filter(o => NOTIFY_ELIGIBLE.includes(o.status))
    if (!targets.length) return
    setNotifyingAll(true)
    setNotifyAllResult(null)
    const results = await Promise.all(targets.map(o =>
      fetch(`/api/admin/qurbani/orders/${o.id}/notify`, { method: 'POST' }).then(r => r.ok)
    ))
    const sent = results.filter(Boolean).length
    setNotified(p => Object.fromEntries([...Object.entries(p), ...targets.map(o => [o.id, true])]))
    setNotifyAllResult(`✓ Sent to ${sent} of ${targets.length}`)
    setNotifyingAll(false)
  }

  async function addPartner(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/qurbani/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: partnerName, country: partnerCountry, halal_cert_number: partnerCert, capacity_per_day: partnerCap, animal_types: partnerTypes }),
    })
    if (res.ok) { await load(); setShowAddPartner(false); setPartnerName(''); setPartnerCountry(''); setPartnerCert('') }
  }

  async function closeCampaign(c: QurbaniCampaign) {
    await fetch(`/api/admin/qurbani/campaigns/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false, closed_at: new Date().toISOString() }),
    })
    await load()
  }

  async function createSettlement(e: React.FormEvent) {
    e.preventDefault()
    const partner = partners.find(p => p.id === settlPartner)
    if (!partner || !activeCampaign) return
    await fetch('/api/admin/qurbani/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner_id: settlPartner,
        partner_name: partner.name,
        campaign_id: activeCampaign.id,
        order_ids: [],
        amount: Math.round(parseFloat(settlAmount) * 100),
        currency: activeCampaign.currency,
        payment_date: settlDate,
        payment_ref: settlRef || undefined,
        note: settlNote || undefined,
      }),
    })
    await load()
    setShowCreateSettlement(false)
    setSettlPartner(''); setSettlAmount(''); setSettlRef(''); setSettlNote('')
  }

  const activeCampaign = campaigns.find(c => c.active)
  const IN_PIPELINE: QurbaniOrderStatus[] = ['partner_allocated','animal_verified','evidence_uploaded','slaughter_approved','slaughtered','meat_processed','distribution_dispatched']
  const COMPLETE: QurbaniOrderStatus[] = ['distributed','certificate_issued','financially_settled','closed']
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending_payment').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    in_pipeline: orders.filter(o => IN_PIPELINE.includes(o.status)).length,
    complete: orders.filter(o => COMPLETE.includes(o.status)).length,
  }

  if (loading) {
    return (
      <AdminSidebarLayout>
        <div className="p-8 text-gray-400">Loading…</div>
      </AdminSidebarLayout>
    )
  }

  return (
    <AdminSidebarLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Qurbani</h1>
            <p className="arabic text-[#C9A84C] text-sm mt-0.5">أُضْحِيَة — Eid al-Adha</p>
          </div>
          {campaigns.length === 0 && (
            <button onClick={seed} disabled={seeding}
              className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-60">
              {seeding ? 'Seeding…' : 'Seed Demo Data'}
            </button>
          )}
        </div>

        {/* Campaign */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700">Campaign</h2>
            {campaigns.length === 0 && (
              <button onClick={() => setShowCreateCampaign(v => !v)}
                className="px-3 py-1.5 rounded-lg bg-[#1A3D2B] text-white text-sm font-semibold">
                + Create Campaign
              </button>
            )}
          </div>

          {showCreateCampaign && (
            <form onSubmit={createCampaign} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Year</label>
                  <input type="number" required value={campYear} onChange={e => setCampYear(+e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Hijri Year</label>
                  <input value={campHijri} onChange={e => setCampHijri(e.target.value)} placeholder="e.g. 1448H"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Eid Date</label>
                  <input type="date" required value={campEidDate} onChange={e => setCampEidDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fulfilment Deadline</label>
                  <input type="date" required value={campDeadline} onChange={e => setCampDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Currency</label>
                <select value={campCurrency} onChange={e => setCampCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Animal Catalogue (prices in {campCurrency})</p>
                {campAnimals.map((a, i) => (
                  <div key={a.type} className="flex items-center gap-3 mb-2">
                    <input type="checkbox" checked={a.enabled} onChange={e => setCampAnimals(prev => prev.map((x, j) => j === i ? { ...x, enabled: e.target.checked } : x))} />
                    <span className="text-sm w-40">{a.label}</span>
                    <span className="arabic text-[#C9A84C] text-sm">{a.arabic}</span>
                    <input type="number" min={1} value={a.price} onChange={e => setCampAnimals(prev => prev.map((x, j) => j === i ? { ...x, price: +e.target.value } : x))}
                      className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right" placeholder="Price" />
                    <input type="number" min={1} value={a.capacity} onChange={e => setCampAnimals(prev => prev.map((x, j) => j === i ? { ...x, capacity: +e.target.value } : x))}
                      className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right" placeholder="Cap" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold">Create Campaign</button>
                <button type="button" onClick={() => setShowCreateCampaign(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">Cancel</button>
              </div>
            </form>
          )}

          {activeCampaign && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">Qurbani {activeCampaign.year}{activeCampaign.hijri_year ? ` · ${activeCampaign.hijri_year}` : ''}</p>
                  <p className="text-sm text-gray-500">Eid: {activeCampaign.eid_date} · Deadline: {activeCampaign.fulfilment_deadline} · {activeCampaign.currency}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleCampaign(activeCampaign)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${activeCampaign.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {activeCampaign.active ? 'Active' : 'Inactive'}
                  </button>
                  {!activeCampaign.closed_at && (
                    <button onClick={() => closeCampaign(activeCampaign)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      Close Campaign
                    </button>
                  )}
                  {activeCampaign.closed_at && (
                    <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-500">
                      Closed {activeCampaign.closed_at.split('T')[0]}
                    </span>
                  )}
                </div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-400"><th className="text-left pb-1">Animal</th><th className="text-right pb-1">Price</th><th className="text-right pb-1">Capacity</th><th className="text-right pb-1">Ordered</th></tr></thead>
                <tbody>
                  {activeCampaign.animals.map(a => {
                    const taken = orders.filter(o => o.campaign_id === activeCampaign.id && o.animal_type === a.type && o.status !== 'cancelled').length
                    return (
                      <tr key={a.type} className="border-t border-gray-50">
                        <td className="py-1.5"><span className="arabic text-[#C9A84C] mr-1">{a.arabic}</span>{a.label}</td>
                        <td className="py-1.5 text-right font-semibold">{fmt(a.price, activeCampaign.currency)}</td>
                        <td className="py-1.5 text-right text-gray-500">{a.capacity ?? '∞'}</td>
                        <td className="py-1.5 text-right font-semibold text-[#1A3D2B]">{taken}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Orders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700">Orders</h2>
            {orders.some(o => (['slaughtered','distributed','certificate_issued'] as QurbaniOrderStatus[]).includes(o.status)) && (
              <div className="flex items-center gap-2">
                {notifyAllResult && <span className="text-xs text-green-600 font-semibold">{notifyAllResult}</span>}
                <button onClick={notifyAll} disabled={notifyingAll}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
                  {notifyingAll ? 'Sending…' : 'Notify All'}
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-5 gap-3 mb-4">
            {[
              { label: 'Total', value: stats.total, color: 'text-gray-800' },
              { label: 'Pending', value: stats.pending, color: 'text-gray-500' },
              { label: 'Confirmed', value: stats.confirmed, color: 'text-blue-700' },
              { label: 'In Progress', value: stats.in_pipeline, color: 'text-amber-700' },
              { label: 'Complete', value: stats.complete, color: 'text-green-700' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">No orders yet.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">Donor</th>
                    <th className="text-left px-4 py-3">Animal</th>
                    <th className="text-left px-4 py-3">Niyyah</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <>
                      <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{o.donor_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{o.order_reference}</p>
                        </td>
                        <td className="px-4 py-3">{o.animal_label}</td>
                        <td className="px-4 py-3 capitalize">
                          {o.niyyah}{o.niyyah_name ? <span className="block text-xs text-gray-400">{o.niyyah_name}</span> : null}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{fmt(o.amount, o.currency)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${STATUS_COLORS[o.status]}`}>{o.status.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {(['slaughtered','distributed','certificate_issued'] as QurbaniOrderStatus[]).includes(o.status) && (
                              <button
                                onClick={() => sendNotification(o.id)}
                                disabled={notifying === o.id}
                                className={`text-xs font-semibold transition-colors ${notified[o.id] ? 'text-green-600' : 'text-teal-600 hover:text-teal-800'} disabled:opacity-50`}
                              >
                                {notifying === o.id ? 'Sending…' : notified[o.id] ? '✓ Notified' : 'Notify'}
                              </button>
                            )}
                            <button onClick={() => { setEditingOrder(editingOrder === o.id ? null : o.id); setOrderEdits({ status: o.status, slaughter_date: o.slaughter_date, slaughter_location: o.slaughter_location, halal_cert_ref: o.halal_cert_ref, fulfilment_note: o.fulfilment_note, partner_id: o.partner_id, animal_id: o.animal_id, scheduled_slaughter_datetime: o.scheduled_slaughter_datetime, slaughter_evidence_url: o.slaughter_evidence_url, meat_weight_kg: o.meat_weight_kg, distribution_evidence_url: o.distribution_evidence_url, certificate_url: o.certificate_url, financial_settlement_ref: o.financial_settlement_ref }) }}
                              className="text-xs text-[#1A3D2B] font-semibold hover:underline">
                              {editingOrder === o.id ? 'Cancel' : 'Update'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editingOrder === o.id && (
                        <tr key={`${o.id}-edit`} className="bg-gray-50 border-t border-gray-100">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Status</label>
                                <select value={orderEdits.status ?? o.status} onChange={e => setOrderEdits(v => ({ ...v, status: e.target.value as QurbaniOrderStatus }))}
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5">
                                  {([
                                    ['pending_payment','Pending Payment'],
                                    ['confirmed','Confirmed'],
                                    ['partner_allocated','Partner Allocated'],
                                    ['animal_verified','Animal Verified'],
                                    ['evidence_uploaded','Evidence Uploaded'],
                                    ['slaughter_approved','Slaughter Approved'],
                                    ['slaughtered','Slaughtered'],
                                    ['meat_processed','Meat Processed'],
                                    ['distribution_dispatched','Distribution Dispatched'],
                                    ['distributed','Distributed'],
                                    ['certificate_issued','Certificate Issued'],
                                    ['financially_settled','Financially Settled'],
                                    ['closed','Closed'],
                                    ['cancelled','Cancelled'],
                                  ] as [QurbaniOrderStatus, string][]).map(([s, label]) => <option key={s} value={s}>{label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Slaughter Date</label>
                                <input type="date" value={orderEdits.slaughter_date ?? ''} onChange={e => setOrderEdits(v => ({ ...v, slaughter_date: e.target.value }))}
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Slaughter Location</label>
                                <input value={orderEdits.slaughter_location ?? ''} onChange={e => setOrderEdits(v => ({ ...v, slaughter_location: e.target.value }))} placeholder="Abattoir name, City"
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Halal Cert Ref</label>
                                <input value={orderEdits.halal_cert_ref ?? ''} onChange={e => setOrderEdits(v => ({ ...v, halal_cert_ref: e.target.value }))} placeholder="JAWF-2027-0142"
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500">Note</label>
                                <input value={orderEdits.fulfilment_note ?? ''} onChange={e => setOrderEdits(v => ({ ...v, fulfilment_note: e.target.value }))}
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Partner</label>
                                <select value={orderEdits.partner_id ?? ''} onChange={e => setOrderEdits(v => ({ ...v, partner_id: e.target.value, partner_name: partners.find(p => p.id === e.target.value)?.name }))}
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5">
                                  <option value="">— unassigned —</option>
                                  {partners.map(p => <option key={p.id} value={p.id}>{p.name}{p.country ? ` (${p.country})` : ''}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Animal ID</label>
                                <input value={orderEdits.animal_id ?? ''} onChange={e => setOrderEdits(v => ({ ...v, animal_id: e.target.value }))} placeholder="e.g. SHE-0042"
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Scheduled Slaughter</label>
                                <input type="datetime-local" value={orderEdits.scheduled_slaughter_datetime ?? ''} onChange={e => setOrderEdits(v => ({ ...v, scheduled_slaughter_datetime: e.target.value }))}
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Meat Weight (kg)</label>
                                <input type="number" step="0.1" min="0" value={orderEdits.meat_weight_kg ?? ''} onChange={e => setOrderEdits(v => ({ ...v, meat_weight_kg: e.target.value ? +e.target.value : undefined }))}
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500">Slaughter Evidence URL</label>
                                <input value={orderEdits.slaughter_evidence_url ?? ''} onChange={e => setOrderEdits(v => ({ ...v, slaughter_evidence_url: e.target.value }))} placeholder="https://…"
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500">Distribution Evidence URL</label>
                                <input value={orderEdits.distribution_evidence_url ?? ''} onChange={e => setOrderEdits(v => ({ ...v, distribution_evidence_url: e.target.value }))} placeholder="https://…"
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Certificate URL</label>
                                <input value={orderEdits.certificate_url ?? ''} onChange={e => setOrderEdits(v => ({ ...v, certificate_url: e.target.value }))} placeholder="https://…"
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Settlement Ref</label>
                                <input value={orderEdits.financial_settlement_ref ?? ''} onChange={e => setOrderEdits(v => ({ ...v, financial_settlement_ref: e.target.value }))} placeholder="Bank TXN or ref"
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm mt-0.5" />
                              </div>
                            </div>
                            <button onClick={() => saveOrderEdit(o.id)}
                              className="mt-3 px-4 py-1.5 rounded-lg bg-[#1A3D2B] text-white text-sm font-semibold">Save</button>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Partners */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700">Halal Partners</h2>
            <button onClick={() => setShowAddPartner(v => !v)}
              className="px-3 py-1.5 rounded-lg bg-[#1A3D2B] text-white text-sm font-semibold">+ Add Partner</button>
          </div>

          {showAddPartner && (
            <form onSubmit={addPartner} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Name <span className="text-red-400">*</span></label>
                  <input required value={partnerName} onChange={e => setPartnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Country</label>
                  <input value={partnerCountry} onChange={e => setPartnerCountry(e.target.value)} placeholder="e.g. Jordan"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Halal Cert Number</label>
                  <input value={partnerCert} onChange={e => setPartnerCert(e.target.value)} placeholder="JAWF-2027-0001"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Capacity / Day <span className="text-red-400">*</span></label>
                  <input type="number" required min={1} value={partnerCap} onChange={e => setPartnerCap(+e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Animal Types</p>
                <div className="flex flex-wrap gap-2">
                  {ANIMAL_TYPES.map(t => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={partnerTypes.includes(t)} onChange={e => setPartnerTypes(prev => e.target.checked ? [...prev, t] : prev.filter(x => x !== t))} />
                      <span className="text-sm">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold">Add Partner</button>
                <button type="button" onClick={() => setShowAddPartner(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">Cancel</button>
              </div>
            </form>
          )}

          {partners.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">Partner</th>
                    <th className="text-left px-4 py-3">Halal Cert</th>
                    <th className="text-right px-4 py-3">Cap/Day</th>
                    <th className="text-left px-4 py-3">Animals</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map(p => (
                    <tr key={p.id} className="border-t border-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{p.name}</p>
                        {p.country && <p className="text-xs text-gray-400">{p.country}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.halal_cert_number ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{p.capacity_per_day}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.animal_types.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Settlements */}
        {activeCampaign && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-700">Partner Settlements</h2>
              <button onClick={() => setShowCreateSettlement(v => !v)}
                className="px-3 py-1.5 rounded-lg bg-[#1A3D2B] text-white text-sm font-semibold">+ Record Payment</button>
            </div>

            {showCreateSettlement && (
              <form onSubmit={createSettlement} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Partner <span className="text-red-400">*</span></label>
                    <select required value={settlPartner} onChange={e => setSettlPartner(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20">
                      <option value="">— select partner —</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.name}{p.country ? ` (${p.country})` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Amount ({activeCampaign.currency}) <span className="text-red-400">*</span></label>
                    <input required type="number" step="0.01" min="0" value={settlAmount} onChange={e => setSettlAmount(e.target.value)} placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Date <span className="text-red-400">*</span></label>
                    <input required type="date" value={settlDate} onChange={e => setSettlDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Ref</label>
                    <input value={settlRef} onChange={e => setSettlRef(e.target.value)} placeholder="Bank TXN / FAST ref"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Note</label>
                    <input value={settlNote} onChange={e => setSettlNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/20" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold">Record Payment</button>
                  <button type="button" onClick={() => setShowCreateSettlement(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">Cancel</button>
                </div>
              </form>
            )}

            {/* Reconciliation per partner */}
            {partners.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">Reconciliation — {activeCampaign.year}</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-400">
                    <tr>
                      <th className="text-left px-4 py-2">Partner</th>
                      <th className="text-right px-4 py-2">Orders</th>
                      <th className="text-right px-4 py-2">Order Total</th>
                      <th className="text-right px-4 py-2">Settled</th>
                      <th className="text-right px-4 py-2">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map(p => {
                      const pOrders = orders.filter(o => o.partner_id === p.id && o.status !== 'cancelled' && o.status !== 'pending_payment')
                      const orderTotal = pOrders.reduce((sum, o) => sum + o.amount, 0)
                      const settled = settlements.filter(s => s.partner_id === p.id).reduce((sum, s) => sum + s.amount, 0)
                      const outstanding = orderTotal - settled
                      return (
                        <tr key={p.id} className="border-t border-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-semibold">{p.name}</p>
                            {p.country && <p className="text-xs text-gray-400">{p.country}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">{pOrders.length}</td>
                          <td className="px-4 py-3 text-right font-semibold">{fmt(orderTotal, activeCampaign.currency)}</td>
                          <td className="px-4 py-3 text-right text-green-700 font-semibold">{fmt(settled, activeCampaign.currency)}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${outstanding > 0 ? 'text-red-600' : 'text-gray-400'}`}>{fmt(outstanding, activeCampaign.currency)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Settlement history */}
            {settlements.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="text-left px-4 py-3">Partner</th>
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-right px-4 py-3">Amount</th>
                      <th className="text-left px-4 py-3">Ref</th>
                      <th className="text-left px-4 py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map(s => (
                      <tr key={s.id} className="border-t border-gray-50">
                        <td className="px-4 py-3 font-semibold">{s.partner_name}</td>
                        <td className="px-4 py-3 text-gray-500">{s.payment_date}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(s.amount, s.currency)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.payment_ref ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{s.note ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {settlements.length === 0 && !showCreateSettlement && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">No settlements recorded yet.</div>
            )}
          </section>
        )}
      </div>
    </AdminSidebarLayout>
  )
}
