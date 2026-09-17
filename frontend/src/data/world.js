/* ==========================================================================
   THE WEB REALM — the cartographer's survey
   ==========================================================================
   Learning areas are places, not nodes. Each entry is one chapter of the Web
   Realm (see data/chapters.js), set on ground that suits it. The last place,
   the Nameless City, is the kingdom's Final Boss. Coordinates are in the
   map's own 1000 × 760 field, hand placed the way a surveyor would place them.

   state:  charted  — visited, inked in, name written firmly
           current  — where the hunter stands; circled in a later hand
           rumoured — heard of, not walked; drawn in dotted outline
           sealed   — known and shut; drawn with its gate barred
           unknown  — off the survey; the ink fades into the margin
   ========================================================================== */

export const REALM = {
  title: "The Web Realm",
  survey: "Surveyed from the disclosed accounts of hunters, third revision",
  surveyLines: ["From hunters' own accounts", "Third revision of the survey"],
  legend: "Roads are the order the ground was first walked. Nothing on this map was drawn from imagination.",
};

export const PLACES = [
  {
    id: "wanderers-rest", name: "The Common Tongue", kind: "village",
    x: 120, y: 470, label: "below", state: "current",
    domain: "The Language of the Web",
    gloss: "Where every hunter starts, learning the language the whole web speaks — requests, replies, and what a page admits to.",
    teaches: ["HTTP & HTTPS", "Cookies & sessions", "How the web talks"],
    dungeon: null,
  },
  {
    id: "web-village", name: "The Armoury", kind: "village",
    x: 415, y: 505, label: "below", state: "rumoured",
    domain: "The Hunter's Arsenal",
    gloss: "The town armoury. Here you take up the proxy, the repeater and the wordlist, and learn to bend a request to your hand.",
    teaches: ["Burp Suite", "Proxy & Repeater", "curl & wordlists"],
    dungeon: null,
  },
  {
    id: "forest-of-recon", name: "The Forest of Recon", kind: "forest",
    x: 300, y: 330, label: "above", state: "rumoured",
    domain: "Reconnaissance",
    gloss: "Nothing here is hidden; it is only unlit. Subdomains, forgotten hosts and old paths stand in the undergrowth where they were left.",
    teaches: ["Subdomains", "Content discovery", "Attack surface"],
    dungeon: "abandoned-castle",
  },
  {
    id: "gatehouse", name: "The Gatehouse", kind: "gate",
    x: 545, y: 375, label: "right", state: "rumoured",
    domain: "Authentication",
    gloss: "The keeper checks the seal on the letter, never the name of the one who carries it. Half the realm's undoing.",
    teaches: ["Sessions & JWT", "OAuth & SSO", "Auth bypass"],
    dungeon: "gatehouse-vault",
  },
  {
    id: "broken-gate", name: "The Warden's Keys", kind: "ruin",
    x: 690, y: 545, label: "below", state: "rumoured",
    domain: "Authorization",
    gloss: "The warden still counts the numbers on the tokens. He stopped asking whose numbers they are some years ago.",
    teaches: ["IDOR & BOLA", "Privilege escalation", "Access control"],
    dungeon: "broken-gate-cellars",
  },
  {
    id: "hall-of-mirrors", name: "The Hall of Mirrors", kind: "ruin",
    x: 300, y: 605, label: "below", state: "rumoured",
    domain: "Client-Side Attacks",
    gloss: "Whatever you say in this hall is said back to you, word for word, in the voice of the house itself.",
    teaches: ["Reflected & stored XSS", "DOM XSS", "CSP bypass"],
    dungeon: null,
  },
  {
    id: "stonewatch", name: "The Undercroft", kind: "keep",
    x: 855, y: 470, label: "below", labelDx: -50, state: "rumoured",
    domain: "Server-Side Attacks",
    gloss: "Below the keep: the stores, the well, and a messenger who will fetch any scroll you name from any library, including the keep's own.",
    teaches: ["SQL & command injection", "SSRF & XXE", "File upload"],
    dungeon: "stonewatch-well",
  },
  {
    id: "injection-marshes", name: "The Shifting Ways", kind: "marsh",
    x: 480, y: 200, label: "above", state: "rumoured",
    domain: "Modern Web",
    gloss: "The ground here is never the same twice. New roads open overnight and close by morning; the careless drown where a path was yesterday.",
    teaches: ["GraphQL", "Request smuggling", "Cache poisoning"],
    dungeon: null,
  },
  {
    id: "merchants-scales", name: "The Merchant's Scales", kind: "bridge",
    x: 640, y: 685, label: "below", state: "rumoured",
    domain: "Business Logic",
    gloss: "The scales were cut for honest weights. Nobody asked the smith what they would do if a merchant offered less than nothing.",
    teaches: ["Business logic", "Race conditions", "Price tampering"],
    dungeon: "counting-house",
  },
  {
    id: "cartographers-tower", name: "The Hunter's Charter", kind: "tower",
    x: 785, y: 300, label: "above", labelDx: -20, state: "rumoured",
    domain: "The Hunter",
    gloss: "From the tower the whole hunt is planned: which keeps to walk, what the charter permits, and how to write down what you found.",
    teaches: ["Scope & rules", "Impact & CVSS", "Writing reports"],
    dungeon: null,
  },
  {
    id: "forbidden-dungeon", name: "The Nameless City", kind: "dungeon",
    x: 175, y: 175, label: "below", state: "sealed",
    domain: "Final Boss · an unknown web application",
    gloss: "A city on no map, with no hint of where its walls give way. Everything the realm taught you, spent on one gate.",
    teaches: ["Everything, chained", "No hints", "One target"],
    dungeon: "forbidden-dungeon",
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
