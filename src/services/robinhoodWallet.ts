// EIP-6963 and EIP-1193 Robinhood Wallet Integration Service

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

export interface RobinhoodChainInfo {
  id: string;
  name: string;
  currency: string;
  rpcUrl?: string;
  explorerUrl?: string;
}

export const ROBINHOOD_SUPPORTED_CHAINS: Record<string, RobinhoodChainInfo> = {
  '0x1': {
    id: '0x1',
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io'
  },
  '0x89': {
    id: '0x89',
    name: 'Polygon',
    currency: 'POL',
    explorerUrl: 'https://polygonscan.com'
  },
  '0xa4b1': {
    id: '0xa4b1',
    name: 'Arbitrum One',
    currency: 'ETH',
    explorerUrl: 'https://arbiscan.io'
  },
  '0xa': {
    id: '0xa',
    name: 'Optimism',
    currency: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io'
  },
  '0x2105': {
    id: '0x2105',
    name: 'Base',
    currency: 'ETH',
    explorerUrl: 'https://basescan.org'
  }
};

export const ROBINHOOD_WALLET_DOWNLOAD_URL = 'https://wallet.robinhood.com';
export const ROBINHOOD_CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/robinhood-wallet/bhhhlbepdkbapadjdnnojkbgioiodbic';

// In-memory registry of EIP-6963 discovered providers
let announcedRobinhoodProvider: any = null;
let announcedProviderInfo: EIP6963ProviderInfo | null = null;
const discoveryListeners = new Set<(detail: EIP6963ProviderDetail) => void>();

/**
 * Initialize EIP-6963 provider announcement listener (modern Web3 standard)
 */
export function initRobinhoodEIP6963Listener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleAnnounce = (event: Event) => {
    const customEvent = event as EIP6963AnnounceProviderEvent;
    if (!customEvent.detail || !customEvent.detail.info) return;

    const info = customEvent.detail.info;
    const isRobinhood =
      info.rdns === 'com.robinhood.wallet' ||
      info.name?.toLowerCase().includes('robinhood') ||
      customEvent.detail.provider?.isRobinhood;

    if (isRobinhood) {
      announcedRobinhoodProvider = customEvent.detail.provider;
      announcedProviderInfo = info;
      discoveryListeners.forEach((cb) => cb(customEvent.detail));
    }
  };

  window.addEventListener('eip6963:announceProvider', handleAnnounce);
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  return () => {
    window.removeEventListener('eip6963:announceProvider', handleAnnounce);
  };
}

/**
 * Detects whether Robinhood Wallet (or compatible EIP-1193 provider) is present
 */
export function getRobinhoodProvider(): {
  provider: any | null;
  isSpecificRobinhood: boolean;
  info: EIP6963ProviderInfo | null;
} {
  if (typeof window === 'undefined') {
    return { provider: null, isSpecificRobinhood: false, info: null };
  }

  // 1. Check EIP-6963 announced provider
  if (announcedRobinhoodProvider) {
    return {
      provider: announcedRobinhoodProvider,
      isSpecificRobinhood: true,
      info: announcedProviderInfo
    };
  }

  const anyWindow = window as any;

  // 2. Check dedicated window.robinhood
  if (anyWindow.robinhood?.ethereum || anyWindow.robinhood) {
    const p = anyWindow.robinhood.ethereum || anyWindow.robinhood;
    return {
      provider: p,
      isSpecificRobinhood: true,
      info: {
        uuid: 'robinhood-window',
        name: 'Robinhood Wallet',
        icon: '',
        rdns: 'com.robinhood.wallet'
      }
    };
  }

  // 3. Check window.ethereum with isRobinhood flag
  if (anyWindow.ethereum?.isRobinhood) {
    return {
      provider: anyWindow.ethereum,
      isSpecificRobinhood: true,
      info: {
        uuid: 'robinhood-injected',
        name: 'Robinhood Wallet',
        icon: '',
        rdns: 'com.robinhood.wallet'
      }
    };
  }

  // 4. Check multi-provider array in window.ethereum.providers
  if (Array.isArray(anyWindow.ethereum?.providers)) {
    const rh = anyWindow.ethereum.providers.find(
      (p: any) => p.isRobinhood || p.name?.toLowerCase?.().includes('robinhood')
    );
    if (rh) {
      return {
        provider: rh,
        isSpecificRobinhood: true,
        info: {
          uuid: 'robinhood-multi',
          name: 'Robinhood Wallet',
          icon: '',
          rdns: 'com.robinhood.wallet'
        }
      };
    }
  }

  // 5. Fallback to standard window.ethereum (if user is running a compatible Web3 browser)
  if (anyWindow.ethereum) {
    return {
      provider: anyWindow.ethereum,
      isSpecificRobinhood: false,
      info: null
    };
  }

  return { provider: null, isSpecificRobinhood: false, info: null };
}

