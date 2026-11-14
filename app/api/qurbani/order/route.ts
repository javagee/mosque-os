import { NextRequest, NextResponse } from 'next/server'
import { getActiveCampaign, getCampaignOrders, saveQurbaniOrder, generateOrderId } from '@/lib/qurbani-store'
import { saveOrder } from '@/lib/order-store'
import type { Order, QurbaniOrder } from '@/types'

export const dynamic = 'force-dynamic'

function generateRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = 'IMA-'
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'Missing ref' }, { status: 400 })
  // Look up by QOR id or by order_reference
  const { getAllQurbaniOrders } = await import('@/lib/qurbani-store')
  const all = await getAllQurbaniOrders()
  const order = all.find(o => o.id === ref || o.order_reference === ref)
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

export async function POST(req: NextRequest) {
  const { campaign_id, animal_type, niyyah, niyyah_name, donor_name, donor_email, donor_phone } = await req.json()

  if (!campaign_id || !animal_type || !niyyah || !donor_name || !donor_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const campaign = await getActiveCampaign()
  if (!campaign || campaign.id !== campaign_id || !campaign.active) {
    return NextResponse.json({ error: 'Campaign not found or inactive' }, { status: 404 })
  }

  const animal = campaign.animals.find(a => a.type === animal_type)
  if (!animal) return NextResponse.json({ error: 'Animal type not available' }, { status: 400 })

  if (animal.capacity != null) {
    const existing = await getCampaignOrders(campaign.id)
    const taken = existing.filter(o => o.animal_type === animal_type && o.status !== 'cancelled').length
    if (taken >= animal.capacity) {
      return NextResponse.json({ error: 'This animal type is fully booked' }, { status: 400 })
    }
  }

  const reference = generateRef()

  const order: Order = {
    reference,
    campaign_id: `qurbani:${campaign.id}`,
    campaign_name: `Qurbani ${campaign.year} — ${animal.label}`,
    merchant_name: 'Qurbani Programme',
    buyer_name: donor_name.trim(),
    buyer_email: donor_email.trim().toLowerCase(),
    quantity: 1,
    unit_price: animal.price,
    total: animal.price,
    currency: campaign.currency,
    mosque_portion: animal.price,
    merchant_portion: 0,
    status: 'pending_payment',
    created_at: new Date().toISOString(),
  }
  await saveOrder(order)

  const qOrder: QurbaniOrder = {
    id: generateOrderId(),
    campaign_id: campaign.id,
    animal_type,
    animal_label: animal.label,
    niyyah,
    niyyah_name: niyyah_name?.trim() || undefined,
    donor_name: donor_name.trim(),
    donor_email: donor_email.trim().toLowerCase(),
    donor_phone: donor_phone?.trim() || undefined,
    amount: animal.price,
    currency: campaign.currency,
    order_reference: reference,
    status: 'pending_payment',
    created_at: new Date().toISOString(),
  }
  await saveQurbaniOrder(qOrder)

  return NextResponse.json({ order_reference: reference, qurbani_order_id: qOrder.id })
}
