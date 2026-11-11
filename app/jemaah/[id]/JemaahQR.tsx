'use client'

import QRCode from 'react-qr-code'

export default function JemaahQR({ checkinUrl }: { checkinUrl: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl inline-block shadow-sm">
      <QRCode value={checkinUrl} size={180} />
    </div>
  )
}
