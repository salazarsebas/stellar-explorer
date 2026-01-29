export type GlossaryLevel = "beginner" | "intermediate" | "advanced";

export interface GlossaryEntry {
  id: string;
  term: string;
  shortDefinition: string;
  fullDefinition: string;
  level: GlossaryLevel;
  category: string;
  relatedTerms?: string[];
  learnMoreUrl?: string;
}

export const glossaryTerms: Record<string, GlossaryEntry> = {
  stellar: {
    id: "stellar",
    term: "Stellar",
    shortDefinition: "An open-source blockchain network for fast, low-cost payments.",
    fullDefinition:
      "Stellar is an open-source, decentralized blockchain network designed for fast, low-cost financial transactions. It connects financial institutions, payment systems, and people, enabling cross-border payments and asset tokenization with settlement in 3-5 seconds.",
    level: "beginner",
    category: "basics",
    relatedTerms: ["xlm", "ledger", "network"],
    learnMoreUrl: "https://stellar.org/learn/intro-to-stellar",
  },
  xlm: {
    id: "xlm",
    term: "XLM (Lumens)",
    shortDefinition: "The native cryptocurrency of the Stellar network.",
    fullDefinition:
      "XLM (Lumens) is the native digital currency of the Stellar network. It serves multiple purposes: it's used to pay transaction fees (base fee is 0.00001 XLM), maintain account minimum balances (base reserve is 0.5 XLM), and can act as a bridge currency for asset exchanges on the decentralized exchange (DEX).",
    level: "beginner",
    category: "basics",
    relatedTerms: ["stellar", "transaction", "fee"],
    learnMoreUrl: "https://stellar.org/lumens",
  },
  account: {
    id: "account",
    term: "Account",
    shortDefinition:
      "A fundamental data structure that holds balances and can send/receive payments.",
    fullDefinition:
      "An account is the fundamental data structure on Stellar. Each account has a unique public key (starting with 'G'), holds balances of XLM and other assets, and can send/receive payments. Accounts must maintain a minimum balance (base reserve + subentries × 0.5 XLM) and have configurable signing thresholds.",
    level: "beginner",
    category: "basics",
    relatedTerms: ["publicKey", "balance", "signer"],
  },
  publicKey: {
    id: "publicKey",
    term: "Public Key",
    shortDefinition:
      "A 56-character identifier starting with 'G' that represents an account address.",
    fullDefinition:
      "A public key is a 56-character string starting with 'G' that serves as an account's address on Stellar. It's derived from a secret key using Ed25519 cryptography and can be safely shared. Anyone can send payments to a public key, but only the holder of the corresponding secret key can authorize transactions from that account.",
    level: "beginner",
    category: "basics",
    relatedTerms: ["account", "secretKey", "signer"],
  },
  secretKey: {
    id: "secretKey",
    term: "Secret Key",
    shortDefinition: "A 56-character private key starting with 'S' used to sign transactions.",
    fullDefinition:
      "A secret key (also called private key) is a 56-character string starting with 'S' that allows you to authorize transactions from your account. It must be kept completely private - anyone with your secret key can control your account and move all your funds. Never share your secret key with anyone.",
    level: "beginner",
    category: "basics",
    relatedTerms: ["publicKey", "signer", "transaction"],
  },
  ledger: {
    id: "ledger",
    term: "Ledger",
    shortDefinition: "A snapshot of the network state containing all accounts and transactions.",
    fullDefinition:
      "A ledger is a complete snapshot of the Stellar network state at a given point in time. Every 3-5 seconds, the network produces a new ledger containing all accounts, balances, trustlines, and the transactions that modified the state. Ledgers are sequentially numbered and link to previous ledgers, forming a blockchain.",
    level: "beginner",
    category: "network",
    relatedTerms: ["transaction", "consensus", "stellar"],
  },
  transaction: {
    id: "transaction",
    term: "Transaction",
    shortDefinition: "A bundle of operations submitted to the network for execution.",
    fullDefinition:
      "A transaction is a bundle of one or more operations that modify the ledger state. Each transaction has a source account (who pays the fee), a sequence number, a maximum fee, optional memo, and 1-100 operations. Transactions are atomic - either all operations succeed, or none do.",
    level: "beginner",
    category: "transactions",
    relatedTerms: ["operation", "fee", "memo", "ledger"],
  },
  operation: {
    id: "operation",
    term: "Operation",
    shortDefinition: "A single action within a transaction, like payment or trustline creation.",
    fullDefinition:
      "An operation is a single action that modifies the ledger. Stellar supports 27 operation types including payments, trustline changes, account creation, offers on the DEX, and smart contract invocations. Each operation can have its own source account different from the transaction's source.",
    level: "intermediate",
    category: "transactions",
    relatedTerms: ["transaction", "payment", "trustline"],
  },
  payment: {
    id: "payment",
    term: "Payment",
    shortDefinition: "An operation that sends an asset from one account to another.",
    fullDefinition:
      "A payment is an operation type that transfers assets from one account to another. The sender specifies the destination account, asset type, and amount. For non-native assets, the recipient must have an existing trustline. Path payments can automatically convert between assets using the DEX.",
    level: "beginner",
    category: "operations",
    relatedTerms: ["operation", "asset", "trustline"],
  },
  asset: {
    id: "asset",
    term: "Asset",
    shortDefinition: "Any tokenized value on Stellar, like XLM, stablecoins, or custom tokens.",
    fullDefinition:
      "An asset on Stellar represents any type of value - from the native XLM to fiat-backed stablecoins, commodities, or custom tokens. Non-native assets are identified by a code (1-12 characters) and the issuer's public key. To hold an asset, accounts must first establish a trustline to the issuer.",
    level: "beginner",
    category: "assets",
    relatedTerms: ["xlm", "trustline", "issuer"],
  },
  trustline: {
    id: "trustline",
    term: "Trustline",
    shortDefinition: "An explicit authorization to hold a specific asset from an issuer.",
    fullDefinition:
      "A trustline is a record on Stellar that authorizes an account to hold a specific asset. It represents explicit trust in the asset issuer. Trustlines include a limit (maximum amount to hold) and can be set to authorize or deauthorize holdings. Creating a trustline increases the account's minimum balance by 0.5 XLM.",
    level: "intermediate",
    category: "assets",
    relatedTerms: ["asset", "issuer", "balance"],
  },
  issuer: {
    id: "issuer",
    term: "Issuer",
    shortDefinition: "The account that creates and manages a non-native asset.",
    fullDefinition:
      "An issuer is the Stellar account that creates and controls a custom asset. The issuer can control whether other accounts can hold the asset (authorization flags), freeze balances, and perform clawbacks if enabled. Trust in an asset is fundamentally trust in its issuer to honor redemptions.",
    level: "intermediate",
    category: "assets",
    relatedTerms: ["asset", "trustline", "account"],
  },
  fee: {
    id: "fee",
    term: "Fee",
    shortDefinition: "The cost in XLM to submit a transaction to the network.",
    fullDefinition:
      "Transaction fees on Stellar are paid in XLM. The base fee is 100 stroops (0.00001 XLM) per operation. Fees help prevent spam and prioritize transactions during high network activity. The fee market adjusts dynamically - higher fees get processed faster during congestion.",
    level: "beginner",
    category: "transactions",
    relatedTerms: ["stroops", "transaction", "xlm"],
  },
  stroops: {
    id: "stroops",
    term: "Stroops",
    shortDefinition: "The smallest unit of XLM: 1 XLM = 10,000,000 stroops.",
    fullDefinition:
      "A stroop is the smallest unit of XLM, similar to how a satoshi is the smallest unit of Bitcoin. One XLM equals 10,000,000 (10^7) stroops. Fees and some API responses use stroops to avoid floating-point precision issues. The base fee is 100 stroops per operation.",
    level: "intermediate",
    category: "basics",
    relatedTerms: ["xlm", "fee"],
  },
  memo: {
    id: "memo",
    term: "Memo",
    shortDefinition: "Optional metadata attached to a transaction.",
    fullDefinition:
      "A memo is optional data attached to a transaction. Types include: text (up to 28 characters), ID (64-bit number), hash (32-byte hash), and return (32-byte hash for refunds). Exchanges often require memos to identify which user a deposit belongs to.",
    level: "beginner",
    category: "transactions",
    relatedTerms: ["transaction"],
  },
  signer: {
    id: "signer",
    term: "Signer",
    shortDefinition: "A key authorized to sign transactions for an account.",
    fullDefinition:
      "A signer is a key that can authorize transactions for an account. Accounts can have multiple signers with different weights, enabling multi-signature setups. Thresholds (low, medium, high) determine how much signing weight is required for different operation types.",
    level: "intermediate",
    category: "accounts",
    relatedTerms: ["account", "publicKey", "threshold"],
  },
  threshold: {
    id: "threshold",
    term: "Threshold",
    shortDefinition: "The signing weight required to authorize different operations.",
    fullDefinition:
      "Thresholds define how much cumulative signer weight is needed to authorize operations. Stellar has three levels: low (for some account setting changes), medium (for most operations like payments), and high (for critical changes like adding signers). This enables sophisticated access control.",
    level: "intermediate",
    category: "accounts",
    relatedTerms: ["signer", "account", "multisig"],
  },
  multisig: {
    id: "multisig",
    term: "Multi-signature",
    shortDefinition:
      "Account configuration requiring multiple signatures to authorize transactions.",
    fullDefinition:
      "Multi-signature (multisig) is a security feature where an account requires signatures from multiple keys to authorize transactions. This is achieved by adding multiple signers with weights and setting thresholds appropriately. Common setups include 2-of-3 or 3-of-5 signing schemes.",
    level: "intermediate",
    category: "accounts",
    relatedTerms: ["signer", "threshold", "account"],
  },
  soroban: {
    id: "soroban",
    term: "Soroban",
    shortDefinition: "Stellar's smart contract platform using Rust and WASM.",
    fullDefinition:
      "Soroban is Stellar's smart contract platform, launched in 2024. It allows developers to write smart contracts in Rust that compile to WebAssembly (WASM). Soroban contracts can interact with Stellar accounts, assets, and the DEX, enabling DeFi applications, DAOs, and more complex financial logic.",
    level: "advanced",
    category: "contracts",
    relatedTerms: ["contract", "wasm", "stellar"],
    learnMoreUrl: "https://soroban.stellar.org",
  },
  contract: {
    id: "contract",
    term: "Smart Contract",
    shortDefinition: "Self-executing code deployed on the Stellar network.",
    fullDefinition:
      "A smart contract on Stellar (via Soroban) is a program deployed to the network that executes automatically when invoked. Contracts have their own storage (instance, persistent, temporary), can emit events, and interact with Stellar accounts and assets. Contract IDs start with 'C'.",
    level: "advanced",
    category: "contracts",
    relatedTerms: ["soroban", "wasm", "storage"],
  },
  wasm: {
    id: "wasm",
    term: "WASM",
    shortDefinition: "WebAssembly bytecode format used for Soroban smart contracts.",
    fullDefinition:
      "WebAssembly (WASM) is the bytecode format Soroban contracts compile to. Developers write contracts in Rust, which then compiles to WASM for deployment. WASM provides near-native performance, security through sandboxing, and a compact binary format ideal for blockchain execution.",
    level: "advanced",
    category: "contracts",
    relatedTerms: ["soroban", "contract"],
  },
  xdr: {
    id: "xdr",
    term: "XDR",
    shortDefinition: "External Data Representation - Stellar's binary serialization format.",
    fullDefinition:
      "XDR (External Data Representation) is the binary encoding format used throughout Stellar. All transactions, ledger entries, and network messages are serialized as XDR. It's compact, unambiguous, and language-agnostic. Transaction XDR is what gets signed and submitted to the network.",
    level: "advanced",
    category: "technical",
    relatedTerms: ["transaction", "ledger"],
  },
  horizon: {
    id: "horizon",
    term: "Horizon",
    shortDefinition: "The REST API server for interacting with the Stellar network.",
    fullDefinition:
      "Horizon is Stellar's HTTP API that provides access to the network. It allows you to submit transactions, query account balances, browse ledger history, and subscribe to real-time updates via streaming. Most Stellar applications use Horizon rather than connecting directly to Stellar Core.",
    level: "intermediate",
    category: "technical",
    relatedTerms: ["stellar", "api", "stellarCore"],
  },
  stellarCore: {
    id: "stellarCore",
    term: "Stellar Core",
    shortDefinition: "The backbone software that validates transactions and maintains consensus.",
    fullDefinition:
      "Stellar Core is the software that powers the Stellar network. It validates transactions, participates in consensus, and maintains the ledger. Organizations run Core nodes to contribute to network decentralization. Most developers interact with Horizon rather than Core directly.",
    level: "advanced",
    category: "technical",
    relatedTerms: ["horizon", "consensus", "validator"],
  },
  consensus: {
    id: "consensus",
    term: "Consensus (SCP)",
    shortDefinition: "Stellar Consensus Protocol - how the network agrees on ledger state.",
    fullDefinition:
      "The Stellar Consensus Protocol (SCP) is how the network agrees on transaction validity and ledger state. Unlike proof-of-work, SCP uses Federated Byzantine Agreement where nodes choose which other nodes to trust. This enables fast finality (3-5 seconds) with low energy consumption.",
    level: "advanced",
    category: "network",
    relatedTerms: ["ledger", "validator", "stellarCore"],
  },
  validator: {
    id: "validator",
    term: "Validator",
    shortDefinition: "A node that participates in the network's consensus process.",
    fullDefinition:
      "A validator is a Stellar Core node that participates in consensus. Validators propose and vote on transactions, helping the network agree on ledger state. The Stellar network has validators run by various organizations including SDF, exchanges, and enterprises. Anyone can run a validator.",
    level: "advanced",
    category: "network",
    relatedTerms: ["consensus", "stellarCore", "node"],
  },
  dex: {
    id: "dex",
    term: "DEX (SDEX)",
    shortDefinition: "Stellar's built-in decentralized exchange for trading assets.",
    fullDefinition:
      "The Stellar Decentralized Exchange (SDEX) is a built-in marketplace for trading assets. Users can create buy/sell offers that are matched automatically. The DEX also enables path payments - automatic conversion between assets through the best available trading route.",
    level: "intermediate",
    category: "trading",
    relatedTerms: ["asset", "offer", "pathPayment"],
  },
  offer: {
    id: "offer",
    term: "Offer",
    shortDefinition: "A buy or sell order on the Stellar DEX.",
    fullDefinition:
      "An offer is an order on the Stellar DEX to buy or sell an asset at a specified price. Offers remain in the order book until filled or cancelled. When a new offer matches existing offers, trades execute automatically. There are manage_buy_offer and manage_sell_offer operations.",
    level: "intermediate",
    category: "trading",
    relatedTerms: ["dex", "asset", "orderbook"],
  },
  claimableBalance: {
    id: "claimableBalance",
    term: "Claimable Balance",
    shortDefinition: "Assets set aside for later claim by specified accounts.",
    fullDefinition:
      "A claimable balance is assets locked in a special entry that can be claimed by specified accounts under specified conditions. It allows sending assets to accounts that don't yet have trustlines, with time-based conditions on when claims can occur. Useful for airdrops and escrow.",
    level: "advanced",
    category: "features",
    relatedTerms: ["asset", "trustline"],
  },
  sponsorship: {
    id: "sponsorship",
    term: "Sponsorship",
    shortDefinition: "One account paying reserves on behalf of another.",
    fullDefinition:
      "Sponsorship allows one account to pay the base reserve requirements for another account's trustlines, offers, or other entries. This enables applications to onboard users without requiring them to hold XLM for reserves, improving user experience.",
    level: "advanced",
    category: "features",
    relatedTerms: ["reserve", "account"],
  },
  reserve: {
    id: "reserve",
    term: "Reserve",
    shortDefinition: "Minimum XLM balance required to maintain account and data.",
    fullDefinition:
      "The reserve is the minimum XLM balance an account must maintain. The base reserve (currently 0.5 XLM) plus 0.5 XLM per subentry (trustlines, offers, signers, data entries). This prevents ledger bloat and ensures accounts can always pay fees. Reserves can be sponsored.",
    level: "intermediate",
    category: "accounts",
    relatedTerms: ["account", "trustline", "sponsorship"],
  },
};

// Helper functions
export function getTermsByCategory(category: string): GlossaryEntry[] {
  return Object.values(glossaryTerms).filter((term) => term.category === category);
}

export function getTermsByLevel(level: GlossaryLevel): GlossaryEntry[] {
  return Object.values(glossaryTerms).filter((term) => term.level === level);
}

export function searchTerms(query: string): GlossaryEntry[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(glossaryTerms).filter(
    (term) =>
      term.term.toLowerCase().includes(lowerQuery) ||
      term.shortDefinition.toLowerCase().includes(lowerQuery)
  );
}

export const glossaryCategories = [
  { id: "basics", label: "Basics", icon: "Sparkles" },
  { id: "network", label: "Network", icon: "Globe" },
  { id: "accounts", label: "Accounts", icon: "User" },
  { id: "transactions", label: "Transactions", icon: "ArrowLeftRight" },
  { id: "operations", label: "Operations", icon: "Layers" },
  { id: "assets", label: "Assets", icon: "Coins" },
  { id: "trading", label: "Trading", icon: "TrendingUp" },
  { id: "contracts", label: "Smart Contracts", icon: "Code" },
  { id: "features", label: "Features", icon: "Puzzle" },
  { id: "technical", label: "Technical", icon: "Terminal" },
];
