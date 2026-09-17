/* ==========================================================================
   THE WEB REALM — the cartographer's survey
   ==========================================================================
   Learning areas are places, not nodes. Each entry below is a location that
   belongs to the drawn map: the Forest of Recon *is* the forest, Web Village
   *is* the village. Coordinates are in the map's own 1000 × 700 field, hand
   placed the way a surveyor would place them — on ground that suits them.

   state:  charted  — visited, inked in, name written firmly
           current  — where the hunter stands; circled in a later hand
           rumoured — heard of, not walked; drawn in dotted outline
           sealed   — known and shut; drawn with its gate barred
           unknown  — off the survey; the ink fades into the margin
   ========================================================================== */

export const REALM = {
  title: "The Web Realm",
  survey: "Surveyed from the disclosed accounts of hunters, third revision",
  // The cartouche holds two short lines; one long line ran out of its frame.
  surveyLines: ["From hunters' own accounts", "Third revision of the survey"],
  legend: "Roads are the order the ground was first walked. Nothing on this map was drawn from imagination.",
};

export const PLACES = [
  {
    id: "wanderers-rest",
    name: "Wanderer's Rest",
    kind: "village",
    x: 120, y: 470,
    label: "below",
    state: "charted",
    domain: "The Request & the Reply",
    gloss:
      "A waystation on the old road. Every hunter starts here, learning to read what a request carries and what a reply admits to.",
    teaches: ["HTTP", "Headers", "Cookies & sessions"],
    quests: 3,
    dungeon: null,
  },
  {
    id: "forest-of-recon",
    name: "The Forest of Recon",
    kind: "forest",
    x: 300, y: 330,
    label: "above",
    state: "charted",
    domain: "Reconnaissance",
    gloss:
      "Nothing here is hidden; it is only unlit. Subdomains, forgotten hosts and old paths stand in the undergrowth exactly where they were left.",
    teaches: ["Subdomain survey", "Content discovery", "Reading a stack"],
    quests: 4,
    dungeon: "abandoned-castle",
  },
  {
    id: "web-village",
    name: "Web Village",
    kind: "village",
    x: 415, y: 505,
    label: "below",
    state: "charted",
    domain: "Web Applications",
    gloss:
      "Forms, ledgers, notice boards. The village keeps its records in the open and trusts whatever hand fills them in.",
    teaches: ["Input handling", "Reflection", "Client-side trust"],
    quests: 5,
    dungeon: null,
  },
  {
    id: "gatehouse",
    name: "The Gatehouse",
    kind: "gate",
    x: 545, y: 375,
    label: "right",
    state: "current",
    domain: "Authentication & Sessions",
    gloss:
      "The keeper checks the seal on the letter, never the name of the one carrying it. Every hunter's second lesson, and half the realm's undoing.",
    teaches: ["Session handling", "Token forgery", "Password rites"],
    quests: 4,
    dungeon: "gatehouse-vault",
  },
  {
    id: "hall-of-mirrors",
    name: "The Hall of Mirrors",
    kind: "ruin",
    x: 300, y: 605,
    label: "below",
    state: "charted",
    domain: "Cross-Site Scripting",
    gloss:
      "Whatever you say in this hall is said back to you, word for word, in the voice of the house itself.",
    teaches: ["Reflected & stored XSS", "Context escaping", "Impact beyond an alert"],
    quests: 3,
    dungeon: null,
  },
  {
    id: "broken-gate",
    name: "The Broken Gate",
    kind: "ruin",
    x: 690, y: 545,
    label: "below",
    state: "rumoured",
    domain: "Broken Access Control",
    gloss:
      "The gate still counts the numbers on the tokens. It stopped asking whose numbers they are some years ago.",
    teaches: ["IDOR", "Privilege climb", "Forced browsing"],
    quests: 4,
    dungeon: "broken-gate-cellars",
  },
  {
    id: "cartographers-tower",
    name: "The Cartographer's Tower",
    kind: "tower",
    x: 785, y: 300,
    label: "above",
    labelDx: -20, // clear of the warning in the sea
    state: "rumoured",
    domain: "CSRF, CORS & Redirects",
    gloss:
      "From the tower every route in the realm is drawn as a line and named. Some of those lines were never meant to be public.",
    teaches: ["Cross-site request forgery", "CORS misconfiguration", "Open redirect"],
    quests: 5,
    dungeon: null,
  },
  {
    id: "injection-marshes",
    name: "The Injection Marshes",
    kind: "marsh",
    x: 480, y: 200,
    label: "above",
    state: "rumoured",
    domain: "Injection",
    gloss:
      "Ask the marsh a question and it answers with everything it has ever been told. Wading here without care has drowned better hunters.",
    teaches: ["SQL injection", "Command injection", "Template injection"],
    quests: 4,
    dungeon: null,
  },
  {
    id: "merchants-scales",
    name: "The Merchant's Scales",
    kind: "bridge",
    x: 640, y: 685,
    label: "below",
    state: "sealed",
    domain: "Business Logic",
    gloss:
      "The scales were cut for honest weights. Nobody asked the smith what they would do if a merchant offered less than nothing.",
    teaches: ["Race conditions", "Price tampering", "Order of operations"],
    quests: 3,
    dungeon: "counting-house",
  },
  {
    id: "stonewatch",
    name: "Stonewatch Keep",
    kind: "keep",
    x: 855, y: 470,
    label: "below",
    labelDx: -50, // kept inland, clear of the coast
    state: "sealed",
    domain: "Server-Side Flaws",
    gloss:
      "Behind the curtain wall: the stores, the well, and a messenger who will fetch any scroll you name from any library, including the keep's own.",
    teaches: ["SSRF", "File upload", "Path traversal"],
    quests: 5,
    dungeon: "stonewatch-well",
  },
  {
    id: "forbidden-dungeon",
    name: "The Forbidden Dungeon",
    kind: "dungeon",
    x: 175, y: 175,
    label: "below",
    state: "sealed",
    domain: "Chained Exploitation",
    gloss:
      "Five doors, each opened by what was taken from the last. No single flaw in here is worth reporting alone.",
    teaches: ["Chaining", "Escalation", "Proof of impact"],
    quests: 2,
    dungeon: "forbidden-dungeon",
  },
  {
    id: "the-abyss",
    name: "The Abyss",
    kind: "abyss",
    x: 930, y: 655,
    label: "below",
    state: "unknown",
    domain: "Advanced Techniques",
    gloss:
      "Where the survey stops. Contracts that cannot be amended, devices nobody updates, and the accounts of the hunters who went down to look.",
    teaches: ["Request smuggling", "Cache poisoning", "Deserialisation"],
    quests: 0,
    dungeon: null,
  },
];

