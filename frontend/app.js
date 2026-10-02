import { ethers } from "https://esm.sh/ethers@6.15.0";
import { artifacts } from "./deploy/manifest.js";
import { deployment } from "./deployment.js";

const API_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:8000"
  : deployment.agentUrl || window.location.origin;
const RPC = new ethers.JsonRpcProvider(deployment.rpcUrl, deployment.chainId);
const REGISTRY_ABI = artifacts.KavlingRegistry.abi;
const VAULT_ABI = artifacts.KavlingPropertyVault.abi;
const TOKEN_ABI = artifacts.MockUSDT.abi;
const registryRead = new ethers.Contract(deployment.contracts.registry, REGISTRY_ABI, RPC);
const vaultRead = new ethers.Contract(deployment.contracts.vault, VAULT_ABI, RPC);
const tokenRead = new ethers.Contract(deployment.contracts.mockUsdt, TOKEN_ABI, RPC);
const $ = (id) => document.getElementById(id);

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
let walletProvider;
let walletSigner;
let userWallet = null;
let registryWrite;
let vaultWrite;
let tokenWrite;
let liveProperty;
let appraiserAddress;
let latestProof;
let latestProofPropertyId;

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  renderProperties();
  $("appraisal-form").addEventListener("submit", handleAppraisalSubmit);
  $("wallet-btn").addEventListener("click", handleWalletConnect);
  $("publish-appraisal-button").addEventListener("click", publishAppraisal);
  $("faucet-button").addEventListener("click", requestTestTokens);
  $("buy-usdt-button").addEventListener("click", buyWithUSDT);
  $("buy-bnb-button").addEventListener("click", buyWithBNB);
  $("finalize-button").addEventListener("click", finalizeFunding);
  $("deposit-yield-button").addEventListener("click", depositTestYield);
  $("deposit-bnb-yield-button").addEventListener("click", depositBnbYield);
  $("claim-usdt-button").addEventListener("click", claimUsdtYield);
  $("claim-bnb-button").addEventListener("click", claimBnbYield);
  setWalletControls(false);
  setContractLinks();
  loadLiveState();
  $("appraisal-form").dispatchEvent(new Event("submit"));

  if (window.ethereum?.on) {
    window.ethereum.on("chainChanged", () => window.location.reload());
    window.ethereum.on("accountsChanged", () => window.location.reload());
  }
}

function renderProperties() {
  const container = $("property-list");
  PROPERTY_SCENARIOS.forEach((property) => {
    const card = document.createElement("article");
    card.className = "listing";
    card.innerHTML = `<div><div class="listing-title">${property.name}</div><div class="listing-meta">${property.city} · ${property.district} · ${property.type}</div></div><span class="listing-badge">DEMO SCENARIO</span><div class="listing-metrics"><span>Seeded value <strong>$${property.value.toLocaleString()}</strong></span><span>Seeded fraction <strong>$${property.fraction}</strong></span><span>Seeded yield <strong>${property.yield}%</strong></span></div>`;
    card.addEventListener("click", () => selectScenario(property));
    container.appendChild(card);
  });
}

