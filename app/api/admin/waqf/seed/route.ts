import { NextResponse } from 'next/server'
import {
  getAllWaqfAssets, saveWaqfAsset, saveWaqfShare, saveWaqfTx,
  generateWaqfId, generateShareId, generateTxId,
} from '@/lib/waqf-store'
import type { WaqfAsset, WaqfShare, WaqfTransaction } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST() {
  const existing = await getAllWaqfAssets()
  if (existing.length > 0) return NextResponse.json({ seeded: false, reason: 'already has data' })

  const now = new Date().toISOString()

  const asset1: WaqfAsset = {
    id: generateWaqfId(), name: 'Global Education Waqf', type: 'cash', currency: 'USD', country: 'Global',
    description: 'Perpetual endowment supporting Islamic education scholarships worldwide for children of the ummah.',
    established_at: '2024-01-15', unit_price: 10000, principal: 2500000, returns_available: 125000,
    returns_ytd: 125000, returns_lifetime: 625000, status: 'active', created_at: now,
  }
  const asset2: WaqfAsset = {
    id: generateWaqfId(), name: 'Mosque Infrastructure Waqf', type: 'cash', currency: 'USD', country: 'Global',
    description: 'Endowment for mosque construction, maintenance, and expansion to serve Muslim communities across the globe.',
    established_at: '2023-06-01', unit_price: 50000, principal: 10000000, returns_available: 500000,
    returns_ytd: 500000, returns_lifetime: 2000000, status: 'active', created_at: now,
  }
  const asset3: WaqfAsset = {
    id: generateWaqfId(), name: 'Al-Quds Relief Waqf', type: 'cash', currency: 'JOD', country: 'Jordan',
    description: 'Endowment dedicated to supporting families and communities in need across the Arab world.',
    registry_ref: 'JAWF-2024-012', established_at: '2024-03-01', unit_price: 5000, principal: 1000000,
    returns_available: 45000, returns_ytd: 45000, returns_lifetime: 120000, status: 'active', created_at: now,
  }

  await Promise.all([saveWaqfAsset(asset1), saveWaqfAsset(asset2), saveWaqfAsset(asset3)])

  const donors1 = [
    { name: 'Ahmad Al-Rashidi', email: 'ahmad@example.com', shares: 5 },
    { name: 'Fatimah Binte Hassan', email: 'fatimah@example.com', shares: 3 },
    { name: 'Omar Abdullah', email: 'omar@example.com', shares: 2 },
  ]
  const donors2 = [
    { name: 'Khalid Al-Mansouri', email: 'khalid@example.com', shares: 2 },
    { name: 'Zainab Ibrahim', email: 'zainab@example.com', shares: 1 },
  ]
  const donors3 = [
    { name: 'Yusuf Al-Hamdan', email: 'yusuf@example.com', shares: 4 },
    { name: 'Maryam Nasser', email: 'maryam@example.com', shares: 2 },
  ]

  async function seedShares(asset: WaqfAsset, donors: { name: string; email: string; shares: number }[]) {
    for (const d of donors) {
      const share: WaqfShare = {
        id: generateShareId(), asset_id: asset.id, asset_name: asset.name, currency: asset.currency,
        donor_name: d.name, donor_email: d.email, shares: d.shares,
        unit_price: asset.unit_price, total: asset.unit_price * d.shares,
        status: 'confirmed', created_at: now,
      }
      const tx: WaqfTransaction = {
        id: generateTxId(), asset_id: asset.id, type: 'contribution',
        amount: share.total, note: `${d.shares} share${d.shares > 1 ? 's' : ''} from ${d.name}`,
        created_at: now,
      }
      await Promise.all([saveWaqfShare(share), saveWaqfTx(tx)])
    }
    // seed a return_earned tx
    const returnTx: WaqfTransaction = {
      id: generateTxId(), asset_id: asset.id, type: 'return_earned',
      amount: asset.returns_ytd, note: 'Annual returns credited', created_at: now,
    }
    await saveWaqfTx(returnTx)
  }

  await Promise.all([
    seedShares(asset1, donors1),
    seedShares(asset2, donors2),
    seedShares(asset3, donors3),
  ])

  return NextResponse.json({ seeded: true })
}
