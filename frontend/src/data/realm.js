/* ==========================================================================
   THE REALM'S VOCABULARY — mirrors backend/sources/realm.py
   ==========================================================================
   Alignments are the classes: an identity each hunter picks for themselves,
   so all nine are playable. The only thing an alignment gives is its seal.
   Kingdoms are the paths a bug bounty hunter can take; follow any number.
   ========================================================================== */

export const ALIGNMENTS = [
  { id: "lawful-good", en: "Lawful Good", archetype: "The Paladin", seal: "#2f4a6b",
    note: "Strictly in scope. Always reports. Never touches data beyond proof." },
  { id: "neutral-good", en: "Neutral Good", archetype: "The Benefactor", seal: "#4a5c37",
    note: "Reports out-of-scope findings anyway, unpaid, because someone should." },
  { id: "chaotic-good", en: "Chaotic Good", archetype: "The Rebel", seal: "#8a2f23",
    note: "Goes full disclosure when a vendor sits on a fix for a year." },
  { id: "lawful-neutral", en: "Lawful Neutral", archetype: "The Judge", seal: "#5b5140",
    note: "Works the engagement to the letter. The contract is the morality." },
  { id: "true-neutral", en: "True Neutral", archetype: "The Curious", seal: "#7a6a45",
    note: "Hacks to understand. No flag, no agenda, no side." },
  { id: "chaotic-neutral", en: "Chaotic Neutral", archetype: "The Cynic", seal: "#6b3f5c",
    note: "Tests what is interesting, ignores what is permitted." },
  { id: "lawful-evil", en: "Lawful Evil", archetype: "The Dominator", seal: "#2b2724",
    note: "Sells the zero-day through proper channels, to buyers who use it." },
  { id: "neutral-evil", en: "Neutral Evil", archetype: "The Opportunist", seal: "#3d4a42",
    note: "Whoever pays most gets the bug. Nothing personal." },
  { id: "chaotic-evil", en: "Chaotic Evil", archetype: "The Destroyer", seal: "#5a1a14",
    note: "Burns it down because it burns." },
];

/* Five kingdoms, one for each kind of ground real bug bounty programmes put
   in scope (tallied from Bugcrowd, Immunefi, Intigriti and YesWeHack). */
export const KINGDOMS = [
  { id: "web", name: "The Web Realm", real: "Web applications", mark: "gate",
    gloss: "Forms, sessions and ledgers kept in the open." },
  { id: "api", name: "The Trade Routes", real: "APIs", mark: "signpost",
    gloss: "Every identifier is a question nobody checked." },
  { id: "mobile", name: "The Glass Coast", real: "Mobile apps · Android & iOS", mark: "mirror",
    gloss: "What the app hides on the device, it hides badly." },
  { id: "smart-contracts", name: "The Sealed Vaults", real: "Smart contracts & blockchain", mark: "key",
    gloss: "Code that cannot be amended once it is sworn." },
  { id: "networks", name: "The Cloud Spires", real: "Networks & cloud", mark: "lantern",
    gloss: "Hosts, IP ranges and keeps in the sky with doors left on the latch." },
];

export function alignmentById(id) {
  return ALIGNMENTS.find((a) => a.id === id);
}

export function kingdomById(id) {
  return KINGDOMS.find((k) => k.id === id);
}
