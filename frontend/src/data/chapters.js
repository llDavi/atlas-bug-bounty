/* ==========================================================================
   THE CURRICULUM — the chapters of every kingdom
   ==========================================================================
   One chapter is one place on its kingdom's map. A chapter is a module: it
   carries many topics (its micro-lessons) and, at its end, sometimes a Boss
   or a Dungeon — the practical trial that proves the chapter. Every kingdom
   closes on a Final Boss: an unknown target, no hints, walked end to end.

   Each chapter:
     id      stable id (kingdom + order)
     place   the id of its place on the map
     title   the fantasy name written on the map
     real    the plain-language subject, for the reader who wants it
     topics  the micro-lessons, in the order they are learned
     trial   optional { kind: "boss" | "dungeon", brief } at the chapter's end
   ========================================================================== */

export const CHAPTERS = {
  /* ------------------------------------------------------------ The Web Realm */
  web: [
    {
      id: "web-1", place: "wanderers-rest",
      title: "The Common Tongue", real: "The Language of the Web",
      topics: [
        "Internet & Web", "Client / Server", "DNS", "IP & Ports", "TCP / UDP",
        "HTTP", "HTTPS & TLS", "Requests & Responses", "HTTP Methods", "Status Codes",
        "Headers", "Cookies", "Sessions", "Browsers & DevTools", "HTML",
        "JavaScript fundamentals", "Same-Origin Policy", "CORS", "How modern web apps work",
      ],
      trial: { kind: "boss", brief: "Take an unknown application and reconstruct how it works." },
    },
    {
      id: "web-2", place: "web-village",
      title: "The Armoury", real: "The Hunter's Arsenal",
      topics: [
        "Burp Suite", "Proxy", "Repeater", "Intruder", "Decoder", "Comparer",
        "Browser integration", "Request manipulation", "Encoding", "Wordlists", "curl", "Basic automation",
      ],
      trial: { kind: "boss", brief: "Intercept and manipulate a live session." },
    },
    {
      id: "web-3", place: "forest-of-recon",
      title: "The Forest of Recon", real: "Reconnaissance",
      topics: [
        "Passive recon", "Active recon", "Asset discovery", "Subdomains", "DNS enumeration",
        "Certificate transparency", "IP discovery", "Virtual hosts", "Technology fingerprinting",
        "Directory discovery", "Endpoint discovery", "JavaScript analysis", "Parameter discovery",
        "Attack surface mapping",
      ],
      trial: { kind: "dungeon", brief: "Start from a domain and build the whole attack surface." },
    },
    {
      id: "web-4", place: "the-gatehouse",
      title: "The Gatehouse", real: "Authentication",
      topics: [
        "Login", "Registration", "Password policies", "Sessions", "Session fixation",
        "Password reset", "Email verification", "MFA", "Remember-me", "OAuth",
        "JWT", "SSO", "Account linking", "Authentication bypass",
      ],
    },
    {
      id: "web-5", place: "broken-gate",
      title: "The Warden's Keys", real: "Authorization",
      topics: [
        "Authentication vs Authorization", "Horizontal privilege escalation", "Vertical privilege escalation",
        "IDOR", "BOLA", "Forced browsing", "Access control", "API authorization",
        "Multi-tenant applications", "Role manipulation",
      ],
      trial: { kind: "boss", brief: "Reach a resource you hold no permission for." },
    },
    {
      id: "web-6", place: "hall-of-mirrors",
      title: "The Hall of Mirrors", real: "Client-Side Attacks",
      topics: [
        "XSS fundamentals", "Reflected XSS", "Stored XSS", "DOM XSS", "JavaScript sinks",
        "Sources", "CSP", "CSP bypass", "Open redirect", "Clickjacking", "Prototype pollution",
      ],
    },
    {
      id: "web-7", place: "stonewatch",
      title: "The Undercroft", real: "Server-Side Attacks",
      topics: [
        "SQL Injection", "NoSQL Injection", "Command Injection", "Path Traversal", "LFI / RFI",
        "File Upload", "XXE", "SSTI", "SSRF", "Deserialization", "Server-side request manipulation",
      ],
    },
    {
      id: "web-8", place: "injection-marshes",
      title: "The Shifting Ways", real: "Modern Web",
      topics: [
        "GraphQL", "WebSockets", "HTTP/2", "HTTP request smuggling", "Web cache poisoning",
        "Web cache deception", "Host header attacks", "Prototype pollution", "Race conditions",
      ],
    },
    {
      id: "web-9", place: "merchants-scales",
      title: "The Merchant's Scales", real: "Business Logic",
      topics: [
        "Trust boundaries", "Workflow manipulation", "Price manipulation", "Coupon abuse",
        "Quantity manipulation", "Race conditions", "Duplicate transactions", "State manipulation",
        "Account takeover chains", "Privilege escalation chains",
      ],
    },
    {
      id: "web-10", place: "cartographers-tower",
      title: "The Hunter's Charter", real: "The Hunter",
      topics: [
        "Choosing programs", "Reading scope", "Rules of engagement", "Recon workflow", "Attack surface",
        "Hypothesis-driven testing", "Finding unusual behavior", "Chaining vulnerabilities",
        "Assessing impact", "Avoiding false positives", "Writing reports", "CVSS / severity",
        "Communicating with triage", "Duplicate management", "Responsible disclosure",
      ],
    },
  ],

  /* --------------------------------------------------------- The Trade Routes */
  api: [
    {
      id: "api-1", place: "common-ledger",
      title: "The Common Ledger", real: "Understanding APIs",
      topics: [
        "What an API is", "REST", "JSON", "Endpoints", "CRUD", "HTTP APIs",
        "GraphQL", "SOAP / XML", "API authentication", "API versioning",
      ],
    },
    {
      id: "api-2", place: "mapping-routes",
      title: "Mapping the Routes", real: "API Recon",
      topics: [
        "Finding API endpoints", "Swagger / OpenAPI", "API documentation", "JavaScript discovery",
        "Endpoint enumeration", "Parameter discovery", "API version discovery", "Hidden endpoints",
      ],
    },
    {
      id: "api-3", place: "sealed-passes",
      title: "The Sealed Passes", real: "Authentication",
      topics: ["API keys", "Bearer tokens", "JWT", "OAuth", "Refresh tokens", "Token handling", "Authentication bypass"],
    },
    {
      id: "api-4", place: "numbered-crates",
      title: "The Numbered Crates", real: "Authorization",
      topics: ["BOLA", "BFLA", "IDOR", "Role manipulation", "Tenant isolation", "Object-level authorization"],
    },
    {
      id: "api-5", place: "overfull-manifest",
      title: "The Overfull Manifest", real: "Input & Data",
      topics: ["Mass assignment", "Parameter pollution", "Injection", "Type confusion", "Excessive data exposure", "Improper validation"],
    },
    {
      id: "api-6", place: "toll-roads",
      title: "The Toll Roads", real: "API Abuse",
      topics: ["Rate limits", "Race conditions", "Resource exhaustion", "Business logic", "Pagination abuse", "File upload APIs", "Webhooks"],
    },
    {
      id: "api-7", place: "web-of-roads",
      title: "The Web of Roads", real: "GraphQL",
      topics: ["Schema discovery", "Introspection", "Queries", "Mutations", "Authorization", "GraphQL injection", "Excessive query depth"],
    },
  ],

  /* ----------------------------------------------------------- The Glass Coast */
  mobile: [
    {
      id: "mobile-1", place: "anatomy-of-a-ship",
      title: "The Anatomy of a Ship", real: "Mobile Foundations",
      topics: [
        "How a mobile app works", "Client/server architecture", "Android architecture", "iOS architecture",
        "APK", "IPA", "Mobile permissions", "App lifecycle", "Local storage", "Network communication",
      ],
    },
    {
      id: "mobile-2", place: "breaking-the-hull",
      title: "Breaking Open the Hull", real: "Mobile Recon",
      topics: [
        "APK extraction", "IPA analysis", "App enumeration", "Certificate analysis", "Manifest",
        "Entitlements", "Strings", "Resources", "Endpoints", "Secrets discovery",
      ],
    },
    {
      id: "mobile-3", place: "listening-harbour",
      title: "Listening at the Harbour", real: "Traffic Analysis",
      topics: ["Proxying mobile traffic", "Burp Suite", "Certificates", "TLS", "Certificate pinning", "Pinning bypass", "API discovery"],
    },
    {
      id: "mobile-4", place: "emerald-docks",
      title: "The Emerald Docks", real: "Android",
      topics: [
        "Android components", "Activities", "Services", "Broadcast receivers", "Content providers",
        "Intents", "Deep links", "WebViews", "Storage", "Permissions",
      ],
    },
    {
      id: "mobile-5", place: "walled-harbour",
      title: "The Walled Harbour", real: "iOS",
      topics: ["App sandbox", "Keychain", "URL schemes", "Universal links", "WebViews", "Permissions", "Local storage", "Entitlements"],
    },
    {
      id: "mobile-6", place: "secrets-in-hold",
      title: "Secrets in the Hold", real: "Mobile Vulnerabilities",
      topics: [
        "Insecure storage", "Hardcoded secrets", "Weak authentication", "Broken authorization",
        "Deep-link vulnerabilities", "WebView vulnerabilities", "Exported components",
        "Insecure communication", "Certificate pinning", "Root/jailbreak detection",
      ],
    },
    {
      id: "mobile-7", place: "taking-ship-apart",
      title: "Taking the Ship Apart", real: "Reverse Engineering",
      topics: ["Static analysis", "Dynamic analysis", "JADX", "Frida", "Objection", "Ghidra basics", "Runtime instrumentation"],
    },
  ],

  /* ---------------------------------------------------------- The Sealed Vaults */
  "smart-contracts": [
    {
      id: "sc-1", place: "ledger-of-stone",
      title: "The Ledger of Stone", real: "Blockchain Fundamentals",
      topics: ["What a blockchain is", "Blocks", "Transactions", "Wallets", "Private keys", "Public keys", "Addresses", "Gas", "Nodes", "Consensus"],
    },
    {
      id: "sc-2", place: "engine-of-vault",
      title: "The Engine of the Vault", real: "Ethereum",
      topics: ["EVM", "Accounts", "Transactions", "Smart contracts", "ABI", "Bytecode", "Events", "Storage", "Calldata", "Opcodes"],
    },
    {
      id: "sc-3", place: "language-of-oaths",
      title: "The Language of Oaths", real: "Solidity",
      topics: ["Syntax", "Variables", "Functions", "Modifiers", "Visibility", "Inheritance", "Interfaces", "Libraries", "Storage vs memory", "Events"],
    },
    {
      id: "sc-4", place: "cracks-in-vault",
      title: "The Cracks in the Vault", real: "Smart Contract Vulnerabilities",
      topics: [
        "Reentrancy", "Access control", "Integer issues", "Oracle manipulation", "Flash loans",
        "Price manipulation", "Front-running", "Signature issues", "Delegatecall",
        "Proxy vulnerabilities", "Initialization issues", "Business logic",
      ],
    },
    {
      id: "sc-5", place: "auditors-lantern",
      title: "The Auditor's Lantern", real: "Auditing",
      topics: ["Reading contracts", "Finding attack surfaces", "Static analysis", "Slither", "Foundry", "Hardhat", "Testing", "Fuzzing", "Symbolic execution", "Exploit development"],
    },
  ],

  /* ---------------------------------------------------------- The Cloud Spires */
  networks: [
    {
      id: "net-1", place: "roads-between-keeps",
      title: "The Roads Between Keeps", real: "Network Foundations",
      topics: ["OSI", "TCP/IP", "IP", "Subnets", "Ports", "TCP", "UDP", "DNS", "DHCP", "Routing", "Firewalls", "Proxies"],
    },
    {
      id: "net-2", place: "watchmans-survey",
      title: "The Watchman's Survey", real: "Network Recon",
      topics: ["Port scanning", "Service enumeration", "Banner grabbing", "Nmap", "DNS enumeration", "Network mapping", "Service fingerprinting"],
    },
    {
      id: "net-3", place: "keeps-in-sky",
      title: "The Keeps in the Sky", real: "Cloud Fundamentals",
      topics: ["Cloud computing", "IaaS / PaaS / SaaS", "AWS", "Azure", "GCP", "Regions", "Availability zones", "IAM", "Storage", "Compute", "Networking"],
    },
    {
      id: "net-4", place: "doors-on-latch",
      title: "Doors Left on the Latch", real: "Cloud Security",
      topics: [
        "IAM misconfiguration", "Excessive permissions", "Public storage", "Exposed credentials",
        "Metadata services", "Instance roles", "Security groups", "Network exposure", "Secrets management",
      ],
    },
    {
      id: "net-5", place: "the-great-spire",
      title: "The Great Spire", real: "AWS",
      topics: ["S3", "EC2", "IAM", "Lambda", "API Gateway", "Cognito", "ECS", "EKS", "Secrets Manager", "CloudFront"],
    },
    {
      id: "net-6", place: "twin-spires",
      title: "The Twin Spires", real: "Azure & GCP",
      topics: ["Azure AD / Entra", "Azure Storage", "Functions", "GCP IAM", "GCS", "Cloud Functions", "Service Accounts"],
    },
    {
      id: "net-7", place: "climb-to-crown",
      title: "The Climb to the Crown", real: "Cloud Attack Chains",
      topics: ["Public bucket", "Credential exposure", "IAM misconfiguration", "Privilege escalation", "Cloud takeover"],
    },
  ],
};

