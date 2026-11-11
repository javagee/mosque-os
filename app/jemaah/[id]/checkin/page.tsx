'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Jemaah } from '@/types'

export default function JemaahCheckinPage() {
  const { id } = useParams<{ id: string }>()
  const [state, setState] = useState<'loading' | 'success' | 'already' | 'error'>('loading')
  const [member, setMember] = useState<Jemaah | null>(null)

  useEffect(() => {
    fetch(`/api/jemaah/${id}/checkin`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setMember(data.member)
        setState(data.already ? 'already' : 'success')
      })
      .catch(() => setState('error'))
  }, [id])

  const today = new Date().toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className="min-h-screen bg-[#F0F4F3] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full text-center space-y-6">

        {state === 'loading' && (
          <div className="text-gray-400 text-sm animate-pulse">Checking in…</div>
        )}

        {state === 'success' && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#1A3D2B]/10 flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-[#1A3D2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-[#C9A84C] text-xs font-semibold tracking-widest">CHECKED IN</p>
              <h1 className="text-2xl font-bold text-[#1A3D2B] mt-1">Assalamu Alaikum</h1>
              {member && <p className="text-lg text-gray-700 font-medium mt-1">{member.name}</p>}
              <p className="text-sm text-gray-400 mt-1">{today}</p>
            </div>
            <p className="text-sm text-gray-500 arabic text-xl">مَرْحَباً بِكَ فِي الْمَسْجِد</p>
          </div>
        )}

        {state === 'already' && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-600 text-xs font-semibold tracking-widest">ALREADY CHECKED IN</p>
              <h1 className="text-xl font-bold text-[#1A3D2B] mt-1">
                {member ? `Welcome back, ${member.name.split(' ')[0]}` : 'Already checked in today'}
              </h1>
              <p className="text-sm text-gray-400 mt-1">{today}</p>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-red-500 text-xs font-semibold tracking-widest">ERROR</p>
              <p className="text-gray-600 text-sm mt-1">Could not check in. QR may be invalid.</p>
            </div>
          </div>
        )}

        {state !== 'loading' && (
          <div className="flex flex-col gap-2">
            {member && (
              <Link
                href={`/jemaah/${id}`}
                className="px-6 py-2.5 rounded-xl border border-[#1A3D2B] text-[#1A3D2B] text-sm font-semibold hover:bg-[#1A3D2B]/5 transition-colors"
              >
                View my QR card
              </Link>
            )}
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Back to home
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
