import React from "react";
import { FileCode, Shield, Cpu, Layers, ExternalLink } from "lucide-react";
import { NETWORK_CONFIG } from "../data/mockData";

export default function ArchitectureDocs({ lang }) {
  const isId = lang === "id";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
          <Layers className="w-3.5 h-3.5" />
          Technical Specifications
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          {isId ? "Arsitektur & Spesifikasi Protokol" : "Protocol Architecture & Smart Contracts"}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {isId
            ? "Pelajari bagaimana Kavling AI menghubungkan penilaian aset dunia nyata (RWA) berbasis AI dengan eksekusi cerdas di BNB Chain."
            : "Explore how Kavling AI bridges multi-factor AI property appraisals with decentralized execution on BNB Chain."}
        </p>
      </div>

      {/* Architecture Flow Diagram */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
          {isId ? "Alur Kerja Sistem (End-to-End)" : "End-to-End System Workflow"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              1. AVM AI Engine
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {isId
                ? "Agen menganalisis ukuran tanah, SHM, lokasi Bali/Jakarta, dan tren okupansi untuk menentukan valuasi wajar dan APY sewa."
                : "Agent parses geospatial comps, title deeds (SHM/HGB), and occupancy yields to generate fair market value."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              2. EIP-712 Signer
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {isId
                ? "Hasil valuasi di-hash dan ditandatangani secara kriptografis menggunakan private key agen AI penilai."
                : "Appraisal vector is hashed and signed using the AI Agent's designated ECDSA private key."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="text-cyan-400 font-bold flex items-center gap-1.5">
              <FileCode className="w-4 h-4" />
              3. KavlingRegistry
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {isId
                ? "Smart contract di BNB Chain memverifikasi tanda tangan EIP-712 agen dan mendaftarkan aset kavling."
                : "Solidity registry verifies EIP-712 signature and registers property on BNB Smart Chain."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="text-emerald-300 font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              4. Yield Streaming
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {isId
                ? "Penyewa menyetor sewa ke vault; investor mengklaim dividen sewa secara instan dan proporsional."
                : "Tenants deposit rental income; fractional holders claim pro-rata rental dividends anytime."}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Deployments Reference */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
          {isId ? "Referensi Smart Contract (BSC Testnet)" : "Smart Contract Reference (BSC Testnet)"}
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {[
            {
              name: "KavlingRegistry.sol",
              role: isId ? "Registry Utama & Validator EIP-712" : "Central Registry & EIP-712 Appraisal Validator",
              address: NETWORK_CONFIG.contracts.registry
            },
            {
              name: "KavlingPropertyVault.sol (Canggu)",
              role: isId ? "Vault Token Fraksional (KVL-BALI) & Streaming Sewa" : "Fractional ERC-20 Vault & Rental Yield Streaming",
              address: "0x892a48B698C39F47738F31E83a7c64a38755694a"
            },
            {
              name: "MockUSDT.sol",
              role: isId ? "Token Pembayaran & Faucet Testnet" : "Settlement Token & Testnet Faucet",
              address: NETWORK_CONFIG.contracts.mockUsdt
            }
          ].map((c, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-emerald-400 font-bold block">{c.name}</span>
                <span className="text-slate-400 text-[11px]">{c.role}</span>
              </div>
              <a
                href={`${NETWORK_CONFIG.explorerUrl}/address/${c.address}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-300 hover:text-emerald-400 text-xs py-1 px-2.5 rounded bg-white/5 border border-white/5"
              >
                <span>{c.address.slice(0, 10)}...{c.address.slice(-6)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
