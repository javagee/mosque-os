import { NextRequest, NextResponse } from 'next/server'
import { getAdminNotificationEmail, setSetting, deleteSetting } from '@/lib/settings-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const notificationEmail = await getAdminNotificationEmail()
  return NextResponse.json({ notificationEmail: notificationEmail ?? '' })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { notificationEmail } = body as { notificationEmail?: string }

  if (notificationEmail === undefined) {
    return NextResponse.json({ error: 'Missing notificationEmail' }, { status: 400 })
  }

  const trimmed = notificationEmail.trim()

  if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (trimmed) {
    await setSetting('admin_notification_email', trimmed)
  } else {
    await deleteSetting('admin_notification_email')
  }

  return NextResponse.json({ success: true, notificationEmail: trimmed || null })
}
