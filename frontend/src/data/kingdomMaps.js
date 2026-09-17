/* ==========================================================================
   THE KINGDOMS, SURVEYED
   ==========================================================================
   Each kingdom that is not the Web Realm is drawn here as a real map, in the
   same manner as the Web Realm's survey: an organic coast, ranges, woods and
   rivers, with every chapter hand-placed on ground that suits it and joined
   by wandering roads. `places` are in chapter order — places[0] is the first
   chapter, and its `place` (if any) is the id of a written quest's location.

   kind:   which glyph is drawn (see RealmMap GLYPHS)
   label:  where the name sits — above | below | left | right
   Coordinates live in each map's own 1000 × 720 field.
   ========================================================================== */

export const KINGDOM_MAPS = {
  /* -------------------------------------------------------- The Trade Routes */
  api: {
    title: "The Trade Routes",
    sub: ["A land of roads and tolls", "Where every crate is trusted"],
    coast: "M 1000 96 C 956 250 936 402 906 556 C 890 640 846 692 786 720",
    ranges: [
      { x: 120, y: 130, count: 4, scale: 1, seed: 3 },
      { x: 400, y: 108, count: 4, scale: 0.95, seed: 9 },
      { x: 660, y: 124, count: 3, scale: 0.85, seed: 15 },
    ],
    woods: [
      { x: 150, y: 300, w: 74, h: 24, n: 6, seed: 21, s: 0.9 },
      { x: 690, y: 604, w: 84, h: 26, n: 7, seed: 27, s: 0.9 },
      { x: 470, y: 470, w: 60, h: 18, n: 5, seed: 33, s: 0.8 },
    ],
    rivers: [
      "M 300 132 C 322 240 384 300 402 402 C 426 520 520 604 640 660 C 700 690 742 706 806 716",
      "M 420 116 C 440 190 410 250 452 316",
    ],
    seas: [[912, 250], [944, 402], [900, 556], [828, 680]],
    hamlets: [[224, 512], [520, 300], [392, 604], [712, 356]],
    places: [
      { place: "wanderers-rest", kind: "gate", x: 176, y: 436, label: "above", name: "How an API Speaks", domain: "REST, JSON & tokens" },
      { kind: "tower", x: 258, y: 246, label: "above", name: "Mapping the Routes", domain: "Docs, Swagger, versions" },
      { kind: "market", x: 352, y: 544, label: "below", name: "The Numbered Crates", domain: "BOLA / IDOR" },
      { kind: "toll", x: 466, y: 336, label: "above", name: "Forged Passes", domain: "Broken auth & JWT" },
      { kind: "market", x: 566, y: 566, label: "below", name: "The Overfull Manifest", domain: "Mass assignment" },
      { kind: "toll", x: 664, y: 438, label: "right", name: "Toll Gates", domain: "Rate limits & flows" },
      { kind: "crossroads", x: 604, y: 236, label: "above", name: "The Graph of Roads", domain: "GraphQL" },
      { kind: "keep", x: 838, y: 500, label: "below", name: "Messengers on the Road", domain: "Webhooks & integrations" },
    ],
    roads: [
      [0, 1, "road"], [0, 2, "road"], [1, 3, "road"], [1, 6, "path"],
      [2, 4, "road"], [3, 6, "road"], [3, 5, "path"], [4, 5, "road"],
      [5, 7, "road"], [6, 7, "path"], [4, 7, "ford"],
    ],
    annotations: [
      { x: 604, y: 300, rot: -3, text: "every road meets here" },
      { x: 470, y: 396, rot: 2, text: "toll paid in coin, not truth" },
    ],
    seaName: { x: 946, y: 400, rot: 80, text: "The Trade Sea" },
    compass: { x: 928, y: 150, r: 32 },
    scale: { x: 44, y: 668 },
    serpent: { x: 872, y: 648 },
  },

  /* --------------------------------------------------------- The Glass Coast */
  mobile: {
    title: "The Glass Coast",
    sub: ["Ships that carry their own cargo", "And hide it badly below deck"],
    coast: "M 40 486 C 210 516 350 468 520 520 C 690 572 830 520 1000 560",
    coastBelow: true,
    ranges: [
      { x: 170, y: 150, count: 3, scale: 0.9, seed: 4 },
      { x: 500, y: 128, count: 4, scale: 0.9, seed: 12 },
      { x: 800, y: 150, count: 3, scale: 0.85, seed: 18 },
    ],
    woods: [
      { x: 360, y: 224, w: 74, h: 22, n: 6, seed: 23, s: 0.85 },
      { x: 660, y: 210, w: 70, h: 20, n: 6, seed: 29, s: 0.85 },
    ],
    reeds: [{ x: 240, y: 500, n: 5, seed: 31 }],
    rivers: ["M 520 132 C 500 220 540 300 512 380 C 494 432 500 470 508 512"],
    seas: [[160, 588], [360, 606], [560, 588], [760, 606], [900, 566]],
    hamlets: [[420, 300], [700, 320]],
    places: [
      { kind: "harbour", x: 168, y: 470, label: "above", name: "The Anatomy of a Glass Ship", domain: "Inside an APK or IPA" },
      { kind: "harbour", x: 356, y: 460, label: "above", name: "Listening at the Harbour", domain: "Intercepting traffic, pinning" },
      { kind: "vault", x: 260, y: 300, label: "above", name: "Secrets in the Hold", domain: "Data & secrets on the device" },
      { kind: "gate", x: 470, y: 372, label: "above", name: "Doors from the Sea", domain: "Deep links & intents" },
      { kind: "lighthouse", x: 600, y: 502, label: "right", name: "Windows in the Hull", domain: "WebViews" },
      { kind: "keep", x: 772, y: 300, label: "above", name: "The Harbour Master", domain: "The app’s own backend" },
      { kind: "ruin", x: 842, y: 486, label: "below", name: "Taking the Ship Apart", domain: "Reverse engineering" },
    ],
    roads: [
      [0, 1, "road"], [0, 2, "path"], [1, 3, "road"], [1, 2, "path"],
      [3, 4, "road"], [3, 5, "path"], [4, 6, "road"], [5, 6, "path"],
    ],
    annotations: [
      { x: 300, y: 542, rot: -3, text: "the shore is all glass" },
      { x: 690, y: 172, rot: 2, text: "the master lives inland" },
    ],
    seaName: { x: 520, y: 664, rot: -2, text: "The Glass Sea" },
    compass: { x: 928, y: 96, r: 30 },
    scale: { x: 44, y: 668 },
    serpent: { x: 640, y: 648 },
  },

  /* -------------------------------------------------------- The Cloud Spires */
  networks: {
    title: "The Cloud Spires",
    sub: ["Keeps built high in the air", "With doors left on the latch"],
    ranges: [
      { x: 110, y: 300, count: 3, scale: 1.1, seed: 2 },
      { x: 300, y: 250, count: 4, scale: 1.15, seed: 6 },
      { x: 520, y: 200, count: 4, scale: 1.2, seed: 11 },
      { x: 740, y: 180, count: 3, scale: 1.05, seed: 15 },
      { x: 240, y: 470, count: 3, scale: 0.9, seed: 19 },
      { x: 640, y: 460, count: 3, scale: 0.9, seed: 24 },
    ],
    woods: [{ x: 460, y: 600, w: 90, h: 26, n: 8, seed: 27, s: 0.9 }],
    rivers: ["M 200 320 C 300 380 360 420 460 470 C 560 520 660 520 780 560"],
    seas: [],
    hamlets: [[380, 520], [560, 540]],
    places: [
      { kind: "tower", x: 156, y: 452, label: "below", name: "Walls and Watchtowers", domain: "Hosts, ports & IP ranges" },
      { kind: "tower", x: 300, y: 340, label: "above", name: "Reading the Banners", domain: "Service fingerprinting" },
      { kind: "gate", x: 436, y: 452, label: "below", name: "Gates Left Open", domain: "Exposed services, default creds" },
      { kind: "keep", x: 560, y: 288, label: "above", name: "Storerooms in the Sky", domain: "Misconfigured cloud storage" },
      { kind: "keep", x: 712, y: 380, label: "right", name: "The Keep’s Own Voice", domain: "Cloud metadata through SSRF" },
      { kind: "ruin", x: 786, y: 236, label: "above", name: "Abandoned Towers", domain: "Subdomain takeover" },
      { kind: "forest", x: 470, y: 566, label: "below", name: "Secrets in the Wild", domain: "Keys in repos & CI" },
    ],
    roads: [
      [0, 1, "path"], [1, 2, "path"], [2, 3, "road"], [1, 3, "path"],
      [3, 4, "road"], [3, 5, "path"], [4, 5, "path"], [2, 6, "path"], [4, 6, "ford"],
    ],
    annotations: [
      { x: 470, y: 140, rot: -2, text: "the air thins here" },
      { x: 260, y: 400, rot: 3, text: "climb from the west" },
    ],
    compass: { x: 928, y: 96, r: 30 },
    scale: { x: 44, y: 668 },
    serpent: { x: 820, y: 640 },
  },

  /* ------------------------------------------------------- The Sealed Vaults */
  "smart-contracts": {
    title: "The Sealed Vaults",
    sub: ["An island of strongrooms", "Sworn shut, and never amended"],
    land: "M 140 350 C 168 168 372 108 520 112 C 706 116 862 190 882 356 C 896 486 726 566 520 570 C 300 574 108 486 140 350 Z",
    waterRings: { d: "M 140 350 C 168 168 372 108 520 112 C 706 116 862 190 882 356 C 896 486 726 566 520 570 C 300 574 108 486 140 350 Z", cx: 512, cy: 336 },
    ranges: [{ x: 440, y: 210, count: 3, scale: 0.85, seed: 8 }],
    woods: [
      { x: 250, y: 460, w: 60, h: 18, n: 5, seed: 14, s: 0.8 },
      { x: 770, y: 450, w: 60, h: 18, n: 5, seed: 18, s: 0.8 },
    ],
    rivers: [],
    seas: [[70, 300], [90, 470], [520, 640], [930, 300], [930, 470], [300, 96], [720, 96]],
    hamlets: [[360, 400], [640, 400]],
    places: [
      { kind: "vault", x: 230, y: 330, label: "below", name: "How a Vault Is Sworn", domain: "Solidity & the EVM" },
      { kind: "tower", x: 372, y: 236, label: "above", name: "Reading the Vault’s Charter", domain: "Reading a contract & its scope" },
      { kind: "gate", x: 520, y: 336, label: "below", name: "Who Holds the Keys", domain: "Access control" },
      { kind: "vault", x: 664, y: 242, label: "above", name: "The Door That Opens Twice", domain: "Reentrancy" },
      { kind: "market", x: 772, y: 366, label: "right", name: "Crooked Weights", domain: "Rounding, precision, oracles" },
      { kind: "vault", x: 316, y: 470, label: "below", name: "The Queue at the Counter", domain: "Front-running & MEV" },
      { kind: "vault", x: 512, y: 492, label: "below", name: "A Vault with a Second Door", domain: "Upgradeable proxies" },
      { kind: "keep", x: 700, y: 466, label: "right", name: "Proof in Iron", domain: "A PoC with Foundry" },
    ],
    roads: [
      [0, 1, "path"], [1, 2, "road"], [2, 3, "road"], [3, 4, "path"],
      [0, 5, "path"], [2, 6, "path"], [5, 6, "road"], [6, 7, "road"], [4, 7, "path"],
    ],
    annotations: [
      { x: 512, y: 150, rot: -2, text: "no charter is ever rewritten" },
    ],
    seaName: { x: 88, y: 388, rot: -84, text: "The Warded Sea" },
    compass: { x: 930, y: 128, r: 30 },
    scale: { x: 44, y: 660 },
    serpent: { x: 520, y: 660 },
  },
};

export function kingdomMap(id) {
  return KINGDOM_MAPS[id] || null;
}
