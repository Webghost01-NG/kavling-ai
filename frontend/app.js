/* Kavling browser client: honest local estimates with optional API-backed attestations. */

const API_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:8000" : window.location.origin;
const PROPERTY_SCENARIOS = [
  { name: "Canggu Sanctuary", city: "Bali", district: "Canggu", type: "Hospitality", value: 750000, fraction: 50, yield: 9.8 },
  { name: "SCBD Executive", city: "Jakarta", district: "SCBD", type: "Commercial", value: 1200000, fraction: 50, yield: 8.4 },
  { name: "Malioboro Heritage", city: "Yogyakarta", district: "Malioboro", type: "Hospitality", value: 450000, fraction: 50, yield: 10.5 },
];

const REGIONS = {
  Bali: { land: 1200, demand: 1.45, fault: "Sunda Megathrust Arc", resilience: 95.2 },
  Jakarta: { land: 4500, demand: 1.10, fault: "Baribis Fault & Subsidence Zone", resilience: 91.1 },
  Yogyakarta: { land: 1400, demand: 1.30, fault: "Opak Strike-Slip Fault", resilience: 94.6 },
  Bandung: { land: 1100, demand: 1.25, fault: "Lembang Active Fault", resilience: 92.8 },
};
const ZONING = { Pariwisata: { value: 1.15, yield: 180 }, Komersial: { value: 1.10, yield: 120 }, Residensial: { value: 1, yield: 0 }, Pertanian: { value: .70, yield: -200 } };
const TITLES = { SHM: 1, HGB: .92, "Hak Pakai": .85 };
let currentLang = "en";
let userWallet = null;

document.addEventListener("DOMContentLoaded", () => {
  renderProperties();
  document.getElementById("appraisal-form").addEventListener("submit", handleAppraisalSubmit);
  document.getElementById("wallet-btn").addEventListener("click", handleWalletConnect);
  document.getElementById("judge-sim-btn").addEventListener("click", previewLifecycle);
  document.getElementById("lang-toggle").addEventListener("click", toggleLanguage);
  document.getElementById("appraisal-form").dispatchEvent(new Event("submit"));
});

function renderProperties() {
  const container = document.getElementById("property-list");
  PROPERTY_SCENARIOS.forEach((property) => {
    const card = document.createElement("article");
    card.className = "listing";
    card.innerHTML = `<div><div class="listing-title">${property.name}</div><div class="listing-meta">${property.city} · ${property.district} · ${property.type}</div></div><span class="listing-badge">DEMO SCENARIO</span><div class="listing-metrics"><span>Value <strong>$${property.value.toLocaleString()}</strong></span><span>Fraction <strong>$${property.fraction}</strong></span><span>Model yield <strong>${property.yield}%</strong></span></div>`;
    card.addEventListener("click", () => selectScenario(property));
    container.appendChild(card);
  });
}

