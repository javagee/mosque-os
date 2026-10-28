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
    <div className="min-h-screen bg-[#1A3D2B] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-[#C9A84C] text-xl font-semibold tracking-wide mb-1">إِمَارَة · Imara</p>
          <h1 className="text-2xl font-bold text-white">Merchant Portal</h1>
          <p className="text-green-300/60 text-sm mt-1">
            {step === 'pin' ? 'Enter your 4-digit PIN' : 'Select your merchant'}
          </p>
        </div>

        <div className="bg-white/8 border border-white/10 backdrop-blur-sm rounded-2xl p-7">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-1 rounded-full bg-[#C9A84C]" />
            <div className={`flex-1 h-1 rounded-full ${step === 'merchant' ? 'bg-[#C9A84C]' : 'bg-white/15'}`} />
          </div>

          {step === 'pin' ? (
            <>
              <p className="text-xs font-semibold text-green-300/50 text-center mb-4 uppercase tracking-wide">Step 1 of 2 — PIN</p>
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
                        ? 'border-red-400 bg-red-900/20 text-red-300'
                        : digit
                        ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                        : 'border-white/20 bg-white/10 text-white'
                    } ${loading ? 'opacity-50' : ''}`}
                  />
                ))}
              </div>
              {error && (
                <p className="text-center text-sm text-red-400 font-semibold mb-4 bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                onClick={() => validatePin(pin.join(''))}
                disabled={pin.some(d => !d) || loading}
                className="w-full py-3.5 bg-[#C9A84C] text-[#1A3D2B] font-bold rounded-xl hover:bg-[#D4B865] disabled:opacity-40 transition-colors shadow-lg shadow-[#C9A84C]/20"
              >
                {loading ? 'Verifying…' : 'Next →'}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-green-300/50 text-center mb-4 uppercase tracking-wide">Step 2 of 2 — Merchant</p>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-green-300/70 mb-2 uppercase tracking-wide">Your merchant name</label>
                {merchants.length > 0 ? (
                  <select
                    value={merchantName}
                    onChange={e => { setMerchantName(e.target.value); setError('') }}
                    className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50 transition-all"
                  >
                    <option value="" className="bg-[#1A3D2B]">Select your merchant…</option>
                    {merchants.map(m => (
                      <option key={m} value={m} className="bg-[#1A3D2B]">{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={merchantName}
                    onChange={e => { setMerchantName(e.target.value); setError('') }}
                    placeholder="Type your merchant name"
                    className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 transition-all"
                  />
                )}
              </div>
              {error && (
                <p className="text-center text-sm text-red-400 font-semibold mb-4 bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                onClick={handleMerchantSubmit}
                disabled={!merchantName || loading}
                className="w-full py-3.5 bg-[#C9A84C] text-[#1A3D2B] font-bold rounded-xl hover:bg-[#D4B865] disabled:opacity-40 transition-colors shadow-lg shadow-[#C9A84C]/20"
              >
                {loading ? 'Entering portal…' : 'Enter portal'}
              </button>
              <button
                onClick={() => { setStep('pin'); setPin(['', '', '', '']); setError('') }}
                className="w-full mt-2 py-2 text-sm text-green-300/40 hover:text-green-300/70 transition-colors"
              >
                ← Back
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-green-300/30 mt-6">
          Imara · Mosque Management Platform
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
