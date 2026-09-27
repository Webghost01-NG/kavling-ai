import React from "react";
import { X, ShieldCheck, MapPin, Building2, TrendingUp, FileText, CheckCircle2, ExternalLink, Hash, Coins } from "lucide-react";
import { NETWORK_CONFIG } from "../data/mockData";

export default function PropertyDetailModal({ property, onClose, onInvest, t }) {
  if (!property) return null;

  const idrFormatted = (property.valuationUSD * 16250).toLocaleString("id-ID");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header Image */}
        <div className="relative h-64 w-full overflow-hidden">
          <img
            src={property.image}
            alt={property.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                {property.legalDeed}
              </div>
              <h3 className="text-2xl font-black text-white">{property.name}</h3>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {property.address}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">AI Appraised Value</div>
              <div className="text-2xl font-black text-amber-400">${property.valuationUSD.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400 font-mono">Rp {idrFormatted}</div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Projected APY
              </div>
              <div className="text-lg font-bold text-emerald-400 mt-1">{property.annualYieldPercent}%</div>
              <div className="text-[10px] text-slate-400">Paid monthly in USDT</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" /> Token Price
              </div>
              <div className="text-lg font-bold text-white mt-1">${property.pricePerFractionUSD}</div>
              <div className="text-[10px] text-slate-400">Min entry: $5.00</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-400" /> Land / Building
              </div>
              <div className="text-sm font-bold text-white mt-1">{property.landSizeM2}m² / {property.buildingSizeM2}m²</div>
              <div className="text-[10px] text-slate-400">{property.type}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-purple-400" /> Occupancy
              </div>
              <div className="text-lg font-bold text-white mt-1">{property.occupancyRate}</div>
              <div className="text-[10px] text-slate-400">${property.monthlyRentalPoolUSD}/mo pool</div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Asset Overview</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-4 rounded-2xl border border-slate-700/40">
              {property.description}
            </p>
          </div>

          {/* On-Chain Legal Provenance & EIP-712 */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-800/40 to-slate-800/40 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">EIP-712 Autonomous Appraisal Provenance</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                Verified On-Chain
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Vault Contract Address:</div>
                <div className="text-amber-300 truncate mt-0.5">{property.vaultAddress}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Legal Title Registry Hash:</div>
                <div className="text-slate-300 truncate mt-0.5">0x7f4b8109c...e84a (BPN Certified)</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span>Token Symbol: <strong className="text-white font-mono">{property.tokenSymbol}</strong></span>
              <a
                href={`${NETWORK_CONFIG.explorerUrl}/address/${property.vaultAddress}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:underline"
              >
                Inspect on BscScan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Available to invest:</div>
            <div className="text-sm font-bold text-white">{property.availableFractions.toLocaleString()} fractions remaining</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onInvest?.(property);
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              Invest in Micro-Kavling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
