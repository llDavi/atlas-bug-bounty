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

/* --------------------------------------------------------------- quests */

/* Quests, not courses. Numbered as they were entered in the journal. */
export const QUESTS = [
  {
    no: 1,
    slug: "the-open-ledger",
    title: "The Open Ledger",
    place: "wanderers-rest",
    beast: "The Mirror's Tongue",
    difficulty: 1,
    reward: 150,
    hours: "20 minutes",
    state: "completed",
    objective:
      "Read a merchant's request and reply in full, and name every part of it the merchant does not control.",
    steps: [
      "Sit with one request until every header has a purpose",
      "Change one value the merchant believes is fixed",
      "Write what the reply admitted to",
    ],
    done: 3,
    gloss:
      "The ledger of Wanderer's Rest is kept in the open, and the keeper has never once looked up.",
  },
  {
    no: 2,
    slug: "the-unlit-paths",
    title: "The Unlit Paths",
    place: "forest-of-recon",
    beast: "—",
    difficulty: 2,
    reward: 300,
    hours: "45 minutes",
    state: "completed",
    objective:
      "Walk the wood until you have named every path into the village that is not on the village's own map.",
    steps: [
      "Survey the subdomains still answering",
      "Find the paths no notice board mentions",
      "Name the stack from what the replies let slip",
      "Write the survey so a second hunter needs no lantern",
    ],
    done: 4,
    gloss:
      "Nothing in the forest is hidden. It is only unlit, and the villagers stopped carrying lanterns.",
  },
  {
    no: 3,
    slug: "the-hall-that-answers",
    title: "The Hall That Answers",
    place: "hall-of-mirrors",
    beast: "The Serpent's Tongue",
    difficulty: 2,
    reward: 400,
    hours: "40 minutes",
    state: "in-progress",
    objective:
      "Make the hall repeat something in its own voice that no visitor was ever meant to be able to say.",
    steps: [
      "Find every place a visitor's words come back",
      "Learn which context they come back into",
      "Escape that context without breaking the page",
      "Prove harm that is not an alert box",
      "Write the account and the ward against it",
    ],
    done: 2,
    gloss:
      "Speak in the Hall of Mirrors and the house answers in your words — but with its own authority behind them.",
  },
  {
    no: 4,
    slug: "the-keepers-seal",
    title: "The Keeper's Seal",
    place: "gatehouse",
    beast: "The Forged Signature",
    difficulty: 3,
    reward: 550,
    hours: "1 hour",
    state: "available",
    objective:
      "Pass the gatehouse carrying a letter that was never issued to you, without breaking the seal on it.",
    steps: [
      "Read what the keeper actually checks",
      "Find the part of the seal the keeper trusts blindly",
      "Carry a letter that is not yours",
      "Stop at proof, and write it down",
    ],
    done: 0,
    gloss:
      "The keeper of the gatehouse checks the seal on the letter. The keeper has never checked the name.",
  },
  {
    no: 5,
    slug: "the-broken-gate",
    title: "The Broken Gate",
    place: "broken-gate",
    beast: "The Gate That Counts",
    difficulty: 3,
    reward: 250,
    hours: "35 minutes",
    state: "available",
    objective:
      "Gain access to the restricted chamber without possessing the guard's credentials.",
    steps: [
      "Number every door and note what numbers them",
      "Ask the gate for a number that is not yours",
      "Establish who else's records answer",
      "Write the account without reading what you found",
    ],
    done: 0,
    gloss:
      "The gate still counts the numbers on the tokens. It stopped asking whose numbers they are some years ago.",
  },
  {
    no: 6,
    slug: "the-marsh-remembers",
    title: "The Marsh Remembers",
    place: "injection-marshes",
    beast: "The Marsh Hydra",
    difficulty: 4,
    reward: 900,
    hours: "1 hour 20",
    state: "sealed",
    objective:
      "Ask the marsh a question of your own making, and have it answer with something it was never told to say.",
    steps: [
      "Find where a question is assembled rather than asked",
      "Prove the shape of the question you can change",
      "Read one fact you were never granted",
      "Establish the depth without draining the water",
      "Write the ward as carefully as the wound",
    ],
    done: 0,
    gloss:
      "Wading in the marshes without care has drowned better hunters than you. Bring a rope and a witness.",
  },
  {
    no: 7,
    slug: "the-messenger-of-stonewatch",
    title: "The Messenger of Stonewatch",
    place: "stonewatch",
    beast: "The Errand Wraith",
    difficulty: 4,
    reward: 1100,
    hours: "1 hour 30",
    state: "sealed",
    objective:
      "Send the keep's own messenger to a door only the keep is permitted to knock upon.",
    steps: [
      "Find every errand the keep runs on a stranger's word",
      "Name a door outside the walls to test the errand",
      "Turn the errand inward",
      "Read what only the keep should be able to read",
      "Establish the blast radius before writing",
      "Write it as the keep's own master would need it",
    ],
    done: 0,
    gloss:
      "The messenger of Stonewatch will fetch any scroll you name, from any library — including the keep's own.",
  },
  {
    no: 8,
    slug: "the-scales-of-nothing",
    title: "The Scales of Nothing",
    place: "merchants-scales",
    beast: "The Hollow Crown",
    difficulty: 5,
    reward: 1400,
    hours: "2 hours",
    state: "sealed",
    objective:
      "Buy from the merchant's stall in such a way that the merchant owes you money at the end of it.",
    steps: [
      "Write out every step of the merchant's rite in order",
      "Find the step that trusts the previous one",
      "Offer the scales a weight the smith never imagined",
      "Repeat it faster than the ledger can be written",
      "Establish the loss in coin, not in theory",
      "Write the account with the ledger attached",
      "Verify the smith's repair",
    ],
    done: 0,
    gloss:
      "No scanner has ever found what lives here. Only somebody who asked what the smith assumed about money, order and time.",
  },
];

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
    mastery: "mastered",
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
    mastery: "mastered",
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
    mastery: "sealed",
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
    mastery: "practised",
    place: "gatehouse",
  },
  {
    slug: "sqli",
    name: "The Marsh Hydra",
    order: "SQL Injection",
    mark: "hydra",
    habitat: "Marshland where questions are assembled from whatever a stranger hands over.",
    spoor: "Sealed until the oath is sworn.",
    ward: "Sealed until the oath is sworn.",
    proof: "REDACTED",
    difficulty: 4,
    reward: 950,
    mastery: "sealed",
    place: "injection-marshes",
  },
  {
    slug: "logic",
    name: "The Hollow Crown",
    order: "Business Logic",
    mark: "crown",
    habitat: "Counting houses, where a rite written for one honest coin meets a dishonest one.",
    spoor: "Sealed until the oath is sworn.",
    ward: "Sealed until the oath is sworn.",
    proof: "REDACTED",
    difficulty: 5,
    reward: 1400,
    mastery: "sealed",
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
    mastery: "practised",
    place: "web-village",
  },
  {
    slug: "deserialisation",
    name: "The Bound Worm",
    order: "Insecure Deserialisation",
    mark: "worm",
    habitat: "Store rooms where written-down things are brought back to life without being read first.",
    spoor: "Sealed until the oath is sworn.",
    ward: "Sealed until the oath is sworn.",
    proof: "REDACTED",
    difficulty: 5,
    reward: 1200,
    mastery: "sealed",
    place: "stonewatch",
  },
];

