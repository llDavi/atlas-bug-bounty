/* ==========================================================================
   THE DUNGEONS — practical exercises, drawn as places you go into
   ==========================================================================
   A dungeon is a location in the realm with chambers you pass through in
   order. The five chambers are always the same five, because the work is
   always the same five: look, find, open, prove, write.
   ========================================================================== */

export const CHAMBER_ORDER = [
  { no: 1, name: "Reconnaissance", gloss: "Walk the ground. Write down what is there before touching any of it." },
  { no: 2, name: "Discovery", gloss: "Find the assumption the builder made and never wrote down." },
  { no: 3, name: "Exploitation", gloss: "Turn the assumption into something a keeper cannot argue with." },
  { no: 4, name: "Proof", gloss: "Establish impact. Stop the moment it is established." },
  { no: 5, name: "Report", gloss: "Write it so the repair is obvious to somebody who was not there." },
];

export const DUNGEONS = [
  {
    slug: "abandoned-castle",
    name: "The Abandoned Castle",
    place: "forest-of-recon",
    kind: "Ruined keep · three floors, one still standing",
    order: "Reconnaissance",
    difficulty: 2,
    reward: 400,
    hours: "45 minutes",
    state: "digging",
    depth: 3,
    gloss:
      "Nobody has held this castle in years, and yet the gate lamp still burns and the well still draws. Somebody is paying for that.",
    entrance:
      "You are given a name and nothing else. By the time you leave you should be able to draw the castle from memory, including the doors that are not on the plan.",
    chambers: [
      { no: 1, done: false, task: "Survey every wall, tower and outbuilding still answering to the castle's name.", craft: "Subdomain enumeration" },
      { no: 2, done: false, task: "Find the postern gate: a path that answers but appears on no notice board.", craft: "Content discovery" },
      { no: 3, done: false, task: "Open what the postern protects, using only what the walls told you.", craft: "Forced browsing" },
      { no: 4, done: false, task: "Establish what a stranger could reach through it, and go no further.", craft: "Impact assessment" },
      { no: 5, done: false, task: "Draw the castle. Mark the postern. Name the mason who should close it.", craft: "The write-up" },
    ],
  },
  {
    slug: "gatehouse-vault",
    name: "The Gatehouse Vault",
    place: "gatehouse",
    kind: "Guardroom & strongbox · below the gate",
    order: "Authentication",
    difficulty: 3,
    reward: 650,
    hours: "1 hour",
    state: "digging",
    depth: 2,
    gloss:
      "The vault under the gatehouse holds every letter of passage ever issued. The clerk who files them cannot read.",
    entrance:
      "You hold one letter of passage, honestly issued, in your own name. The task is to leave holding a second one that was not.",
    chambers: [
      { no: 1, done: false, task: "Record how a letter of passage is issued, carried and checked.", craft: "Session analysis" },
      { no: 2, done: false, task: "Find which part of the letter the clerk trusts without reading.", craft: "Token inspection" },
      { no: 3, done: false, task: "Carry a letter naming somebody who is not you, and pass the gate.", craft: "Token forgery" },
      { no: 4, done: false, task: "Prove the gate opened. Do not walk further in than the doorway.", craft: "Minimal proof" },
      { no: 5, done: false, task: "Write the account so the clerk is taught to read, not blamed.", craft: "The write-up" },
    ],
  },
  {
    slug: "broken-gate-cellars",
    name: "The Cellars Beneath the Broken Gate",
    place: "broken-gate",
    kind: "Undercroft · numbered doors, one keeper",
    order: "Access Control",
    difficulty: 3,
    reward: 700,
    hours: "1 hour 10",
    state: "digging",
    depth: 4,
    gloss:
      "Every door in the cellars carries a number. The keeper checks the number against a list. There is no second list.",
    entrance:
      "Gain access to the restricted chamber without possessing the guard's credentials — and without reading a single record that is not needed as proof.",
    chambers: [
      { no: 1, done: false, task: "Number the doors: find every place an identifier decides what you see.", craft: "Object mapping" },
      { no: 2, done: false, task: "Ask the keeper for a number that was never issued to you.", craft: "IDOR" },
      { no: 3, done: false, task: "Establish whether the keeper distinguishes reading from writing.", craft: "Privilege climb" },
      { no: 4, done: false, task: "Prove one other party's records answer. One is enough. One is the rule.", craft: "Restraint in proof" },
      { no: 5, done: false, task: "Write the account with the second list the cellars have always needed.", craft: "The write-up" },
    ],
  },
  {
    slug: "stonewatch-well",
    name: "The Well of Stonewatch",
    place: "stonewatch",
    kind: "Curtain wall, stores & a very deep well",
    order: "Server-Side",
    difficulty: 4,
    reward: 1100,
    hours: "1 hour 30",
    state: "digging",
    depth: 5,
    gloss:
      "The keep's messenger will fetch any scroll you name. The well at the centre of the courtyard answers only to those inside the walls.",
    entrance: "Still being dug. Its chambers are being surveyed for the next edition of the codex.",
    chambers: CHAMBER_ORDER.map((c) => ({ no: c.no, done: false, task: "Still being surveyed.", craft: "" })),
  },
  {
    slug: "counting-house",
    name: "The Counting House",
    place: "merchants-scales",
    kind: "Merchant's hall · scales, ledger, strongroom",
    order: "Business Logic",
    difficulty: 5,
    reward: 1500,
    hours: "2 hours",
    state: "digging",
    depth: 4,
    gloss:
      "Three clerks, one ledger, and a rite for handling coin that was written when there was only ever one customer at the counter.",
    entrance: "Still being dug. Its chambers are being surveyed for the next edition of the codex.",
    chambers: CHAMBER_ORDER.map((c) => ({ no: c.no, done: false, task: "Still being surveyed.", craft: "" })),
  },
  {
    slug: "forbidden-dungeon",
    name: "The Forbidden Dungeon",
    place: "forbidden-dungeon",
    kind: "Five doors · each opened by the last",
    order: "Chained Exploitation",
    difficulty: 5,
    reward: 2000,
    hours: "3 hours",
    state: "digging",
    depth: 5,
    gloss:
      "No single flaw down here is worth reporting alone. That is the whole lesson, and it is why the door is barred to novices.",
    entrance: "Still being dug. Its chambers are being surveyed for the next edition of the codex.",
    chambers: CHAMBER_ORDER.map((c) => ({ no: c.no, done: false, task: "Still being surveyed.", craft: "" })),
  },
];

export function dungeonBySlug(slug) {
  return DUNGEONS.find((d) => d.slug === slug);
}
export function dungeonsAtPlace(placeId) {
  return DUNGEONS.filter((d) => d.place === placeId);
}
