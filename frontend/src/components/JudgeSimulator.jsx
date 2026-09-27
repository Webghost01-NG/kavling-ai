import React, { useState } from "react";
import { Zap, Play, CheckCircle2, RotateCcw, ArrowRight, ShieldCheck, Cpu, Coins, ExternalLink } from "lucide-react";

export default function JudgeSimulator({ t, onSimulateAction }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);

  const steps = [
    {
      title: t.simulator.step1,
      description: t.simulator.step1Desc,
      icon: Cpu,
      color: "text-emerald-400",
      execute: async () => {
        addLog("▶ Initializing Kavling AI Property Valuation Agent...");
        await wait(600);
        addLog("📡 Fetching Badung, Bali geospatial comps & tourism occupancy data...");
        await wait(600);
        addLog("🤖 AVM Valuation: $750,000 USD (Net Cap Rate: 10.40% APY)");
        await wait(600);
        addLog("🔑 Generating EIP-712 Typed Data Signature with AI Agent private key...");
        await wait(500);
        addLog("✔ Signature: 0x89f41b3c9902e48231ad45bc901e479a83726105ce381a9412e0388410f931294821a84f9328a9c1e098485291b402847a982185c721038591823901bce471011c");
      }
    },
    {
      title: t.simulator.step2,
      description: t.simulator.step2Desc,
      icon: ShieldCheck,
      color: "text-amber-400",
      execute: async () => {
        addLog("▶ Submitting registerPropertyWithAppraisal() to KavlingRegistry on BNB Chain...");
        await wait(700);
        addLog("⛓️ KavlingRegistry.sol: Verifying EIP-712 recoveredSigner == aiAppraiserAgent...");
        await wait(600);
        addLog("✔ On-chain Verification PASSED. Property parcel created.");
        await wait(500);
        addLog("🚀 Deployed KavlingPropertyVault.sol (KVL-BALI) at 0x892a48B698C39F47738F31E83a7c64a38755694a");
        await wait(400);
        addLog("✔ Linked Vault to KavlingRegistry successfully. Tx: 0x7a810b42c98...3ef");
      }
    },
    {
      title: t.simulator.step3,
      description: t.simulator.step3Desc,
      icon: Coins,
      color: "text-cyan-400",
      execute: async () => {
        addLog("▶ Investor calls buyWithUSDT(1 fraction = $50.00)...");
        await wait(600);
        addLog("🪙 Minted 1.00 KVL-BALI tokens to investor wallet.");
        await wait(500);
        addLog("🏢 Physical tenant deposits $6,500 monthly rent to vault via depositRentalYield()...");
        await wait(600);
        addLog("💸 Investor claims pro-rata rental yield ($5.42 USDT) via claimRentalYield().");
        await wait(500);
        addLog("🎉 Full end-to-end cycle verified on BNB Chain Testnet!");
        onSimulateAction();
      }
    }
  ];

  const addLog = (msg) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleNextStep = async () => {
    if (currentStep >= steps.length) return;
    setIsProcessing(true);
    await steps[currentStep].execute();
    setCurrentStep((prev) => prev + 1);
    setIsProcessing(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setLogs([]);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-2">
          <Zap className="w-3.5 h-3.5" />
          {t.simulator.badge}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          {t.simulator.title}
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mt-1">
          {t.simulator.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step Progression Column */}
        <div className="lg:col-span-6 space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;

            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? "glass-panel-glow border-emerald-500/40 bg-emerald-500/[0.04]"
                    : isCompleted
                    ? "glass-panel border-emerald-500/20 opacity-80"
                    : "glass-panel border-white/5 opacity-40"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                      isCompleted
                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                        : isCurrent
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-slate-500 border-white/5"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center justify-between">
                      <span>{step.title}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono text-amber-400 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          Ready To Run
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Action Button */}
          <div className="flex items-center gap-3 pt-2">
            {currentStep < steps.length ? (
              <button
                onClick={handleNextStep}
                disabled={isProcessing}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all font-mono"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    Executing Step {currentStep + 1}...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {t.simulator.runBtn} (Step {currentStep + 1}/3)
                  </span>
                )}
              </button>
            ) : (
              <div className="flex-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.simulator.statusCompleted}</span>
              </div>
            )}

            <button
              onClick={handleReset}
              className="p-3 rounded-xl glass-panel hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all"
              title={t.simulator.resetBtn}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Terminal Logs Column */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-white/5 font-mono flex flex-col h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              <span className="text-[11px] text-slate-300 font-bold ml-1">kavling-telemetry-stdout</span>
            </div>
            <span className="text-[10px] text-emerald-400">BNB Chain Testnet</span>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-1.5 text-[11px] text-slate-300">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-emerald-500/80 select-none mr-1">$</span>
                  <span className={log.includes("✔") || log.includes("🎉") ? "text-emerald-300 font-semibold" : ""}>
                    {log}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 space-y-2">
                <Cpu className="w-8 h-8 text-slate-700" />
                <p>Click "Execute Next Step" to launch the autonomous protocol simulation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
