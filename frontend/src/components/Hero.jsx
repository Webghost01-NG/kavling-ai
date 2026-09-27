import React from "react";
import { ArrowUpRight, Sparkles, Building2, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export default function Hero({ t, setActiveTab }) {
  return (
    <section className="relative pt-12 pb-14 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Glow Effects */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-amber-500/5 blur-[100px] pointer-events-none rounded-full"></div>

      <div className="relative text-center max-w-4xl mx-auto space-y-6">
        {/* Network Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-emerald-400 backdrop-blur-md shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.hero.pill}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          {t.hero.titleStart}{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
            {t.hero.titleHighlight}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          {t.hero.subtitle}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setActiveTab("marketplace")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
          >
            <Building2 className="w-4 h-4" />
            {t.hero.ctaExplore}
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab("appraiser")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass-panel hover:bg-white/[0.08] text-white font-medium text-sm transition-all border border-white/10 hover:border-emerald-500/30"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {t.hero.ctaAppraise}
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-xs transition-all border border-amber-500/30 font-semibold"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            {t.hero.ctaDemo}
          </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-14 max-w-5xl mx-auto">
        {[
          { label: t.hero.stat1Label, value: t.hero.stat1Val, icon: Building2, color: "text-emerald-400" },
          { label: t.hero.stat2Label, value: t.hero.stat2Val, icon: TrendingUp, color: "text-amber-400" },
          { label: t.hero.stat3Label, value: t.hero.stat3Val, icon: ShieldCheck, color: "text-cyan-400" },
          { label: t.hero.stat4Label, value: t.hero.stat4Val, icon: Zap, color: "text-emerald-300" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl border border-white/5 bento-card relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
                <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/5 ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
