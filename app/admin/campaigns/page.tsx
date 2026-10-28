import { db } from '@/lib/db'
import CampaignsAdmin from './CampaignsAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminCampaignsPage() {
  const campaigns = await db.getAllCampaigns()
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  return <CampaignsAdmin initialCampaigns={campaigns} mosqueName={mosqueName} />
}
