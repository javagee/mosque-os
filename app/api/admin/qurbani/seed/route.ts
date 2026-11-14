import { NextResponse } from 'next/server'
import {
  getAllCampaigns, saveCampaign, generateCampaignId,
  saveQurbaniOrder, generateOrderId,
  savePartner, generatePartnerId,
} from '@/lib/qurbani-store'
import { saveOrder } from '@/lib/order-store'
import type { QurbaniCampaign, QurbaniOrder, QurbaniPartner, Order } from '@/types'

export const dynamic = 'force-dynamic'

function genRef() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = 'IMA-'
  for (let i = 0; i < 6; i++) r += c[Math.floor(Math.random() * c.length)]
  return r
}

export async function POST() {
  const existing = await getAllCampaigns()
  if (existing.length > 0) return NextResponse.json({ seeded: false, reason: 'already has data' })

  const campaign: QurbaniCampaign = {
    id: generateCampaignId(),
    year: 2027,
    hijri_year: '1448H',
    eid_date: '2027-06-16',
    fulfilment_deadline: '2027-06-18',
    currency: 'USD',
    animals: [
      { type: 'sheep', label: 'Sheep / Goat', arabic: 'خروف / ماعز', pax: 1, price: 25000, capacity: 50 },
      { type: 'cow_share', label: 'Cow Share (1/7)', arabic: 'سُبُع البقر', pax: 1, price: 50000, capacity: 70 },
      { type: 'cow_full', label: 'Full Cow (7 shares)', arabic: 'بقرة كاملة', pax: 7, price: 350000, capacity: 10 },
    ],
    active: true,
    created_at: new Date().toISOString(),
  }
  await saveCampaign(campaign)

  const partners: QurbaniPartner[] = [
    {
      id: generatePartnerId(), name: 'Jordan Halal Cooperative', country: 'Jordan',
      halal_cert_number: 'JAWF-2027-0142', capacity_per_day: 100,
      animal_types: ['sheep', 'goat', 'cow_share', 'cow_full'], active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: generatePartnerId(), name: 'Al-Iman Abattoir', country: 'Singapore',
      halal_cert_number: 'MUIS-H-2027-0088', capacity_per_day: 50,
      animal_types: ['sheep', 'goat'], active: true,
      created_at: new Date().toISOString(),
    },
  ]
  await Promise.all(partners.map(savePartner))

  const demoOrders: Array<{ donor: string; email: string; type: 'sheep' | 'cow_share'; status: QurbaniOrder['status']; niyyah: QurbaniOrder['niyyah']; extra?: Partial<QurbaniOrder> }> = [
    { donor: 'Ahmad Al-Rashidi', email: 'ahmad@example.com', type: 'sheep', status: 'confirmed', niyyah: 'self' },
    { donor: 'Siti Nurbaya', email: 'siti@example.com', type: 'cow_share', status: 'confirmed', niyyah: 'family', extra: { niyyah_name: 'Al-Rashidi Family' } },
    { donor: 'Omar Khalid', email: 'omar@example.com', type: 'sheep', status: 'slaughtered', niyyah: 'self', extra: { slaughter_date: '2027-06-16', slaughter_location: 'Jordan Halal Cooperative, Amman', halal_cert_ref: 'JAWF-2027-0142' } },
    { donor: 'Yusuf Abdullah', email: 'yusuf@example.com', type: 'cow_share', status: 'pending_payment', niyyah: 'deceased', extra: { niyyah_name: 'Abdullah bin Yusuf (rahimahullah)' } },
  ]

  for (const d of demoOrders) {
    const animal = campaign.animals.find(a => a.type === d.type)!
    const ref = genRef()
    const payNowOrder: Order = {
      reference: ref,
      campaign_id: `qurbani:${campaign.id}`,
      campaign_name: `Qurbani ${campaign.year} — ${animal.label}`,
      merchant_name: 'Qurbani Programme',
      buyer_name: d.donor,
      buyer_email: d.email,
      quantity: 1,
      unit_price: animal.price,
      total: animal.price,
      currency: campaign.currency,
      mosque_portion: animal.price,
      merchant_portion: 0,
      status: d.status === 'pending_payment' ? 'pending_payment' : 'verified',
      created_at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    }
    await saveOrder(payNowOrder)

    const qOrder: QurbaniOrder = {
      id: generateOrderId(),
      campaign_id: campaign.id,
      animal_type: d.type,
      animal_label: animal.label,
      niyyah: d.niyyah,
      donor_name: d.donor,
      donor_email: d.email,
      amount: animal.price,
      currency: campaign.currency,
      order_reference: ref,
      status: d.status,
      created_at: payNowOrder.created_at,
      ...d.extra,
    }
    await saveQurbaniOrder(qOrder)
  }

  return NextResponse.json({ seeded: true })
}