function selectScenario(property) {
  $("inp-city").value = property.city;
  $("inp-land").value = property.city === "Jakarta" ? 120 : property.city === "Yogyakarta" ? 480 : 500;
  $("inp-build").value = property.city === "Jakarta" ? 260 : property.city === "Yogyakarta" ? 520 : 350;
  $("appraisal-form").dispatchEvent(new Event("submit"));
  $("valuation").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleAppraisalSubmit(event) {
  event.preventDefault();
  const params = {
    city: $("inp-city").value,
    land: Number($("inp-land").value),
    building: Number($("inp-build").value),
    zoning: $("inp-zoning").value,
    title: $("inp-title").value,
  };
  const district = districtFor(params.city);
  const propertyId = params.city === "Bali"
    ? deployment.propertyId
    : ethers.keccak256(ethers.toUtf8Bytes(`KAVLING-DEMO-${params.city}-${district}`));
  const button = $("calc-submit-btn");
  button.disabled = true;
  button.firstChild.textContent = "Calculating… ";
  latestProof = null;
  latestProofPropertyId = propertyId;
  $("publish-appraisal-button").disabled = true;
  $("proof-action-status").textContent = "Waiting for the valuation service.";
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/appraise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: propertyId,
        city: params.city,
        district,
        land_area_m2: params.land,
        building_area_m2: params.building,
        zoning: params.zoning,
        title: params.title,
        chain_id: deployment.chainId,
        verifying_contract: deployment.contracts.registry,
      }),
    }, 12000);
    if (!response.ok) throw new Error(`valuation agent returned ${response.status}`);
    const data = await response.json();
    latestProof = data.eip712_proof;
    displayAppraisal(data.appraisal, latestProof, "Valuation agent · EIP-712 proof", propertyId);
  } catch (error) {
    const source = error.name === "AbortError" ? "timed out" : shortError(error);
    displayAppraisal(localEstimate(params), null, `Local estimate · unsigned · agent unavailable (${source})`, propertyId);
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

function displayAppraisal(appraisal, proof, source, propertyId) {
  $("res-val").textContent = money(appraisal.valuation_usd);
  $("res-fraction").textContent = money(appraisal.price_per_fraction_usd);
  $("res-yield").textContent = `${appraisal.annual_yield_percent}%`;
  $("res-resilience").textContent = `${appraisal.risk_assessment.resilience_score} / 100`;
  $("appraisal-source").textContent = source;
  const proofStatus = $("proof-status");
  const proofBox = $("eip-proof-box");
  if (proof) {
    const publishable = proofTargetsDeployedProperty(proof, propertyId);
    proofStatus.textContent = publishable ? "Signed appraisal proof" : "Signed · not this property";
    proofBox.textContent = JSON.stringify({
      domain: { name: "KavlingRegistry", chainId: proof.chain_id, verifyingContract: proof.verifying_contract },
      message: proof.struct,
      signer: proof.appraiser_agent,
      signature: proof.signature,
    }, null, 2);
    if (!publishable) {
      $("proof-action-status").textContent = "Only the deployed Bali/Canggu demo property can be updated here; other regions remain signed estimates.";
    } else {
      $("proof-action-status").textContent = "Checking the signature against the deployed appraiser and wallet connection…";
    }
  } else {
    proofStatus.textContent = "Unsigned estimate";
    proofBox.textContent = JSON.stringify({ status: "local_estimate", note: "No signature was generated because the valuation agent is unavailable.", valuationUSD: appraisal.valuation_usd, riskAssessment: appraisal.risk_assessment }, null, 2);
    $("proof-action-status").textContent = "This estimate has no cryptographic signature and cannot be submitted.";
  }
  refreshProofAction();
}

async function handleWalletConnect() {
  if (!window.ethereum) {
    setNetworkStatus("WALLET NOT FOUND", true);
    $("live-state-note").textContent = "Install MetaMask or another EVM wallet to use transaction controls.";
    return;
  }
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await ensureTestnet();
    walletProvider = new ethers.BrowserProvider(window.ethereum);
    walletSigner = await walletProvider.getSigner();
    userWallet = await walletSigner.getAddress();
    registryWrite = new ethers.Contract(deployment.contracts.registry, REGISTRY_ABI, walletSigner);
    vaultWrite = new ethers.Contract(deployment.contracts.vault, VAULT_ABI, walletSigner);
    tokenWrite = new ethers.Contract(deployment.contracts.mockUsdt, TOKEN_ABI, walletSigner);
    $("wallet-btn").textContent = `${userWallet.slice(0, 6)}…${userWallet.slice(-4)}`;
    setNetworkStatus("BSC TESTNET · WALLET READY");
    setWalletControls(true);
    await loadLiveState();
    refreshProofAction();
  } catch (error) {
    setNetworkStatus("WALLET CONNECTION FAILED", true);
    $("live-state-note").textContent = shortError(error);
  }
}

async function ensureTestnet() {
  const targetChain = `0x${deployment.chainId.toString(16)}`;
  const currentChain = await window.ethereum.request({ method: "eth_chainId" });
  if (currentChain.toLowerCase() === targetChain) return;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: targetChain }] });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: targetChain,
        chainName: deployment.network,
        nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
        rpcUrls: [deployment.rpcUrl],
        blockExplorerUrls: [deployment.explorerUrl],
      }],
    });
  }
}

