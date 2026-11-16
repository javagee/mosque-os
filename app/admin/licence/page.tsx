import AdminSidebarLayout from '@/components/admin/AdminSidebarLayout'

export const dynamic = 'force-dynamic'

const MODULES = [
  {
    id: 'sadaqah',
    label: 'Sadaqah',
    arabic: 'صدقة',
    description: 'Voluntary charitable giving with donor purpose restrictions, approved allocation, claim evidence and settlement reporting.',
    status: 'active' as const,
    authority: 'General charitable authority',
    note: 'Operational — basic donation flow active.',
  },
  {
    id: 'waqaf',
    label: 'Waqaf',
    arabic: 'وقف',
    description: 'Formal Islamic endowment with Am/Khas designation, verified trustee/mutawalli, deed-based purpose controls, principal/income separation.',
    status: 'active' as const,
    authority: 'AAOIFI GS-13 reference',
    note: 'MVP active — Am/Khas, jurisdiction codes and trustee fields now operational. Full deed-to-action enforcement is Phase 2.',
  },
  {
    id: 'zakat',
    label: 'Zakat',
    arabic: 'زكاة',
    description: 'Restricted obligatory giving — requires authorised zakat administration, asnaf eligibility verification, and asnaf-restricted distribution.',
    status: 'pending_review' as const,
    authority: 'Requires verified zakat authority appointment',
    note: 'Phase 2 — asnaf workflow, eligibility verification and reconciliation not yet built.',
  },
  {
    id: 'sadaqah_jariyah',
    label: 'Sadaqah Jariyah',
    arabic: 'صدقة جارية',
    description: 'Continuing charitable benefit without necessarily establishing a formal waqaf. Must be legally and substantively distinct from waqaf.',
    status: 'disabled' as const,
    authority: 'Requires independent legal review per jurisdiction',
    note: 'Phase 2 — must not be used to rename waqaf obligations. Separate legal review required.',
  },
]

const STATUS_CONFIG = {
  active:         { label: 'Active',         color: 'bg-green-100 text-green-700 border-green-200' },
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  disabled:       { label: 'Disabled',       color: 'bg-gray-100 text-gray-500 border-gray-200' },
  suspended:      { label: 'Suspended',      color: 'bg-red-100 text-red-700 border-red-200' },
  expired:        { label: 'Expired',        color: 'bg-red-100 text-red-600 border-red-200' },
}

export default function LicencePage() {
  const mosqueName = process.env.NEXT_PUBLIC_MOSQUE_NAME ?? 'Mosque'

  return (
    <AdminSidebarLayout mosqueName={mosqueName}>
      <div className="p-6 space-y-6 max-w-3xl">

        {/* Header */}
        <div>
          <p className="text-[#C9A84C] text-xs font-semibold tracking-widest mb-0.5">IAAS COMPLIANCE</p>
          <h1 className="text-2xl font-bold text-[#1A3D2B]">Licence & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Jurisdiction-aware module permissions following the IAAS Global architecture. A paid subscription does not unlock regulatory permission — each module requires verified legal authority.
          </p>
        </div>

        {/* Important notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Independent Shariah and legal review required</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Before activating regulated modules in production, obtain verified operating permissions from the relevant authority (MUIS, State Islamic Religious Councils, BWI, JAWF, or equivalent). This platform does not itself confer legal authority to solicit, collect, hold or distribute regulated funds.
            </p>
          </div>
        </div>

        {/* Module cards */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Module Permissions</p>
          {MODULES.map(mod => {
            const sc = STATUS_CONFIG[mod.status]
            return (
              <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-[#1A3D2B]">{mod.label}</h2>
                        <span className="arabic text-[#C9A84C] text-base">{mod.arabic}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.color}`}>{sc.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-lg">{mod.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Authority Required</p>
                    <p className="text-xs text-gray-600">{mod.authority}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Platform Status</p>
                    <p className="text-xs text-gray-600">{mod.note}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* IAAS licence activation flow */}
        <div className="bg-[#1A3D2B]/5 border border-[#1A3D2B]/10 rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#1A3D2B] mb-3">IAAS Licence Activation — 6-step flow (Phase 2)</p>
          <div className="flex flex-wrap gap-2 items-center">
            {['01 · Select jurisdiction', '02 · Verify institution', '03 · Declare permissions', '04 · Apply rules pack', '05 · Compliance review', '06 · Activate'].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600">{step}</span>
                {i < arr.length - 1 && <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">Full licence wizard, jurisdiction rules packs (SG · MY states · ID · JO), institutional approval workflow and compliance reviewer role are planned for Phase 2.</p>
        </div>

        {/* Reference links */}
        <div className="text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500">Reference authorities</p>
          <p>MUIS — About Wakaf (Singapore statutory position): muis.gov.sg/community/wakaf-administration/about-wakaf</p>
          <p>BWI — Pendaftaran Nazhir (Indonesia registration): bwi.go.id/literasiwakaf/pendaftaran-nazhir</p>
          <p>AAOIFI — Waqf Governance Standard GS-13: aaoifi.com</p>
          <p>Malaysia — Confirm governing enactment per state religious council; national label is not cross-state permission.</p>
        </div>

      </div>
    </AdminSidebarLayout>
  )
}