/**
 * Requests accounts from Robinhood Wallet (triggers real wallet authorization popup)
 */
export async function requestRobinhoodAccounts(provider: any): Promise<string[]> {
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Robinhood Wallet provider not found or does not support EIP-1193');
  }

  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    return Array.isArray(accounts) ? accounts : [accounts];
  } catch (err: any) {
    if (err?.code === 4001) {
      throw new Error('Connection rejected by user in Robinhood Wallet');
    }
    throw err;
  }
}

/**
 * Gets currently authorized accounts without prompting
 */
export async function getRobinhoodAccounts(provider: any): Promise<string[]> {
  if (!provider || typeof provider.request !== 'function') return [];
  try {
    const accounts = await provider.request({ method: 'eth_accounts' });
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

/**
 * Queries current chainId
 */
export async function getRobinhoodChainId(provider: any): Promise<string | null> {
  if (!provider || typeof provider.request !== 'function') return null;
  try {
    const chainId = await provider.request({ method: 'eth_chainId' });
    return typeof chainId === 'string' ? chainId.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Queries native balance (ETH / POL)
 */
export async function getRobinhoodNativeBalance(provider: any, address: string): Promise<string> {
  if (!provider || typeof provider.request !== 'function' || !address) return '0.00 ETH';
  try {
    const hex = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });
    if (!hex || hex === '0x0') return '0.00 ETH';

    const wei = BigInt(hex);
    // Format to 4 decimals: wei / 1e18
    const ethWhole = wei / BigInt(1e18);
    const ethFraction = (wei % BigInt(1e18)) / BigInt(1e14);
    const fractionStr = ethFraction.toString().padStart(4, '0');
    return `${ethWhole}.${fractionStr} ETH`;
  } catch (err) {
    console.warn('[RobinhoodWallet] Could not fetch native balance:', err);
    return '0.00 ETH';
  }
}

/**
 * Queries ERC-20 token balance via eth_call
 */
export async function getRobinhoodTokenBalance(
  provider: any,
  contractAddress: string,
  walletAddress: string,
  decimals: number = 18
): Promise<number | null> {
  if (!provider || typeof provider.request !== 'function' || !contractAddress || !walletAddress) {
    return null;
  }

  // Ensure valid Ethereum address format for contract and wallet
  if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
    return null;
  }
  if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    return null;
  }

  try {
    // balanceOf(address) selector = 0x70a08231
    const cleanAddress = walletAddress.slice(2).padStart(64, '0');
    const data = `0x70a08231${cleanAddress}`;

    const hex = await provider.request({
      method: 'eth_call',
      params: [
        {
          to: contractAddress,
          data
        },
        'latest'
      ]
    });

    if (!hex || hex === '0x') return 0;
    const rawVal = BigInt(hex);
    const divisor = BigInt(10 ** decimals);
    return Number(rawVal / divisor);
  } catch (err) {
    console.warn('[RobinhoodWallet] eth_call token balance query failed:', err);
    return null;
  }
}

/**
 * Cryptographically signs an authentication challenge via personal_sign
 */
export async function signRobinhoodAuthMessage(
  provider: any,
  address: string,
  message: string
): Promise<string> {
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('Robinhood provider not available for signing');
  }

  try {
    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, address]
    });
    return signature;
  } catch (err: any) {
    if (err?.code === 4001) {
      throw new Error('Signature cancelled in Robinhood Wallet');
    }
    throw err;
  }
}

/**
 * Subscribes to Robinhood Wallet lifecycle events
 */
export function subscribeRobinhoodEvents(
  provider: any,
  callbacks: {
    onAccountsChanged?: (accounts: string[]) => void;
    onChainChanged?: (chainId: string) => void;
    onDisconnect?: () => void;
  }
): () => void {
  if (!provider || typeof provider.on !== 'function') {
    return () => {};
  }

  const handleAccountsChanged = (accounts: string[]) => {
    callbacks.onAccountsChanged?.(accounts);
  };

  const handleChainChanged = (chainId: string) => {
    callbacks.onChainChanged?.(chainId);
  };

  const handleDisconnect = () => {
    callbacks.onDisconnect?.();
  };

  provider.on('accountsChanged', handleAccountsChanged);
  provider.on('chainChanged', handleChainChanged);
  provider.on('disconnect', handleDisconnect);

  return () => {
    if (typeof provider.removeListener === 'function') {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
      provider.removeListener('disconnect', handleDisconnect);
    }
  };
}
