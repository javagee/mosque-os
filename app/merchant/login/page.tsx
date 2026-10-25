'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/merchant/redeem'

  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const fullPin = pin.join('')

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[i] = digit
    setPin(next)
    setError('')
    if (digit && i < 3) inputs.current[i + 1]?.focus()
    if (next.every(d => d !== '') && i === 3) {
      submit(next.join(''))
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  async function submit(code: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/merchant/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      })
      if (res.ok) {
        router.push(from)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Incorrect PIN')
        setPin(['', '', '', ''])
        setTimeout(() => inputs.current[0]?.focus(), 50)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1A3D2B] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A3D2B]">Merchant Portal</h1>
          <p className="text-sm text-gray-400 mt-1">Enter your 4-digit PIN to continue</p>
        </div>

        {/* PIN input */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex justify-center gap-3 mb-6">
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition-colors ${
                  error
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : digit
                    ? 'border-[#1A3D2B] bg-[#E8F0EC] text-[#1A3D2B]'
                    : 'border-gray-200 bg-gray-50 text-gray-800'
                } ${loading ? 'opacity-50' : ''}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-red-600 font-semibold mb-4">{error}</p>
          )}

          <button
            onClick={() => fullPin.length === 4 && submit(fullPin)}
            disabled={fullPin.length < 4 || loading}
            className="w-full py-3 bg-[#1A3D2B] text-white font-semibold rounded-xl hover:bg-[#2D6A4F] disabled:opacity-40 transition-colors"
          >
            {loading ? 'Verifying…' : 'Enter'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Imara · {process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Mosque'} merchant portal
        </p>
      </div>
    </div>
  )
}

export default function MerchantLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
      <LoginForm />
    </Suspense>
  )
}