async function loadLiveState() {
  try {
    const [property, vaultState, raised, goal, minted, maxFractions, bnbPrice, appraiser] = await Promise.all([
      registryRead.getProperty(deployment.propertyId),
      vaultRead.state(),
      vaultRead.totalUSDCollected(),
      vaultRead.minFundingGoalUSD(),
      vaultRead.totalFractionsMinted(),
      vaultRead.maxFractions(),
      vaultRead.bnbPriceUSD(),
      registryRead.aiAppraiserAgent(),
    ]);
    liveProperty = property;
    appraiserAddress = appraiser;
    const stateNames = ["Funding", "Active", "Refundable"];
    const stateName = stateNames[Number(vaultState)] || "Unknown";
    $("live-status").textContent = "BSC TESTNET · LIVE READ";
    $("live-status").className = "panel-status good";
    $("live-vault-state").textContent = stateName;
    $("metric-vault-state").textContent = stateName.toUpperCase();
    $("live-funding-raised").textContent = money(Number(ethers.formatUnits(raised, 18)));
    $("live-funding-goal").textContent = money(Number(ethers.formatUnits(goal, 18)));
    $("live-price").textContent = money(Number(ethers.formatUnits(property.pricePerFraction, 18)));
    $("live-fractions").textContent = `${formatUnits(minted)} / ${formatUnits(maxFractions)}`;
    $("live-state-note").textContent = `${deployment.propertyName}. Current property value: ${money(Number(ethers.formatUnits(property.valuationUSD, 18)))}. Fixed demo BNB/USD input: ${money(Number(ethers.formatUnits(bnbPrice, 18)))}.`;
    if (userWallet) {
      const [fractions, tokenBalance, claimableUsdt, claimableBnb] = await Promise.all([
        vaultRead.balanceOf(userWallet),
        tokenRead.balanceOf(userWallet),
        vaultRead.calculateClaimableYield(userWallet),
        vaultRead.calculateClaimableYieldBNB(userWallet),
      ]);
      $("live-user-fractions").textContent = formatUnits(fractions);
      $("faucet-button").title = `MockUSDT balance: ${formatUnits(tokenBalance)}`;
      $("faucet-button").disabled = false;
      $("deposit-yield-button").disabled = false;
      $("deposit-bnb-yield-button").disabled = false;
      $("claim-usdt-button").disabled = !walletSigner || claimableUsdt === 0n;
      $("claim-bnb-button").disabled = !walletSigner || claimableBnb === 0n;
    } else {
      $("live-user-fractions").textContent = "Connect wallet";
      $("claim-usdt-button").disabled = true;
      $("claim-bnb-button").disabled = true;
    }
    const canFinalize = Number(vaultState) === 0 && raised >= goal;
    $("finalize-button").disabled = !walletSigner || !canFinalize;
    setNetworkStatus(userWallet ? "BSC TESTNET · WALLET READY" : "BSC TESTNET · CONTRACTS LIVE");
    refreshProofAction();
  } catch (error) {
    $("live-status").textContent = "RPC READ FAILED";
    $("live-status").className = "panel-status error";
    $("metric-vault-state").textContent = "ERROR";
    $("live-state-note").textContent = `Could not read the deployed contracts: ${shortError(error)}`;
    setNetworkStatus("TESTNET RPC ERROR", true);
  }
}

function setContractLinks() {
  for (const [id, address] of [
    ["registry-link", deployment.contracts.registry],
    ["vault-link", deployment.contracts.vault],
    ["token-link", deployment.contracts.mockUsdt],
  ]) {
    const link = $(id);
    link.href = `${deployment.explorerUrl}/address/${address}`;
    link.title = address;
  }
}

