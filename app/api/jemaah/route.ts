import { NextRequest, NextResponse } from 'next/server'
import { getJemaahByEmail, saveJemaah, generateJemaahId } from '@/lib/jemaah-store'
import type { Jemaah } from '@/types'

export const dynamic = 'force-dynamic'

// GET /api/jemaah?email=... — lookup by email
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  const member = await getJemaahByEmail(email)
  if (!member) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(member)
}

// POST /api/jemaah — register (idempotent by email)
export async function POST(req: NextRequest) {
  const body = await req.json() as { name?: string; email?: string; phone?: string }
  const { name, email, phone } = body

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'name and email required' }, { status: 400 })
  }

  const existing = await getJemaahByEmail(email.trim())
  if (existing) return NextResponse.json(existing)

  const member: Jemaah = {
    id: generateJemaahId(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || undefined,
    created_at: new Date().toISOString(),
  }
  await saveJemaah(member)
  return NextResponse.json(member, { status: 201 })
}
