import { getAdminNotificationEmail } from '@/lib/settings-store'
import AdminSignOut from '@/components/admin/AdminSignOut'
import AdminSettingsForm from './AdminSettingsForm'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const notificationEmail = await getAdminNotificationEmail()

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-800 text-[#1A3D2B]">Settings</h1>
            <p className="text-sm text-gray-400 mt-1">Imara · Admin configuration</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-sm text-[#1A3D2B] font-600 hover:underline">← Dashboard</a>
            <AdminSignOut />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-700 text-gray-800">Notifications</h2>
            <p className="text-sm text-gray-400 mt-1">
              Email address that receives alerts when a buyer submits a PayNow payment and it is ready for bank verification.
            </p>
          </div>
          <div className="px-6 py-6">
            <AdminSettingsForm initialEmail={notificationEmail ?? ''} />
          </div>
        </div>

      </div>
    </main>
  )
}
