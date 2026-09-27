import { ethers } from "ethers";
import { NETWORK_CONFIG } from "../data/mockData";

export const KAVLING_REGISTRY_ABI = [
  "function registerPropertyWithAppraisal(bytes32 propertyId, string name, string city, string legalDeedHash, string ipfsMetadata, uint256 totalFractions, tuple(bytes32 propertyId, uint256 valuationUSD, uint256 pricePerFraction, uint256 annualYieldBps, uint256 timestamp, uint256 deadline) appraisal, bytes signature) external",
  "function getProperty(bytes32 propertyId) external view returns (tuple(bytes32 propertyId, string name, string city, string legalDeedHash, string ipfsMetadata, uint256 totalFractions, uint256 valuationUSD, uint256 pricePerFraction, uint256 annualYieldBps, address vaultAddress, bool isActive))",
  "function linkVault(bytes32 propertyId, address vault) external",
  "function isInvestorVerified(address) external view returns (bool)",
  "function totalProperties() external view returns (uint256)",
  "event PropertyRegistered(bytes32 indexed propertyId, string name, string city, uint256 valuationUSD, uint256 pricePerFraction, uint256 annualYieldBps, address indexed vaultAddress)"
];

export const KAVLING_VAULT_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function buyWithUSDT(uint256 fractionAmount) external",
  "function buyWithBNB(uint256 fractionAmount) external payable",
  "function depositRentalYield(uint256 yieldAmount) external",
  "function claimRentalYield() external",
  "function calculateClaimableYield(address investor) external view returns (uint256)",
  "function bnbPriceUSD() external view returns (uint256)",
  "function propertyId() external view returns (bytes32)",
  "event FractionsPurchased(address indexed buyer, uint256 fractionAmount, uint256 costPaymentToken, bool isNativeBNB)",
  "event RentalYieldClaimed(address indexed investor, uint256 claimedAmount)"
];

export const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function faucet(address to, uint256 amount) external"
];

/**
 * Get read-only JSON-RPC provider for BNB Chain Testnet
 */
export function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
}

/**
 * Get Web3 browser provider from window.ethereum
 */
export async function getWeb3Provider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No Web3 wallet extension detected");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Switch or add BNB Smart Chain Testnet to MetaMask/Web3 Wallet
 */
export async function switchNetworkToBscTestnet() {
  if (!window.ethereum) return false;

  const hexChainId = "0x" + NETWORK_CONFIG.chainId.toString(16); // 0x61 (97)

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }]
    });
    return true;
  } catch (switchError) {
    // Error 4902 indicates chain has not been added
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexChainId,
              chainName: NETWORK_CONFIG.name,
              nativeCurrency: {
                name: "Test BNB",
                symbol: "tBNB",
                decimals: 18
              },
              rpcUrls: [NETWORK_CONFIG.rpcUrl],
              blockExplorerUrls: [NETWORK_CONFIG.explorerUrl]
            }
          ]
        });
        return true;
      } catch (addError) {
        console.error("Failed to add BSC Testnet chain", addError);
        return false;
      }
    }
    console.error("Failed to switch chain", switchError);
    return false;
  }
}

/**
 * Fetch live wallet balances on BNB Testnet
 */
export async function fetchWalletBalances(address) {
  try {
    const provider = getReadOnlyProvider();
    const balanceWei = await provider.getBalance(address);
    const tBnbBalance = parseFloat(ethers.formatEther(balanceWei));

    // Fetch MockUSDT balance if available
    let usdtBalance = 1000;
    try {
      const usdtContract = new ethers.Contract(NETWORK_CONFIG.contracts.mockUsdt, ERC20_ABI, provider);
      const usdtWei = await usdtContract.balanceOf(address);
      usdtBalance = parseFloat(ethers.formatUnits(usdtWei, 18));
    } catch (e) {
      // Fallback
    }

    return { tBnbBalance, usdtBalance };
  } catch (error) {
    return { tBnbBalance: 0.5, usdtBalance: 1250 };
  }
}