/* Roads. `kind` is how the ground is drawn, not a UI state.
   road — an old paved way, walked often
   path — a track through wild ground
   ford — a crossing, drawn broken where it enters water */
export const ROADS = [
  { from: "wanderers-rest", to: "forest-of-recon", kind: "road" },
  { from: "wanderers-rest", to: "web-village", kind: "road" },
  { from: "forest-of-recon", to: "injection-marshes", kind: "path" },
  { from: "forest-of-recon", to: "gatehouse", kind: "road" },
  { from: "forest-of-recon", to: "forbidden-dungeon", kind: "path" },
  { from: "web-village", to: "hall-of-mirrors", kind: "path" },
  { from: "web-village", to: "gatehouse", kind: "road" },
  { from: "gatehouse", to: "cartographers-tower", kind: "road" },
  { from: "gatehouse", to: "broken-gate", kind: "path" },
  { from: "broken-gate", to: "merchants-scales", kind: "path" },
  { from: "broken-gate", to: "stonewatch", kind: "road" },
  { from: "cartographers-tower", to: "stonewatch", kind: "path" },
  { from: "merchants-scales", to: "the-abyss", kind: "ford" },
  { from: "stonewatch", to: "the-abyss", kind: "ford" },
];

export const STATE_NOTE = {
  drawn: "On the survey",
  charted: "Walked and written up",
  current: "You stand here",
  rumoured: "Heard of, not walked",
  sealed: "Barred — the oath opens it",
  unknown: "Off the survey",
};

export function placeById(id) {
  return PLACES.find((p) => p.id === id);
}
