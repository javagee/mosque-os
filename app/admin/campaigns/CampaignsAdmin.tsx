'use client'

import { useState } from 'react'
import type { Campaign } from '@/types'
import type { CampaignInsertData } from '@/lib/db/types'
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'

const EMPTY_FORM: CampaignInsertData = {
  name: '',
  merchant_name: '',
  description: '',
  coupon_price: 0,
  currency: 'sgd',
  total_coupons: undefined,
  redemption_end: '',
  image_url: '',
  active: true,
}

function fmt(cents: number) {
  return `S$${(cents / 100).toFixed(2)}`
}

function CampaignForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: CampaignInsertData
  onSave: (data: CampaignInsertData) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<CampaignInsertData>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof CampaignInsertData, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Campaign name is required'); return }
    if (!form.merchant_name.trim()) { setError('Merchant name is required'); return }
    if (!form.coupon_price || form.coupon_price <= 0) { setError('Price must be greater than 0'); return }
    setSaving(true)
    try {
      await onSave(form)
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Campaign name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Spring Chicken Meal"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Merchant name *</label>
          <input
            type="text"
            value={form.merchant_name}
            onChange={e => set('merchant_name', e.target.value)}
            placeholder="e.g. Roti Prata House"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
        <textarea
          value={form.description ?? ''}
          onChange={e => set('description', e.target.value)}
          placeholder="What does this voucher include?"
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B] resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Voucher price (S$) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">S$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.coupon_price ? form.coupon_price / 100 : ''}
              onChange={e => set('coupon_price', Math.round(parseFloat(e.target.value || '0') * 100))}
              placeholder="18.00"
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
            />
          </div>
          {form.coupon_price > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Mosque: {fmt(Math.floor(form.coupon_price / 2))} · Merchant: {fmt(form.coupon_price - Math.floor(form.coupon_price / 2))}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Total vouchers (capacity)</label>
          <input
            type="number"
            min="1"
            value={form.total_coupons ?? ''}
            onChange={e => set('total_coupons', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g. 100"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Redemption deadline</label>
          <input
            type="date"
            value={form.redemption_end ? form.redemption_end.slice(0, 10) : ''}
            onChange={e => set('redemption_end', e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Image URL</label>
        <input
          type="url"
          value={form.image_url ?? ''}
          onChange={e => set('image_url', e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('active', !form.active)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.active ? 'bg-[#1A3D2B]' : 'bg-gray-300'}`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <span className="text-sm text-gray-600">
          {form.active ? 'Active — visible to buyers' : 'Inactive — hidden from buyers'}
        </span>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 bg-[#1A3D2B] text-white text-sm font-semibold rounded-xl hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save campaign'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function CampaignsAdmin({ initialCampaigns, mosqueName }: { initialCampaigns: Campaign[]; mosqueName: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [panel, setPanel] = useState<'closed' | 'new' | { id: string }>('closed')
  const [toggling, setToggling] = useState<string | null>(null)

  const editing = panel !== 'closed' && panel !== 'new' ? campaigns.find(c => c.id === (panel as { id: string }).id) : null

  async function handleCreate(data: CampaignInsertData) {
    const res = await fetch('/api/admin/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await res.text())
    const created: Campaign = await res.json()
    setCampaigns(cs => [created, ...cs])
    setPanel('closed')
  }

  async function handleUpdate(id: string, data: CampaignInsertData) {
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await res.text())
    const updated: Campaign = await res.json()
    setCampaigns(cs => cs.map(c => c.id === id ? updated : c))
    setPanel('closed')
  }

  async function toggleActive(campaign: Campaign) {
    setToggling(campaign.id)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !campaign.active }),
      })
      if (res.ok) {
        const updated: Campaign = await res.json()
        setCampaigns(cs => cs.map(c => c.id === campaign.id ? updated : c))
      }
    } finally {
      setToggling(null)
    }
  }

  const formInitial = editing
    ? {
        name: editing.name,
        merchant_name: editing.merchant_name,
        description: editing.description ?? '',
        coupon_price: editing.coupon_price,
        currency: editing.currency,
        total_coupons: editing.total_coupons,
        redemption_end: editing.redemption_end ?? '',
        image_url: editing.image_url ?? '',
        active: editing.active,
      }
    : EMPTY_FORM

  return (
    <AdminSidebarLayout mosqueName={mosqueName}>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">CAMPAIGNS</p>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">{mosqueName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => setPanel('new')}
            className="px-4 py-2 bg-[#1A3D2B] text-white text-sm font-semibold rounded-xl hover:bg-[#2D6A4F] transition-colors"
          >
            + New campaign
          </button>
        </div>

        {/* Create / Edit panel */}
        {panel !== 'closed' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">
                {panel === 'new' ? 'New campaign' : `Edit — ${editing?.name}`}
              </h2>
              <button onClick={() => setPanel('closed')} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5">
              <CampaignForm
                key={panel === 'new' ? 'new' : (panel as { id: string }).id}
                initial={formInitial}
                onSave={panel === 'new'
                  ? handleCreate
                  : (data) => handleUpdate((panel as { id: string }).id, data)
                }
                onCancel={() => setPanel('closed')}
              />
            </div>
          </div>
        )}

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <p className="font-semibold text-gray-500">No campaigns yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "New campaign" to create your first voucher campaign.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  {campaign.image_url && (
                    <img
                      src={campaign.image_url}
                      alt={campaign.name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        campaign.active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {campaign.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{campaign.merchant_name}</p>
                    {campaign.description && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{campaign.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="font-semibold text-[#1A3D2B]">
                        S${(campaign.coupon_price / 100).toFixed(2)} per voucher
                      </span>
                      <span>·</span>
                      <span>{campaign.coupons_sold} sold</span>
                      {campaign.total_coupons && <><span>·</span><span>of {campaign.total_coupons} total</span></>}
                      {campaign.redemption_end && (
                        <><span>·</span><span>Expires {new Date(campaign.redemption_end).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(campaign)}
                      disabled={toggling === campaign.id}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors disabled:opacity-50 ${
                        campaign.active
                          ? 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {toggling === campaign.id ? '…' : campaign.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setPanel({ id: campaign.id })}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors"
                    >
                      Edit
                    </button>
                    <a
                      href={`/campaigns/${campaign.id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors"
                    >
                      View ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminSidebarLayout>
  )
}
