import { notFound } from 'next/navigation'
import Nav from '@/components/layout/Nav'
import { getJemaah } from '@/lib/jemaah-store'
import JemaahQR from './JemaahQR'

export const dynamic = 'force-dynamic'

export default async function JemaahCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await getJemaah(id)
  if (!member) notFound()

  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const checkinUrl = `${appUrl}/jemaah/${member.id}/checkin`

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3] flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="bg-[#1A3D2B] px-6 py-5 text-center">
              <p className="text-[#C9A84C] text-xs font-semibold tracking-widest">JEMAAH</p>
              <p className="text-white text-sm mt-0.5">{mosqueName}</p>
            </div>

            {/* QR + name */}
            <div className="px-6 py-8 flex flex-col items-center gap-4">
              <JemaahQR checkinUrl={checkinUrl} />

              <div className="text-center">
                <p className="text-xl font-bold text-[#1A3D2B]">{member.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{member.id}</p>
              </div>

              <p className="text-xs text-gray-400 text-center max-w-[220px]">
                Show this QR code at the door to check in for prayers
              </p>
            </div>

            <div className="px-6 pb-6 text-center">
              <a
                href={`/jemaah/${member.id}/checkin`}
                className="inline-block px-6 py-2.5 rounded-xl bg-[#1A3D2B] text-white text-sm font-semibold hover:bg-[#153024] transition-colors"
              >
                Check in now
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Bookmark this page to access your QR card anytime
          </p>
        </div>
      </main>
    </>
  )
}
