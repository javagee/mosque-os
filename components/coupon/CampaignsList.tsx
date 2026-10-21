'use client'

import { useState } from 'react'
import CampaignCard from './CampaignCard'
import type { Campaign } from '@/types'

type ViewMode = 'list' | 'grid'

export default function CampaignsList({ campaigns }: { campaigns: Campaign[] }) {
  const [view, setView] = useState<ViewMode>('grid')

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            title="List view"
            className={`p-1.5 rounded-md transition-colors ${
              view === 'list' ? 'bg-[#1A3D2B] text-white' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setView('grid')}
            title="Grid view (2 columns)"
            className={`p-1.5 rounded-md transition-colors ${
              view === 'grid' ? 'bg-[#1A3D2B] text-white' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="space-y-5">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} compact />
          ))}
        </div>
      )}
    </div>
  )
}
