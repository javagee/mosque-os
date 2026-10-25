'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/merchant/redeem'

  const [step, setStep] = useState<'pin' | 'merchant'>('pin')
  const [pin, setPin] = useState(['', '', '', ''])
  const [merchants, setMerchants] = useState<string[]>([])
  const [merchantName, setMerchantName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (step === 'merchant') {
      // Fetch merchant names from active campaigns
      fetch('/api/admin/campaigns')
        .then(r => r.json())
        .then((campaigns: { merchant_name: string; active: boolean }[]) => {
          const names = [...new Set(
            campaigns.filter(c => c.active).map(c => c.merchant_name)
          )].sort()
          setMerchants(names)
        })
        .catch(() => {})
    }
  }, [step])

  function handlePinChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...pin]
    next[i] = digit
    setPin(next)
    setError('')
    if (digit && i < 3) inputs.current[i + 1]?.focus()
    if (next.every(d => d !== '') && i === 3) validatePin(next.join(''))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  async function validatePin(code: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/merchant/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      })
      if (res.ok) {
        setStep('merchant')
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

  async function handleMerchantSubmit() {
    if (!merchantName) { setError('Please select your merchant'); return }
    setLoading(true)
    setError('')
    const fullPin = pin.join('')
    try {
      const res = await fetch('/api/merchant/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin, merchantName }),
      })
      if (res.ok) {
        router.push(from)
      } else {
        setError('Session expired — please re-enter your PIN')
        setStep('pin')
        setPin(['', '', '', ''])
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
          <p className="text-sm text-gray-400 mt-1">
            {step === 'pin' ? 'Enter your 4-digit PIN' : 'Select your merchant'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full ${step === 'pin' ? 'bg-[#1A3D2B]' : 'bg-[#1A3D2B]'}`} />
            <div className={`flex-1 h-1 rounded-full ${step === 'merchant' ? 'bg-[#1A3D2B]' : 'bg-gray-200'}`} />
          </div>

          {step === 'pin' ? (
            <>
              <p className="text-xs font-semibold text-gray-400 text-center mb-4">Step 1 of 2 — PIN</p>
              <div className="flex justify-center gap-3 mb-6">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(i, e.target.value)}
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
                onClick={() => validatePin(pin.join(''))}
                disabled={pin.some(d => !d) || loading}
                className="w-full py-3 bg-[#1A3D2B] text-white font-semibold rounded-xl hover:bg-[#2D6A4F] disabled:opacity-40 transition-colors"
              >
                {loading ? 'Verifying…' : 'Next →'}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-400 text-center mb-4">Step 2 of 2 — Merchant</p>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 mb-2">Your merchant name</label>
                {merchants.length > 0 ? (
                  <select
                    value={merchantName}
                    onChange={e => { setMerchantName(e.target.value); setError('') }}
                    className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B] bg-white"
                  >
                    <option value="">Select your merchant…</option>
                    {merchants.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={merchantName}
                    onChange={e => { setMerchantName(e.target.value); setError('') }}
                    placeholder="Type your merchant name"
                    className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3D2B]/30 focus:border-[#1A3D2B]"
                  />
                )}
              </div>
              {error && (
                <p className="text-center text-sm text-red-600 font-semibold mb-4">{error}</p>
              )}
              <button
                onClick={handleMerchantSubmit}
                disabled={!merchantName || loading}
                className="w-full py-3 bg-[#1A3D2B] text-white font-semibold rounded-xl hover:bg-[#2D6A4F] disabled:opacity-40 transition-colors"
              >
                {loading ? 'Entering portal…' : 'Enter portal'}
              </button>
              <button
                onClick={() => { setStep('pin'); setPin(['', '', '', '']); setError('') }}
                className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back
              </button>
            </>
          )}
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
