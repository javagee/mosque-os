import Link from 'next/link'
import Nav from '@/components/layout/Nav'
import { getAllFacilities } from '@/lib/facility-store'

export const dynamic = 'force-dynamic'

export default async function FacilitiesPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const facilities = (await getAllFacilities()).filter(f => f.active)

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3] px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-1">FACILITIES</p>
            <h1 className="text-3xl font-bold text-[#1A3D2B]">Book a Facility</h1>
            <p className="text-gray-500 text-sm mt-1">Request to use mosque spaces for your event or gathering</p>
          </div>

          {facilities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              No facilities available for booking. Contact the mosque for assistance.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {facilities.map(f => (
                <Link
                  key={f.id}
                  href={`/facilities/${f.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#1A3D2B]/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-[#1A3D2B] text-base">{f.name}</h2>
                      {f.description && <p className="text-gray-500 text-sm mt-1">{f.description}</p>}
                      {f.capacity && <p className="text-xs text-gray-400 mt-2">Capacity: {f.capacity} pax</p>}
                    </div>
                    <span className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-[#1A3D2B]/10 text-[#1A3D2B] text-xs font-semibold">
                      Book →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
