import Link from 'next/link'
import { db } from '@/lib/db'
import CampaignsAdmin from './CampaignsAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminCampaignsPage() {
  const campaigns = await db.getAllCampaigns()
  return <CampaignsAdmin initialCampaigns={campaigns} />
}
