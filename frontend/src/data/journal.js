/* ==========================================================================
   THE JOURNAL — the hunter's own pages
   ==========================================================================
   Shapes match what a real API would hand back, so nothing here needs
   restructuring when the backend catches up:
     beasts   -> walkthroughs (vuln_class, difficulty)
     mastery  -> per-user progress
     sealed   -> the existing Clerk `is_pro` gate
   ========================================================================== */

export const RANKS = [
  { title: "Wanderer", xpReq: 0 },
  { title: "Scout", xpReq: 500 },
  { title: "Hunter", xpReq: 1500 },
  { title: "Ranger", xpReq: 3500 },
  { title: "Warden", xpReq: 7000 },
  { title: "Master of the Hunt", xpReq: 12000 },
];

export function rankOf(xp) {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].xpReq) i = k;
  const next = RANKS[i + 1];
  const pct = next
    ? Math.round(((xp - RANKS[i].xpReq) / (next.xpReq - RANKS[i].xpReq)) * 100)
    : 100;
  return { level: i + 1, index: i, rank: RANKS[i], next, pct };
}

/* --------------------------------------------------------- the character */

export const HUNTER = {
  name: "Arthur of Wanderer's Rest",
  shortName: "Arthur",
  title: "The Web Rogue",
  class: "Rogue · Reconnaissance",
  hand: "@zerodawn",
  xp: 1800,
  standing: "Sworn to no lord; indentured to the report",
  enrolled: "Third moon of the year 2025",
  vigil: 12,          // consecutive days at the work
  finds: 9,           // bugs accepted
  whereabouts: "gatehouse",

  /* Attributes are marked in roman numerals, out of X. */
  attributes: [
    { name: "Recon", value: 8, note: "Finds the door nobody drew on the plan" },
    { name: "Exploitation", value: 6, note: "Turns a curiosity into a proof" },
    { name: "Logic", value: 9, note: "Asks what the builder assumed" },
    { name: "Patience", value: 9, note: "Reads the whole ledger, twice" },
    { name: "Reporting", value: 5, note: "Writes so the fix is obvious" },
    { name: "Restraint", value: 7, note: "Stops at proof, never at profit" },
  ],

  /* Skills read as an index: name .......... standing */
  skills: [
    { name: "HTTP", standing: "Mastered" },
    { name: "Recon", standing: "Advanced" },
    { name: "IDOR", standing: "Mastered" },
    { name: "XSS", standing: "Advanced" },
    { name: "Auth & sessions", standing: "Practised" },
    { name: "SSRF", standing: "Sealed" },
    { name: "Injection", standing: "Read of only" },
    { name: "Business logic", standing: "Sealed" },
  ],

  /* Equipment is real tooling, named as an adventurer would name it. */
  equipment: [
    { slot: "Glass", name: "The Proxy Glass", real: "Burp Suite", carried: true, mark: "mirror" },
    { slot: "Lens", name: "Wright's Lens", real: "Browser dev tools", carried: true, mark: "eye" },
    { slot: "Seal", name: "The Repeater's Seal", real: "Request repeater", carried: true, mark: "key" },
    { slot: "Tome", name: "Grimoire of Names", real: "SecLists wordlists", carried: true, mark: "tome" },
    { slot: "Lantern", name: "Surveyor's Lantern", real: "amass · httpx · ffuf", carried: true, mark: "lantern" },
    { slot: "Quill", name: "The Honest Quill", real: "Structured report notes", carried: true, mark: "quill" },
    { slot: "Chain", name: "Chain of Custody", real: "Scoped, logged testing", carried: false, mark: "chain" },
  ],

  achievements: [
    { name: "First Blood", note: "A first accepted report", won: true },
    { name: "The Mirror Answered", note: "Proved a stored XSS", won: true },
    { name: "Counter of Numbers", note: "Three IDORs in one program", won: true },
    { name: "The Night Vigil", note: "Twelve days without breaking the work", won: true },
    { name: "Surveyor", note: "Charted a whole realm's scope", won: false },
    { name: "Breaker of Scales", note: "A logic flaw nobody scanned for", won: false },
  ],
};