async function publishAppraisal() {
  if (!latestProof || !registryWrite || latestProofPropertyId.toLowerCase() !== deployment.propertyId.toLowerCase()) return;
  try {
    const nonce = await registryRead.propertyNonces(deployment.propertyId);
    if (BigInt(latestProof.nonce) !== nonce + 1n) {
      $("proof-action-status").textContent = "This proof is stale because the on-chain nonce changed. Run the valuation again.";
      $("publish-appraisal-button").disabled = true;
      return;
    }
    const s = latestProof.struct;
    const appraisal = {
      propertyId: s.propertyId,
      valuationUSD: BigInt(s.valuationUSD),
      pricePerFraction: BigInt(s.pricePerFraction),
      annualYieldBps: BigInt(s.annualYieldBps),
      timestamp: BigInt(s.timestamp),
      nonce: BigInt(s.nonce),
      deadline: BigInt(s.deadline),
    };
    await executeTransaction("Write EIP-712 appraisal", () => registryWrite.updateAppraisal(appraisal, latestProof.signature));
    latestProof = null;
    $("publish-appraisal-button").disabled = true;
    $("proof-action-status").textContent = "Appraisal update confirmed by BNB Testnet.";
  } catch (error) {
    $("proof-action-status").textContent = `Appraisal write failed: ${shortError(error)}`;
  }
}

async function requestTestTokens() {
  if (!tokenWrite) return;
  await executeTransaction("Get 1,000 MockUSDT", () => tokenWrite.faucet(userWallet, ethers.parseUnits("1000", 18)));
}

async function buyWithUSDT() {
  if (!vaultWrite || !liveProperty) return;
  try {
    const fractions = readFractionAmount();
    const cost = fractions * liveProperty.pricePerFraction / 10n ** 18n;
    if (cost === 0n) throw new Error("Fraction amount is below the supported payment precision.");
    const allowance = await tokenRead.allowance(userWallet, deployment.contracts.vault);
    if (allowance < cost) {
      const approved = await executeTransaction("Approve MockUSDT", () => tokenWrite.approve(deployment.contracts.vault, cost));
      if (!approved) return;
    }
    await executeTransaction("Buy fractions with MockUSDT", () => vaultWrite.buyWithUSDT(fractions));
  } catch (error) {
    showLiveError(`USDT purchase failed: ${shortError(error)}`);
  }
}

async function buyWithBNB() {
  if (!vaultWrite || !liveProperty) return;
  try {
    const fractions = readFractionAmount();
    const costUsd = fractions * liveProperty.pricePerFraction / 10n ** 18n;
    const bnbPrice = await vaultRead.bnbPriceUSD();
    const costBnb = costUsd * 10n ** 18n / bnbPrice;
    if (costUsd === 0n || costBnb === 0n) throw new Error("Fraction amount is below the supported payment precision.");
    await executeTransaction("Buy fractions with tBNB", () => vaultWrite.buyWithBNB(fractions, { value: costBnb }));
  } catch (error) {
    showLiveError(`tBNB purchase failed: ${shortError(error)}`);
  }
}

async function finalizeFunding() {
  if (!vaultWrite) return;
  await executeTransaction("Finalize funding round", () => vaultWrite.finalizeFunding());
}

async function depositTestYield() {
  if (!vaultWrite || !tokenWrite) return;
  try {
    const amount = ethers.parseUnits($("yield-amount").value, 18);
    if (amount <= 0n) throw new Error("Enter a yield amount above zero.");
    const allowance = await tokenRead.allowance(userWallet, deployment.contracts.vault);
    if (allowance < amount) {
      const approved = await executeTransaction("Approve MockUSDT yield", () => tokenWrite.approve(deployment.contracts.vault, amount));
      if (!approved) return;
    }
    await executeTransaction("Deposit illustrative USDT yield", () => vaultWrite.depositRentalYield(amount));
  } catch (error) {
    showLiveError(`Yield deposit failed: ${shortError(error)}`);
  }
}

async function depositBnbYield() {
  if (!vaultWrite) return;
  await executeTransaction("Deposit 0.001 tBNB yield", () => vaultWrite.depositRentalYieldBNB({ value: ethers.parseEther("0.001") }));
}

async function claimUsdtYield() {
  if (!vaultWrite) return;
  await executeTransaction("Claim MockUSDT yield", () => vaultWrite.claimRentalYield());
}

async function claimBnbYield() {
  if (!vaultWrite) return;
  await executeTransaction("Claim tBNB yield", () => vaultWrite.claimRentalYieldBNB());
}

