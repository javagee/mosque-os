import { NextRequest, NextResponse } from 'next/server'
import { getAllWaqfAssets, saveWaqfAsset, getAssetShares, generateWaqfId } from '@/lib/waqf-store'
import type { WaqfAsset } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const assets = await getAllWaqfAssets()
  const withShares = await Promise.all(
    assets.map(async a => {
      const shares = await getAssetShares(a.id)
      return {
        ...a,
        confirmed_shareholders: shares.filter(s => s.status === 'confirmed').length,
        pending_shares: shares.filter(s => s.status === 'pending'),
      }
    })
  )
  return NextResponse.json(withShares)
}

export async function POST(req: NextRequest) {
  const { name, type, waqf_mode, description, shariah_cert_ref, registry_ref, deed_ref, trustee_name, jurisdiction_code, designation, currency, country, unit_price, established_at } = await req.json()

  if (!name || !type || !unit_price || !established_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const asset: WaqfAsset = {
    id: generateWaqfId(),
    name: name.trim(),
    type,
    waqf_mode: waqf_mode || 'income',
    designation: designation || undefined,
    description: description?.trim(),
    shariah_cert_ref: shariah_cert_ref?.trim() || undefined,
    registry_ref: registry_ref?.trim() || undefined,
    deed_ref: deed_ref?.trim() || undefined,
    trustee_name: trustee_name?.trim() || undefined,
    jurisdiction_code: jurisdiction_code?.trim() || undefined,
    currency: currency || 'USD',
    country: country?.trim() || undefined,
    principal: 0,
    returns_available: 0,
    returns_ytd: 0,
    returns_lifetime: 0,
    unit_price: Math.round(unit_price * 100),
    status: 'active',
    established_at,
    created_at: new Date().toISOString(),
  }

  await saveWaqfAsset(asset)
  return NextResponse.json(asset)
}
