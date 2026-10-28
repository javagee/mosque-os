import { getAdminNotificationEmail } from '@/lib/settings-store'
import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'
import AdminSettingsForm from './AdminSettingsForm'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const notificationEmail = await getAdminNotificationEmail()
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  return (
    <AdminSidebarLayout mosqueName={mosqueName}>
      <div className="p-6 space-y-6">

        <div>
          <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">SETTINGS</p>
          <h1 className="text-2xl font-bold text-[#1A3D2B]">{mosqueName}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Admin configuration</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden max-w-2xl">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Notifications</h2>
            <p className="text-sm text-gray-400 mt-1">
              Email address that receives alerts when a buyer submits a PayNow payment and it is ready for bank verification.
            </p>
          </div>
          <div className="px-6 py-6">
            <AdminSettingsForm initialEmail={notificationEmail ?? ''} />
          </div>
        </div>

      </div>
    </AdminSidebarLayout>
  )
}
