'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StatusRefresh() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(30)

  useEffect(() => {
    const tick = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          router.refresh()
          return 30
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [router])

  return (
    <p className="text-xs text-gray-400 text-center mt-3">
      Auto-refreshing in <span className="font-semibold text-amber-600">{seconds}s</span> ·
      <button onClick={() => { router.refresh(); setSeconds(30) }} className="ml-1 text-[#1A3D2B] font-semibold hover:underline">
        Refresh now
      </button>
    </p>
  )
}
