/* ==========================================================================
   THE CHAPTERS OF EACH KINGDOM
   ==========================================================================
   One chapter is one quest, and one quest is one place on its kingdom's
   map. The Web Realm's chapters sit on the places already drawn on its
   survey (by `place` id); the other kingdoms are still being surveyed, so
   their chapters are listed here until their maps are drawn.
   ========================================================================== */

export const CHAPTERS = {
  web: [
    { place: "wanderers-rest", title: "The Request & the Reply", topic: "HTTP, requests, responses, cookies" },
    { place: "forest-of-recon", title: "Reconnaissance", topic: "Subdomains, content discovery, fingerprinting" },
    { place: "web-village", title: "The Trusting Village", topic: "How an app handles input and trusts the client" },
    { place: "gatehouse", title: "The Keeper's Seal", topic: "Authentication and sessions" },
    { place: "hall-of-mirrors", title: "The Hall That Answers", topic: "Cross-site scripting" },
    { place: "broken-gate", title: "The Broken Gate", topic: "Broken access control and IDOR" },
    { place: "cartographers-tower", title: "Letters in Another's Name", topic: "CSRF, CORS and open redirect" },
    { place: "injection-marshes", title: "The Marsh Remembers", topic: "SQL, command and template injection" },
    { place: "merchants-scales", title: "The Scales of Nothing", topic: "Business logic and race conditions" },
    { place: "stonewatch", title: "The Messenger of Stonewatch", topic: "SSRF, file upload, path traversal" },
    { place: "forbidden-dungeon", title: "Five Doors", topic: "Chaining flaws and proving impact" },
    { place: "the-abyss", title: "Where the Survey Grows Dark", topic: "Request smuggling, cache poisoning, deserialisation" },
  ],
  api: [
    { title: "How an API Speaks", topic: "REST, JSON and tokens" },
    { title: "Mapping the Routes", topic: "Documentation, Swagger, versions" },
    { title: "The Numbered Crates", topic: "BOLA / IDOR on APIs" },
    { title: "Forged Passes", topic: "Broken authentication and JWT" },
    { title: "The Overfull Manifest", topic: "Mass assignment and excessive data exposure" },
    { title: "Toll Gates", topic: "Rate limits and business flows" },
    { title: "The Graph of Roads", topic: "GraphQL" },
    { title: "Messengers on the Road", topic: "Webhooks and integrations" },
  ],
  mobile: [
    { title: "The Anatomy of a Glass Ship", topic: "What is inside an APK or IPA" },
    { title: "Listening at the Harbour", topic: "Intercepting traffic, certificate pinning" },
    { title: "Secrets in the Hold", topic: "Data and secrets stored on the device" },
    { title: "Doors from the Sea", topic: "Deep links and intents" },
    { title: "Windows in the Hull", topic: "WebViews" },
    { title: "The Harbour Master", topic: "The app's own backend" },
    { title: "Taking the Ship Apart", topic: "Reverse engineering basics" },
  ],
  "smart-contracts": [
    { title: "How a Vault Is Sworn", topic: "Solidity and the EVM" },
    { title: "Reading the Vault's Charter", topic: "Reading a contract and its scope on Immunefi" },
    { title: "Who Holds the Keys", topic: "Access control" },
    { title: "The Door That Opens Twice", topic: "Reentrancy" },
    { title: "Crooked Weights", topic: "Rounding, precision and oracles" },
    { title: "The Queue at the Counter", topic: "Front-running and MEV" },
    { title: "A Vault with a Second Door", topic: "Upgradeable proxies" },
    { title: "Proof in Iron", topic: "Writing a proof of concept with Foundry" },
  ],
  networks: [
    { title: "Walls and Watchtowers", topic: "Hosts, ports and IP ranges in scope" },
    { title: "Reading the Banners", topic: "Service fingerprinting" },
    { title: "Gates Left Open", topic: "Exposed services and default credentials" },
    { title: "Storerooms in the Sky", topic: "Misconfigured cloud storage (S3 buckets)" },
    { title: "The Keep's Own Voice", topic: "Cloud metadata through SSRF" },
    { title: "Abandoned Towers", topic: "Subdomain takeover" },
    { title: "Secrets in the Wild", topic: "Keys in repositories and CI" },
  ],
};

export function chaptersOf(kingdomId) {
  return CHAPTERS[kingdomId] || [];
}
