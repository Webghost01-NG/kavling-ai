import React from "react";
import { Globe, Wallet, ShieldCheck, Cpu } from "lucide-react";

export default function Navbar({
  lang,
  setLang,
  activeTab,
  setActiveTab,
  wallet,
  openWalletModal,
  t
}) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab("marketplace")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-lg shadow-emerald-500/10 group-hover:border-emerald-400 transition-all">
            KA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Kavling AI
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                BNB Chain
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {t.nav.tagline}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {[
            { id: "marketplace", label: t.nav.marketplace },
            { id: "appraiser", label: t.nav.appraiser, badge: "AI" },
            { id: "yields", label: t.nav.yields },
            { id: "simulator", label: t.nav.simulator, highlight: true },
            { id: "docs", label: t.nav.docs }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    {tab.badge}
                  </span>
                )}
                {tab.highlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions: Language & Wallet */}
        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "id" : "en")}
            className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/5 transition-all"
            title="Toggle English / Bahasa Indonesia"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold uppercase">{lang}</span>
          </button>

          {/* Web3 Wallet */}
          <button
            onClick={openWalletModal}
            className={`flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-xl transition-all shadow-md ${
              wallet.connected
                ? "bg-slate-900 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/20"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            {wallet.connected ? (
              <span className="font-mono">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </span>
            ) : (
              <span>{t.nav.connect}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
