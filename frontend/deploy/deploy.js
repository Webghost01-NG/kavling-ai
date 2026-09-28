import { ethers } from "https://esm.sh/ethers@6.15.0";
import { artifacts } from "./manifest.js";

const CHAIN_ID = 97;
const RPC_URL = "https://bsc-testnet-dataseed.bnbchain.org";
const EXPLORER = "https://testnet.bscscan.com";
const DEPLOYMENT_KEY = "kavling:last-browser-deployment";
let provider;
let signer;
let account;
let registry;

const $ = (id) => document.getElementById(id);

$("connect-button").addEventListener("click", connectWallet);
$("deploy-button").addEventListener("click", deployProtocol);
$("clear-log").addEventListener("click", () => { $("log").innerHTML = '<div class="log-empty">Log cleared.</div>'; });

async function connectWallet() {
  if (!window.ethereum) {
    logError("No EVM wallet detected. Install MetaMask or another browser wallet first.");
    return;
  }
  try {
    await ensureTestnet();
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    $("wallet-status").textContent = "Connected";
    $("wallet-status").className = "status success";
    $("wallet-detail").textContent = `${account.slice(0, 8)}…${account.slice(-6)} · BSC Testnet · chain ${CHAIN_ID}`;
    $("connect-button").textContent = "Wallet connected";
    $("deploy-button").disabled = false;
    $("deploy-button").textContent = "Deploy protocol from wallet";
    log(`Connected ${account} on BSC Testnet.`);
  } catch (error) {
    logError(error.message || "Wallet connection failed.");
  }
}

async function ensureTestnet() {
  const target = `0x${CHAIN_ID.toString(16)}`;
  const current = await window.ethereum.request({ method: "eth_chainId" });
  if (current === target) return;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: target }] });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{ chainId: target, chainName: "BNB Smart Chain Testnet", nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 }, rpcUrls: [RPC_URL], blockExplorerUrls: [EXPLORER] }],
    });
  }
}

async function deployProtocol() {
  if (!signer || !account) return;
  const deployButton = $("deploy-button");
  deployButton.disabled = true;
  deployButton.textContent = "Deployment in progress…";
  try {
    const mockUsdt = await deploy("step-mock", "MockUSDT", []);
    const registryContract = await deploy("step-registry", "KavlingRegistry", [account]);
    registry = registryContract;
    const appraisal = await signAppraisal(registryContract.target);
    markStep("step-sign");
    markDone("step-sign");
    const registerTx = await registryContract.registerPropertyWithAppraisal(
      appraisal.propertyId,
      "Canggu Sanctuary Eco-Villa",
      "Bali, Indonesia",
      "SHM-0892-BALI-DEMO",
      "ipfs://bafybeicangguvillabali",
      ethers.parseUnits("15000", 18),
      appraisal.message,
      appraisal.signature,
    );
    await waitFor("step-register", registerTx, "Property registered");
    const vault = await deploy("step-vault", "KavlingPropertyVault", [
      "Kavling Bali Canggu Villa",
      "KVL-CANGGU",
      appraisal.propertyId,
      registryContract.target,
      mockUsdt.target,
      ethers.parseUnits("15000", 18),
      ethers.parseUnits("300000", 18),
      30,
    ]);
    const linkTx = await registryContract.linkVault(appraisal.propertyId, vault.target);
    await waitFor("step-link", linkTx, "Vault linked");
    const result = { chainId: CHAIN_ID, deployer: account, mockUsdt: mockUsdt.target, registry: registryContract.target, vault: vault.target, propertyId: appraisal.propertyId, completedAt: new Date().toISOString() };
    localStorage.setItem(DEPLOYMENT_KEY, JSON.stringify(result));
    $("deployment-result").textContent = JSON.stringify(result, null, 2);
    $("result-card").hidden = false;
    deployButton.textContent = "Deployment complete";
    log("Protocol deployment complete. Save the public addresses shown below.");
  } catch (error) {
    logError(error.shortMessage || error.reason || error.message || "Deployment failed.");
    deployButton.disabled = false;
    deployButton.textContent = "Retry deployment";
  }
}

async function deploy(stepId, artifactName, constructorArgs) {
  markStep(stepId);
  const artifact = artifacts[artifactName];
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  log(`Requesting wallet approval: deploy ${artifactName}.`);
  const contract = await factory.deploy(...constructorArgs);
  logTx(`${artifactName} deployment submitted`, contract.deploymentTransaction());
  await contract.waitForDeployment();
  log(`✓ ${artifactName} deployed at ${contract.target}`);
  markDone(stepId);
  return contract;
}

async function signAppraisal(verifyingContract) {
  const block = await provider.getBlock("latest");
  const timestamp = Number(block.timestamp);
  const propertyId = ethers.keccak256(ethers.toUtf8Bytes("BALI-CANGGU-VILLA-01"));
  const message = { propertyId, valuationUSD: ethers.parseUnits("750000", 18), pricePerFraction: ethers.parseUnits("50", 18), annualYieldBps: 980, timestamp, nonce: 1, deadline: timestamp + 365 * 24 * 60 * 60 };
  const domain = { name: "KavlingRegistry", version: "1.0.0", chainId: CHAIN_ID, verifyingContract };
  const types = { Appraisal: [{ name: "propertyId", type: "bytes32" }, { name: "valuationUSD", type: "uint256" }, { name: "pricePerFraction", type: "uint256" }, { name: "annualYieldBps", type: "uint256" }, { name: "timestamp", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] };
  log("Requesting wallet signature: EIP-712 appraisal attestation.");
  const signature = await signer.signTypedData(domain, types, message);
  log("✓ Appraisal signature created by the connected wallet.");
  return { propertyId, message, signature };
}

async function waitFor(stepId, tx, label) {
  logTx(`${label} submitted`, tx);
  await tx.wait();
  log(`✓ ${label} confirmed.`);
  markDone(stepId);
}

function log(message) { const empty = $("log").querySelector(".log-empty"); if (empty) empty.remove(); const line = document.createElement("div"); line.className = "log-line"; line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`; $("log").appendChild(line); $("log").scrollTop = $("log").scrollHeight; }
function logTx(message, tx) { const empty = $("log").querySelector(".log-empty"); if (empty) empty.remove(); const line = document.createElement("div"); line.className = "log-line"; line.append(document.createTextNode(`[${new Date().toLocaleTimeString()}] ${message} `)); if (tx?.hash) { const link = document.createElement("a"); link.href = `${EXPLORER}/tx/${tx.hash}`; link.target = "_blank"; link.rel = "noreferrer"; link.textContent = "View transaction ↗"; line.append(link); } $("log").appendChild(line); }
function logError(message) { const line = document.createElement("div"); line.className = "log-error"; line.textContent = `Error: ${message}`; $("log").appendChild(line); }
function markStep(id) { $(id).classList.add("active"); }
function markDone(id) { $(id).classList.remove("active"); $(id).classList.add("done"); }
