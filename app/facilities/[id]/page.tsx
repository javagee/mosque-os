import { notFound } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import { getFacility } from '@/lib/facility-store'
import FacilityBookingForm from './FacilityBookingForm'

export const dynamic = 'force-dynamic'

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const facility = await getFacility(id)
  if (!facility || !facility.active) notFound()

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3] px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-1">FACILITY</p>
            <h1 className="text-3xl font-bold text-[#1A3D2B]">{facility.name}</h1>
          </div>

          {(facility.description || facility.capacity) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
              {facility.description && <p className="text-gray-600 text-sm">{facility.description}</p>}
              {facility.capacity && (
                <p className="text-sm text-gray-500">Capacity: <span className="font-medium text-gray-800">{facility.capacity} pax</span></p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#1A3D2B] text-base mb-4">Request to book</h2>
            <FacilityBookingForm facilityId={id} />
          </div>
        </div>
      </main>
    </>
  )
}