/* Each kingdom's Final Boss: an unknown target, no hints, walked end to end
   (Recon → Discovery → Investigation → Exploitation → Impact → Report). It is
   the last place on the kingdom's map. */
export const FINAL_BOSSES = {
  web: {
    id: "web-final", place: "forbidden-dungeon",
    title: "The Nameless City", real: "An unknown web application",
    brief: "A web application you have never seen, with no hint of where it breaks. Recon, discovery, investigation, exploitation, impact, report — everything the realm taught, on one target.",
  },
  api: {
    id: "api-final", place: "blind-caravan",
    title: "The Blind Caravan", real: "A black-box API assessment",
    brief: "An API handed to you blind. Map it, break its trust, and write the assessment.",
  },
  mobile: {
    id: "mobile-final", place: "unknown-vessel",
    title: "The Unknown Vessel", real: "An unknown mobile app",
    brief: "A real app, no telling in advance which flaw it carries. Take it apart and find out.",
  },
  "smart-contracts": {
    id: "sc-final", place: "unaudited-vault",
    title: "The Unaudited Vault", real: "Audit an unaudited contract",
    brief: "A contract nobody has audited. Read it, break it, and produce a professional security report.",
  },
  networks: {
    id: "net-final", place: "sky-fortress",
    title: "The Sky Fortress", real: "A black-box cloud environment",
    brief: "A cloud environment given black-box. Survey it, chain the misconfigurations, and take the crown.",
  },
};

export function chaptersOf(kingdomId) {
  return CHAPTERS[kingdomId] || [];
}

export function finalBossOf(kingdomId) {
  return FINAL_BOSSES[kingdomId] || null;
}

/* Chapters plus the Final Boss, for pages that walk a kingdom end to end. */
export function chaptersWithBoss(kingdomId) {
  const boss = FINAL_BOSSES[kingdomId];
  return boss ? [...chaptersOf(kingdomId), { ...boss, finalBoss: true, topics: [] }] : chaptersOf(kingdomId);
}
