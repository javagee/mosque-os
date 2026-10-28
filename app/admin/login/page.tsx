'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/admin'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) { setError('Please enter username and password'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      if (res.ok) {
        router.push(from)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Incorrect credentials')
        setPassword('')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1A3D2B] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-[#C9A84C] text-xl font-semibold tracking-wide mb-1">إِمَارَة · Imara</p>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-green-300/60 text-sm mt-1">Mosque management back-office</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/8 border border-white/10 backdrop-blur-sm rounded-2xl p-7 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-green-300/70 mb-1.5 uppercase tracking-wide">Username</label>
            <input
              ref={usernameRef}
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              placeholder="admin"
              autoComplete="username"
              className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-green-300/70 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 font-semibold bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#C9A84C] text-[#1A3D2B] font-bold rounded-xl hover:bg-[#D4B865] disabled:opacity-50 transition-colors shadow-lg shadow-[#C9A84C]/20"
          >
            {loading ? 'Signing in…' : 'Sign in to Admin'}
          </button>
        </form>

        <p className="text-center text-xs text-green-300/30 mt-6">
          Imara · Mosque Management Platform
        </p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
      <LoginForm />
    </Suspense>
  )
}