export const MASTERY = {
  mastered:  { label: "Mastered", tone: "gold" },
  advanced:  { label: "Advanced", tone: "green" },
  practised: { label: "Practised", tone: "" },
  read:      { label: "Read of only", tone: "faint" },
  sealed:    { label: "Sealed", tone: "faint" },
};

/* ------------------------------------------------------------- the roll */

/* Standing, kept as a roll of names — a ruled register, never a podium. */
export const ROLL = [
  { place: 1, name: "Corvath of the Marches", hand: "@nullbyte", rank: "Master of the Hunt", xp: 24800, finds: 142, realm: "Stonewatch" },
  { place: 2, name: "Serah Vane", hand: "@parsel", rank: "Master of the Hunt", xp: 21350, finds: 118, realm: "The Marshes" },
  { place: 3, name: "Old Marrow", hand: "@0xmarrow", rank: "Warden", xp: 17900, finds: 96, realm: "The Trade Routes" },
  { place: 4, name: "Ilva Roen", hand: "@sundials", rank: "Warden", xp: 12440, finds: 71, realm: "The Gatehouse" },
  { place: 5, name: "Bram Kell", hand: "@kellfire", rank: "Ranger", xp: 9120, finds: 58, realm: "Web Village" },
  { place: 6, name: "Hesper Quill", hand: "@hesper", rank: "Ranger", xp: 6400, finds: 41, realm: "The Counting House" },
  { place: 7, name: "Tomas the Patient", hand: "@t0mas", rank: "Hunter", xp: 3980, finds: 27, realm: "The Hall of Mirrors" },
  { place: 8, name: "Arthur of Wanderer's Rest", hand: "@zerodawn", rank: "Hunter", xp: 1800, finds: 9, realm: "The Gatehouse", isYou: true },
];

export const DIFFICULTY_WORD = ["—", "Novice", "Apprentice", "Journeyman", "Expert", "Master"];
