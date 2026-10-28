export default function DemoBar() {
  return (
    <div className="bg-[#111C16] border-b border-white/5 px-6 py-1.5 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="text-[10px] text-green-400/40 font-semibold tracking-widest">DEMO</span>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-green-400/40">Switch persona:</span>
          <a href="/api/demo/persona?persona=buyer" className="text-green-300/60 hover:text-[#C9A84C] transition-colors font-semibold">
            👤 Buyer
          </a>
          <a href="/api/demo/persona?persona=merchant" className="text-green-300/60 hover:text-[#C9A84C] transition-colors font-semibold">
            🏪 Merchant
          </a>
          <a href="/api/demo/persona?persona=admin" className="text-green-300/60 hover:text-[#C9A84C] transition-colors font-semibold">
            🛡 Admin
          </a>
        </div>
      </div>
    </div>
  )
}
