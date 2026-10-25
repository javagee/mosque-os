'use client'

import { useRouter } from 'next/navigation'

export default function AdminSignOut() {
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      Sign out
    </button>
  )
}