function selectScenario(property) {
  document.getElementById("inp-city").value = property.city;
  document.getElementById("inp-land").value = property.city === "Jakarta" ? 120 : property.city === "Yogyakarta" ? 480 : 500;
  document.getElementById("inp-build").value = property.city === "Jakarta" ? 260 : property.city === "Yogyakarta" ? 520 : 350;
  document.getElementById("appraisal-form").dispatchEvent(new Event("submit"));
  document.getElementById("valuation").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleAppraisalSubmit(event) {
  event.preventDefault();
  const params = {
    city: document.getElementById("inp-city").value,
    land: Number(document.getElementById("inp-land").value),
    building: Number(document.getElementById("inp-build").value),
    zoning: document.getElementById("inp-zoning").value,
    title: document.getElementById("inp-title").value,
  };
  const button = document.getElementById("calc-submit-btn");
  button.disabled = true;
  button.firstChild.textContent = "Calculating... ";
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/appraise`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city: params.city, district: districtFor(params.city), land_area_m2: params.land, building_area_m2: params.building, zoning: params.zoning, title: params.title, nonce: Date.now(), verifying_contract: "0x1234567890123456789012345678901234567890" }) }, 3500);
    if (!response.ok) throw new Error(`agent returned ${response.status}`);
    const data = await response.json();
    displayAppraisal(data.appraisal, data.eip712_proof, "Agent API · signed proof returned");
  } catch (error) {
    displayAppraisal(localEstimate(params), null, "Local estimate · agent service unavailable");
  } finally {
    button.disabled = false;
    button.firstChild.textContent = "Run valuation ";
  }
}

function localEstimate({ city, land, building, zoning, title }) {
  const region = REGIONS[city] || REGIONS.Bali;
  const zone = ZONING[zoning] || ZONING.Residensial;
  const titleFactor = TITLES[title] || 1;
  const value = Math.round((land * region.land * zone.value * titleFactor + building * 700) / 1000) * 1000;
  const yieldPercent = Math.max(5.5, Math.min(14.5, 7.5 + (region.demand - 1) * 8 + zone.yield / 100));
  return { valuation_usd: value, price_per_fraction_usd: value / 10000, annual_yield_percent: Number(yieldPercent.toFixed(2)), risk_assessment: { active_fault_zone: region.fault, resilience_score: region.resilience } };
}

function displayAppraisal(appraisal, proof, source) {
  document.getElementById("res-val").textContent = money(appraisal.valuation_usd);
  document.getElementById("res-fraction").textContent = money(appraisal.price_per_fraction_usd);
  document.getElementById("res-yield").textContent = `${appraisal.annual_yield_percent}%`;
  document.getElementById("res-resilience").textContent = `${appraisal.risk_assessment.resilience_score} / 100`;
  document.getElementById("appraisal-source").textContent = source;
  const proofStatus = document.getElementById("proof-status");
  const proofBox = document.getElementById("eip-proof-box");
  if (proof) {
    proofStatus.textContent = "Signed payload";
    proofBox.textContent = JSON.stringify({ domain: { name: "KavlingRegistry", chainId: proof.chain_id, verifyingContract: proof.verifying_contract }, message: { propertyId: proof.property_id, valuationUSD: proof.valuation_wei, nonce: proof.nonce, deadline: proof.deadline }, signer: proof.appraiser_agent, signature: proof.signature }, null, 2);
  } else {
    proofStatus.textContent = "Unsigned estimate";
    proofBox.textContent = JSON.stringify({ status: "local_estimate", note: "No signature was generated because the agent service is unavailable.", valuationUSD: appraisal.valuation_usd, riskAssessment: appraisal.risk_assessment }, null, 2);
  }
}

async function handleWalletConnect() {
  if (!window.ethereum) {
    setNetworkStatus("WALLET NOT FOUND");
    window.alert("Install a compatible EVM wallet to connect. Contract actions remain disabled until a verified deployment is configured.");
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    userWallet = accounts[0];
    document.getElementById("wallet-btn").textContent = `${userWallet.slice(0, 6)}...${userWallet.slice(-4)}`;
    setNetworkStatus("WALLET CONNECTED");
  } catch (error) {
    setNetworkStatus("CONNECTION REJECTED");
  }
}

function previewLifecycle() {
  const status = document.getElementById("judge-status");
  const steps = ["Preview: appraisal assumptions collected.", "Preview: EIP-712 payload prepared.", "Preview: vault escrow would hold deposits.", "Preview complete — no blockchain transaction was sent."];
  let index = 0;
  status.textContent = steps[index];
  const interval = window.setInterval(() => { index += 1; if (index >= steps.length) return window.clearInterval(interval); status.textContent = steps[index]; }, 700);
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "id" : "en";
  document.getElementById("lang-toggle").textContent = currentLang === "en" ? "Bahasa" : "English";
  document.documentElement.lang = currentLang;
}

function districtFor(city) { return { Bali: "Canggu", Jakarta: "SCBD", Yogyakarta: "Malioboro", Bandung: "Dago" }[city] || "Canggu"; }
function money(value) { return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`; }
function setNetworkStatus(value) { document.getElementById("network-status").textContent = value; }
async function fetchWithTimeout(url, options, timeout) { const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), timeout); try { return await fetch(url, { ...options, signal: controller.signal }); } finally { window.clearTimeout(timer); } }
