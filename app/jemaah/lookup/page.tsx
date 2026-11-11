'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/layout/Nav'

export default function JemaahLookupPage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Our Mosque'
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/jemaah?email=${encodeURIComponent(email.trim())}`)
      if (res.status === 404) {
        setError('No account found with that email. Please register first.')
        return
      }
      if (!res.ok) { setError('Something went wrong'); return }
      const data = await res.json()
      router.push(`/jemaah/${data.id}`)
    } catch {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Nav mosqueName={mosqueName} />
      <main className="min-h-screen bg-[#F0F4F3] flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-md w-full">
          <div className="mb-6">
            <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-1">JEMAAH</p>
            <h1 className="text-2xl font-bold text-[#1A3D2B]">Find your QR card</h1>
            <p className="text-gray-500 text-sm mt-1">Enter the email you registered with</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D2B]"
                placeholder="ahmad@example.com"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1A3D2B] text-white font-semibold text-sm hover:bg-[#153024] transition-colors disabled:opacity-60"
            >
              {loading ? 'Looking up…' : 'Find my QR card'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Not registered yet?{' '}
            <a href="/jemaah/register" className="text-[#1A3D2B] font-medium hover:underline">Register here</a>
          </p>
        </div>
      </main>
    </>
  )
}
