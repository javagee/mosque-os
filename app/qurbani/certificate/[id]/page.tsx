import { getAllQurbaniOrders } from '@/lib/qurbani-store'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const ELIGIBLE = ['distributed', 'certificate_issued', 'financially_settled', 'closed']

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
}

export default async function QurbaniCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const all = await getAllQurbaniOrders()
  const order = all.find(o => o.id === id || o.order_reference === id)

  if (!order) notFound()

  const eligible = ELIGIBLE.includes(order.status)
  const certDate = order.slaughter_date ?? new Date().toISOString().split('T')[0]

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .cert { box-shadow: none !important; border: 2px solid #1A3D2B !important; }
        }
        @page { size: A4; margin: 1.5cm; }
        body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #f0f4f0; }
      `}</style>

      <div className="no-print fixed top-4 right-4 flex gap-2 z-10">
        <button onClick={() => window.print()}
          style={{ background: '#1A3D2B', color: 'white', padding: '8px 20px', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
          Print / Save PDF
        </button>
        <a href="/qurbani/track"
          style={{ background: '#f0f0f0', color: '#333', padding: '8px 20px', borderRadius: 8, fontFamily: 'sans-serif', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
          ← Back
        </a>
      </div>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div className="cert" style={{ background: 'white', width: '100%', maxWidth: 680, padding: '48px 56px', boxShadow: '0 4px 32px rgba(0,0,0,0.12)', borderRadius: 4, border: '1px solid #d4d4d4' }}>

          {!eligible ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontFamily: 'sans-serif' }}>
              <p style={{ fontSize: 18, marginBottom: 8 }}>Certificate not yet available</p>
              <p style={{ fontSize: 14 }}>This certificate will be issued once the Qurbani has been distributed. Current status: <strong>{order.status.replace(/_/g, ' ')}</strong></p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1A3D2B', paddingBottom: 24, marginBottom: 28 }}>
                <p style={{ fontSize: 28, color: '#C9A84C', fontFamily: 'serif', margin: '0 0 4px' }}>شهادة الأضحية</p>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A3D2B', margin: '0 0 4px', letterSpacing: 1 }}>CERTIFICATE OF QURBANI</h1>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Udhiyah — Eid al-Adha</p>
              </div>

              {/* Body */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 6, fontFamily: 'sans-serif' }}>This is to certify that</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: '#1A3D2B', margin: '0 0 4px' }}>{order.donor_name}</p>
                {order.niyyah_name && (
                  <p style={{ fontSize: 14, color: '#555', margin: '0 0 16px', fontStyle: 'italic' }}>
                    on behalf of {order.niyyah_name}
                  </p>
                )}
                <p style={{ fontSize: 14, color: '#444', margin: '12px 0 0', fontFamily: 'sans-serif', lineHeight: 1.7 }}>
                  has performed Qurbani of one <strong>{order.animal_label}</strong><br />
                  with the niyyah of <strong style={{ textTransform: 'capitalize' }}>{order.niyyah}</strong>
                </p>
              </div>

              {/* Details grid */}
              {(() => {
                const details: [string, string][] = [
                  ['Animal', order.animal_label],
                  ['Amount', fmt(order.amount, order.currency)],
                  ['Date of Slaughter', certDate],
                  ...(order.slaughter_location ? [['Location', order.slaughter_location] as [string, string]] : []),
                  ...(order.partner_name ? [['Halal Partner', order.partner_name] as [string, string]] : []),
                  ...(order.halal_cert_ref ? [['Halal Cert Ref', order.halal_cert_ref] as [string, string]] : []),
                ]
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', background: '#f8faf8', borderRadius: 8, padding: '20px 24px', marginBottom: 28, fontFamily: 'sans-serif' }}>
                    {details.map(([label, value]) => (
                      <div key={label}>
                        <p style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 2px' }}>{label}</p>
                        <p style={{ fontSize: 14, color: '#1A3D2B', fontWeight: 600, margin: 0 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Arabic verse */}
              <div style={{ textAlign: 'center', margin: '20px 0', padding: '16px', borderTop: '1px solid #e8ede8', borderBottom: '1px solid #e8ede8' }}>
                <p style={{ fontSize: 20, color: '#C9A84C', fontFamily: 'serif', margin: '0 0 6px', lineHeight: 1.6 }}>
                  لَن يَنَالَ اللَّهَ لُحُومُهَا وَلَا دِمَاؤُهَا وَلَٰكِن يَنَالُهُ التَّقْوَىٰ مِنكُمْ
                </p>
                <p style={{ fontSize: 11, color: '#888', margin: 0, fontStyle: 'italic', fontFamily: 'sans-serif' }}>
                  "It is not their meat nor their blood that reaches Allah — it is your piety that reaches Him." — Quran 22:37
                </p>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, fontFamily: 'sans-serif' }}>
                <div>
                  <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>Reference</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#333', margin: 0, fontFamily: 'monospace' }}>{order.order_reference}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>Issued</p>
                  <p style={{ fontSize: 13, color: '#333', margin: 0 }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