async function executeTransaction(label, sendTransaction) {
  $("live-state-note").textContent = `${label}: waiting for wallet confirmation.`;
  try {
    const tx = await sendTransaction();
    const row = addTransactionRow(label, tx.hash, "tx-pending", "Submitted · waiting for BNB Testnet");
    $("live-state-note").textContent = `${label}: submitted to BNB Testnet.`;
    const receipt = await tx.wait();
    if (receipt.status !== 1) throw new Error("Transaction reverted on-chain.");
    row.className = "tx-entry tx-confirmed";
    row.querySelector("span").textContent = `Confirmed in block ${receipt.blockNumber} · ${label}`;
    $("live-state-note").textContent = `${label}: confirmed in block ${receipt.blockNumber}.`;
    await loadLiveState();
    return true;
  } catch (error) {
    const message = shortError(error);
    const txHash = error?.transactionHash || error?.receipt?.hash;
    if (txHash) addTransactionRow(`${label} · reverted`, txHash, "tx-error", "Transaction reverted · inspect receipt");
    showLiveError(`${label}: ${message}`);
    return false;
  }
}

function addTransactionRow(label, hash, className, message) {
  const log = $("live-activity");
  const placeholder = log.querySelector(":scope > span");
  if (placeholder) placeholder.remove();
  const row = document.createElement("div");
  row.className = `tx-entry ${className}`;
  const text = document.createElement("span");
  text.textContent = message || label;
  const link = document.createElement("a");
  link.href = `${deployment.explorerUrl}/tx/${hash}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "View transaction ↗";
  row.append(text, link);
  log.prepend(row);
  return row;
}

function setWalletControls(connected) {
  for (const id of ["faucet-button", "buy-usdt-button", "buy-bnb-button", "deposit-yield-button", "deposit-bnb-yield-button"]) {
    $(id).disabled = !connected;
  }
  $("finalize-button").disabled = !connected;
  $("claim-usdt-button").disabled = !connected;
  $("claim-bnb-button").disabled = !connected;
}

function refreshProofAction() {
  const ready = Boolean(latestProof && walletSigner && appraiserAddress
    && proofTargetsDeployedProperty(latestProof, latestProofPropertyId)
    && latestProof.appraiser_agent?.toLowerCase() === appraiserAddress.toLowerCase());
  $("publish-appraisal-button").disabled = !ready;
  if (latestProof && proofTargetsDeployedProperty(latestProof, latestProofPropertyId)) {
    $("proof-action-status").textContent = !appraiserAddress
      ? "Reading the appraiser address from the registry…"
      : latestProof.appraiser_agent?.toLowerCase() !== appraiserAddress.toLowerCase()
        ? "The agent signer does not match the registry’s configured appraiser; this proof cannot be submitted."
        : walletSigner
          ? "Proof matches the registry appraiser and is ready for wallet submission."
          : "Connect a BSC Testnet wallet to submit this appraisal.";
  }
}

function proofTargetsDeployedProperty(proof, propertyId) {
  return Boolean(proof && propertyId?.toLowerCase() === deployment.propertyId.toLowerCase()
    && proof.chain_id === deployment.chainId
    && proof.verifying_contract?.toLowerCase() === deployment.contracts.registry.toLowerCase());
}

function readFractionAmount() {
  const value = $("fraction-amount").value;
  if (!value || Number(value) <= 0) throw new Error("Enter a fraction amount above zero.");
  return ethers.parseUnits(value, 18);
}

function showLiveError(message) {
  $("live-state-note").textContent = message;
  const row = document.createElement("div");
  row.className = "tx-entry tx-error";
  row.textContent = message;
  const log = $("live-activity");
  const placeholder = log.querySelector(":scope > span");
  if (placeholder) placeholder.remove();
  log.prepend(row);
}

function districtFor(city) { return { Bali: "Canggu", Jakarta: "SCBD", Yogyakarta: "Malioboro", Bandung: "Dago" }[city] || "Canggu"; }
function money(value) { return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`; }
function formatUnits(value) { return Number(ethers.formatUnits(value, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
function shortError(error) { return error?.shortMessage || error?.reason || error?.message || "Request failed."; }
function setNetworkStatus(value, isError = false) { $("network-status").textContent = value; $("network-status").classList.toggle("error", isError); }
async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { window.clearTimeout(timer); }
}