/* ------------------------------------------------------------- bestiary */

/* Vulnerability classes, entered as a bestiary: what the beast is, where it
   nests, how it is recognised in the field, and the ward against it. */
export const BEASTS = [
  {
    slug: "xss",
    name: "The Serpent's Tongue",
    order: "Cross-Site Scripting",
    mark: "serpent",
    habitat: "Wherever a visitor's words are repeated back in the house's own voice.",
    spoor:
      "Any point where input returns unescaped into markup, an attribute, or a script — search feedback, error text, a name printed on a receipt.",
    ward: "Encode on output, for the context it lands in. Never on input, never once.",
    proof: "<img src=x onerror=alert(document.domain)>",
    difficulty: 2,
    reward: 250,
    place: "hall-of-mirrors",
  },
  {
    slug: "idor",
    name: "The Gate That Counts",
    order: "Broken Access Control · IDOR",
    mark: "gate",
    habitat: "Old gates that were built to count tokens rather than to ask names.",
    spoor:
      "An identifier in a path, a body or a header. Change it to a neighbour's and watch whether the gate objects.",
    ward: "Authorise the actor against the object, on the server, on every request.",
    proof: "GET /api/invoice/1042   →   try 1043",
    difficulty: 3,
    reward: 500,
    place: "broken-gate",
  },
  {
    slug: "ssrf",
    name: "The Errand Wraith",
    order: "Server-Side Request Forgery",
    mark: "raven",
    habitat: "Keeps that run errands on a stranger's word: imports, webhooks, printers of documents.",
    spoor:
      "Any feature that fetches a location you supply. Point it somewhere it should not be able to reach and read what comes back.",
    ward: "Resolve, then allow-list. Refuse the inward addresses, and refuse the redirect that leads to them.",
    proof: "url=http://169.254.169.254/latest/meta-data/",
    difficulty: 4,
    reward: 900,
    place: "stonewatch",
  },
  {
    slug: "csrf",
    name: "The Forged Signature",
    order: "Cross-Site Request Forgery",
    mark: "key",
    habitat: "Gatehouses that trust the seal and never the hand that carried the letter.",
    spoor:
      "A state-changing request with no per-request token. Any page the victim visits can write it on their behalf.",
    ward: "Per-request tokens, and cookies that refuse to travel with a stranger's page.",
    proof: '<form action="/api/transfer" method="POST">',
    difficulty: 2,
    reward: 300,
    place: "gatehouse",
  },
  {
    slug: "sqli",
    name: "The Marsh Hydra",
    order: "SQL Injection",
    mark: "hydra",
    habitat: "Marshland where questions are assembled from whatever a stranger hands over.",
    spoor: null,
    ward: null,
    proof: null,
    difficulty: 4,
    reward: 950,
    place: "injection-marshes",
  },
  {
    slug: "logic",
    name: "The Hollow Crown",
    order: "Business Logic",
    mark: "crown",
    habitat: "Counting houses, where a rite written for one honest coin meets a dishonest one.",
    spoor: null,
    ward: null,
    proof: null,
    difficulty: 5,
    reward: 1400,
    place: "merchants-scales",
  },
  {
    slug: "open-redirect",
    name: "The False Signpost",
    order: "Open Redirect",
    mark: "signpost",
    habitat: "Crossroads where the sign points wherever the last traveller turned it.",
    spoor:
      "A destination carried in the request and honoured without question. Small alone; a courier for larger beasts.",
    ward: "Redirect only to places written down in advance.",
    proof: "/login?next=//evil.example/",
    difficulty: 1,
    reward: 200,
    place: "web-village",
  },
  {
    slug: "deserialisation",
    name: "The Bound Worm",
    order: "Insecure Deserialisation",
    mark: "worm",
    habitat: "Store rooms where written-down things are brought back to life without being read first.",
    spoor: null,
    ward: null,
    proof: null,
    difficulty: 5,
    reward: 1200,
    place: "stonewatch",
  },
];

export const DIFFICULTY_WORD = ["—", "Novice", "Apprentice", "Journeyman", "Expert", "Master"];
