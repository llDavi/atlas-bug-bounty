import { useState } from "react";
import { Link } from "react-router-dom";
import { KINGDOMS, kingdomById } from "../../data/realm";
import { chaptersOf } from "../../data/chapters";
import { rankOf } from "../../data/journal";
import { useHunter } from "../../hunter-context";
import { roman } from "../../utils/numerals";
import { Stamp, Fleuron, Mark } from "./Codex";
import { Range, Wood, Reeds, CompassRose, ScaleBar, Serpent } from "./WorldMap";
import "./world-map.css";

/* ==========================================================================
   THE KNOWN WORLD — the five kingdoms on one sheet
   ==========================================================================
   Drawn in the same hand as the Web Realm's survey: a mainland of four
   kingdoms and the island of the Sealed Vaults, ringed by water-lines,
   crossed by roads, filled with ranges, woods and rivers so the sheet reads
   as a country and not a diagram. Touch a kingdom and its card opens beside
   the map; from the card you enter the kingdom, whose own map holds its
   chapters.
   ========================================================================== */

const W = 1000;
const H = 720;

/* Where each kingdom's capital stands on the sheet. */
const SEATS = {
  web: { x: 208, y: 372 },
  networks: { x: 470, y: 150 },
  api: { x: 548, y: 348 },
  mobile: { x: 452, y: 566 },
  "smart-contracts": { x: 852, y: 402 },
};

const ROADS = [
  ["web", "api", "road"],
  ["web", "networks", "path"],
  ["web", "mobile", "road"],
  ["api", "networks", "road"],
  ["api", "mobile", "road"],
  ["api", "smart-contracts", "ford"],
];

/* The two landmasses. The mainland has bays and a peninsula so its coast is
   worth drawing water-lines around; the island is smaller and rounder. */
const MAINLAND =
  "M 74 150 C 130 96 210 92 292 96 C 356 99 402 78 470 74 C 548 69 626 82 668 132 C 700 170 686 214 708 258 C 732 306 736 360 722 410 C 706 468 726 512 690 560 C 650 612 566 618 496 616 C 430 614 372 640 300 636 C 214 631 120 618 82 548 C 48 486 66 420 56 356 C 49 300 44 236 56 200 C 62 178 62 166 74 150 Z";
const ISLAND =
  "M 792 316 C 852 288 928 312 946 378 C 962 438 936 500 878 520 C 828 537 786 512 772 458 C 760 410 764 350 792 316 Z";

/* Dashed inland borders between the four mainland kingdoms. */
const BORDERS = [
  "M 300 98 C 348 168 404 206 486 214 C 560 221 622 202 664 176",
  "M 396 190 C 386 268 408 330 388 402 C 376 446 362 486 340 522",
  "M 340 522 C 300 556 276 600 268 632",
  "M 340 522 C 424 506 512 498 592 506 C 636 510 668 494 700 470",
];

/* Water-lines: the coast redrawn a few times, nudged outward into the sea,
   fading — the engraver's way of shading a shore. */
function coastLines(d, cx, cy, n = 3) {
  return Array.from({ length: n }, (_, i) => {
    const s = 1 + (i + 1) * 0.014;
    return { d, key: i, transform: `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`, opacity: 0.5 - i * 0.13 };
  });
}

function roadPath(a, b, i) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = (i % 2 ? 1 : -1) * Math.min(42, len * 0.14);
  return `M ${a.x} ${a.y} Q ${mx - (dy / len) * bend} ${my + (dx / len) * bend} ${b.x} ${b.y}`;
}

/* A tiny unnamed hamlet, drawn to fill honest ground the way a surveyor
   marks the villages he passed but did not write up. */
function Hamlet({ x, y, s = 1 }) {
  return (
    <g opacity="0.8">
      <path className="place-ink-soft" d={`M ${x - 6 * s} ${y} v ${-6 * s} h ${12 * s} v ${6 * s} Z`} />
      <path className="place-ink-soft" d={`M ${x - 8 * s} ${y - 6 * s} l ${8 * s} ${-6 * s} l ${8 * s} ${6 * s}`} />
    </g>
  );
}

/* Each capital drawn in ink: the Web's fortified gate, the market cross of
   the Trade Routes, the Glass Coast's lighthouse, the Cloud Spires' towers on
   their peak, and the strongroom of the Sealed Vaults. */
const CAPITAL = {
  web: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 26} ${y} v -30 h 14 v 30`} />
      <path className="place-ink" d={`M ${x + 12} ${y} v -30 h 14 v 30`} />
      <path className="place-ink" d={`M ${x - 12} ${y} v -20 h 24 v 20`} />
      <path className="place-ink" d={`M ${x - 7} ${y} v -10 a 7 7 0 0 1 14 0 v 10`} />
      {[-26, -21, -16, 12, 17, 22].map((dx) => (
        <path key={dx} className="place-ink" d={`M ${x + dx} ${y - 30} v -4 h 4 v 4`} />
      ))}
      <path className="place-ink-soft" d={`M ${x - 46} ${y} v -9 h 14 v 9 M ${x - 49} ${y - 9} l 10 -8 10 8`} />
      <path className="place-ink-soft" d={`M ${x + 32} ${y} v -9 h 14 v 9 M ${x + 29} ${y - 9} l 10 -8 10 8`} />
    </g>
  ),
  api: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 26} ${y} L ${x - 6} ${y - 30} L ${x + 14} ${y}`} />
      <path className="place-ink-soft" d={`M ${x - 6} ${y - 30} v ${30} M ${x - 16} ${y} q 10 -10 20 0`} />
      <path className="place-ink" d={`M ${x - 6} ${y - 30} v -9 l 10 3 -10 3`} />
      <path className="place-ink" d={`M ${x + 26} ${y} v -34 M ${x + 26} ${y - 30} h 18 l -4 5 h -14 M ${x + 26} ${y - 19} h -16 l 4 5 h 12`} />
      <path className="place-ink-soft" d={`M ${x - 40} ${y} v -9 h 9 v 9 Z M ${x - 31} ${y} v -6 h 7 v 6`} />
    </g>
  ),
  mobile: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 36} ${y + 8} L ${x - 20} ${y - 6} L ${x + 18} ${y - 6} L ${x + 34} ${y + 8}`} />
      <path className="place-ink" d={`M ${x - 8} ${y - 6} L ${x - 5} ${y - 42} h 10 L ${x + 8} ${y - 6}`} />
      <path className="place-ink-soft" d={`M ${x - 7} ${y - 18} h 14 M ${x - 6} ${y - 30} h 12`} />
      <path className="place-ink" d={`M ${x - 7} ${y - 42} h 14 v -7 h -14 Z M ${x - 5} ${y - 49} l 5 -6 l 5 6`} />
      <path className="place-ink-soft" d={`M ${x - 12} ${y - 47} l -16 -4 M ${x + 12} ${y - 47} l 16 -4 M ${x - 12} ${y - 43} l -14 4 M ${x + 12} ${y - 43} l 14 4`} />
    </g>
  ),
  networks: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 44} ${y + 6} L ${x - 14} ${y - 22} L ${x + 2} ${y - 8} L ${x + 20} ${y - 26} L ${x + 46} ${y + 6}`} />
      <path className="place-ink" d={`M ${x - 18} ${y - 20} v -18 l 4 -9 l 4 9 v 18`} />
      <path className="place-ink" d={`M ${x + 16} ${y - 24} v -22 l 4 -10 l 4 10 v 22`} />
      <path className="place-ink" d={`M ${x - 2} ${y - 10} v -14 l 3 -7 l 3 7 v 14`} />
    </g>
  ),
  "smart-contracts": ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 30} ${y} v -30 h 60 v 30 Z`} style={{ fill: "var(--survey-bg)" }} />
      <path className="place-ink" d={`M ${x - 34} ${y - 30} h 68 l -6 -9 h -56 Z`} />
      <circle className="place-ink" cx={x} cy={y - 19} r="4.5" />
      <path className="place-ink" d={`M ${x - 2} ${y - 15} l -2 9 h 8 l -2 -9`} />
      <path className="place-ink-soft" d={`M ${x - 30} ${y - 24} q -12 6 -16 18 M ${x + 30} ${y - 24} q 12 6 16 18`} />
      <path className="place-ink-soft" d={`M ${x - 22} ${y} v -24 M ${x + 22} ${y} v -24`} />
    </g>
  ),
};

function KingdomCard({ k, quests, hunter, onClose }) {
  const chapters = chaptersOf(k.id);
  const written = quests.filter((q) => q.kingdom === k.id);
  const discharged = written.filter((q) => q.status === "completed").length;
  const followed = hunter?.kingdoms?.includes(k.id);
  const grade = hunter ? rankOf(hunter.kingdom_xp?.[k.id] || 0).level : null;

  return (
    <div className="leaf leaf--lit quire" style={{ padding: "1.8rem 1.9rem" }}>
      <div className="flex items-start justify-between gap-3">
        <p className="t-caps">{followed ? "A kingdom you follow" : "A kingdom of the realm"}</p>
        <button type="button" onClick={onClose} className="t-caps" style={{ color: "var(--ink-faint)" }}>Close</button>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span style={{ color: "var(--ink-strong)" }}><Mark name={k.mark} size={30} /></span>
        <h3 className="t-entry">{k.name}</h3>
      </div>
      <p className="t-hand mt-1.5">{k.real}</p>

      <hr className="rule rule--tight" />

      <p className="t-small">{k.gloss}</p>

      <p className="t-caps mt-6 label-gap">Its chapters</p>
      <ol className="flex flex-col gap-1.5">
        {chapters.slice(0, 4).map((c, i) => (
          <li key={c.title} className="t-small">
            <span className="t-caps" style={{ display: "inline-block", width: "2.4rem", color: "var(--ink-faint)" }}>{roman(i + 1)}</span>
            {c.title}
          </li>
        ))}
      </ol>
      {chapters.length > 4 && <p className="t-caps mt-2" style={{ color: "var(--ink-faint)" }}>and {chapters.length - 4} more</p>}

      <div className="flex flex-wrap gap-2 mt-6">
        <Stamp tone={written.length ? "" : "faint"}>
          {written.length ? `${written.length} of ${chapters.length} written` : "Being surveyed"}
        </Stamp>
        {hunter && discharged > 0 && <Stamp tone="green">{discharged} discharged</Stamp>}
        {hunter && followed && <Stamp tone="rubric">Grade {roman(grade)}</Stamp>}
      </div>

      <Link to={`/kingdoms/${k.id}`} className="ink-btn ink-btn--filled w-full mt-7">Enter the kingdom</Link>
    </div>
  );
}

function AtlasLegend() {
  return (
    <div className="leaf leaf--aged" style={{ padding: "1.8rem 1.9rem" }}>
      <p className="t-caps">Reading the sheet</p>
      <h3 className="t-entry mt-2">The known world</h3>
      <Fleuron width={120} className="mt-3" />
      <p className="mt-5 t-small">
        Five kingdoms, one for every kind of ground a real bounty programme puts in scope. Each
        has its own chapters; the roads show how the ground joins up.
      </p>
      <hr className="rule rule--tight" />
      <p className="margin-note">Touch a kingdom and I will read you what is written of it.</p>
      <div className="flex justify-center mt-4" style={{ color: "var(--ink-faint)" }}>
        <Mark name="quill" size={30} />
      </div>
    </div>
  );
}

export default function WorldAtlas({ quests }) {
  const { status, hunter } = useHunter();
  const [chosenId, setChosenId] = useState(null);
  const chosen = chosenId ? kingdomById(chosenId) : null;
  const me = status === "ready" ? hunter : null;

  const toggle = (id) => setChosenId((cur) => (cur === id ? null : id));

  return (
    <div className="survey-layout">
      <div className="survey">
        <div className="survey-sheet">
          <svg viewBox={`0 0 ${W} ${H}`} className="survey-svg" role="img" aria-label="The known world: five kingdoms">
            {/* ---- the two landmasses ---- */}
            <path className="realm-land" d={MAINLAND} />
            <path className="realm-land" d={ISLAND} />

            {/* ---- water-lines shading each coast ---- */}
            {coastLines(MAINLAND, 383, 355).map((c) => (
              <path key={`m${c.key}`} className="mk-water" d={c.d} transform={c.transform} opacity={c.opacity} style={{ fill: "none" }} />
            ))}
            {coastLines(ISLAND, 858, 418).map((c) => (
              <path key={`i${c.key}`} className="mk-water" d={c.d} transform={c.transform} opacity={c.opacity} style={{ fill: "none" }} />
            ))}

            {/* ---- open sea, drawn as running swell ---- */}
            {[[724, 214], [760, 300], [742, 470], [700, 588], [36, 300], [64, 470], [300, 664], [430, 678], [872, 566], [936, 470], [900, 250]].map(([x, y]) => (
              <path key={`${x}-${y}`} className="mk-water" d={`M ${x - 22} ${y} q 5 -4 11 0 q 6 4 11 0 q 5 -4 11 0 q 6 4 11 0`} style={{ fill: "none" }} />
            ))}

            {/* ---- mountains, woods and the long rivers ---- */}
            <Range x={300} y={122} count={4} scale={1} seed={3} />
            <Range x={520} y={112} count={4} scale={0.95} seed={9} />
            <Range x={632} y={140} count={3} scale={0.8} seed={21} />
            <Wood x={132} y={278} w={78} h={26} n={7} seed={5} s={1} />
            <Wood x={170} y={498} w={90} h={26} n={8} seed={8} s={0.95} />
            <Wood x={628} y={430} w={64} h={20} n={5} seed={13} s={0.85} />
            <Wood x={636} y={556} w={72} h={22} n={6} seed={27} s={0.9} />
            <Reeds x={332} y={604} n={6} seed={33} />
            {/* rivers falling from the northern ranges to the sea */}
            <path className="mk-water" d="M 305 132 C 300 220 336 268 320 340 C 306 402 328 452 304 520 C 286 572 300 606 314 632" style={{ fill: "none" }} />
            <path className="mk-water" d="M 520 128 C 540 200 512 246 536 316 C 552 366 540 410 566 470" style={{ fill: "none" }} />
            <path className="mk-water" d="M 470 214 C 452 262 474 300 452 350" opacity="0.5" style={{ fill: "none" }} />

            {/* ---- borders of the kingdoms ---- */}
            {BORDERS.map((d) => (
              <path key={d} className="realm-border" d={d} />
            ))}

            {/* ---- roads between the capitals ---- */}
            {ROADS.map(([a, b, kind], i) => (
              <path key={`${a}-${b}`} className={`mk-road mk-road--${kind}`} d={roadPath(SEATS[a], SEATS[b], i)} />
            ))}

            {/* ---- unnamed hamlets, filling the ground ---- */}
            <Hamlet x={356} y={456} />
            <Hamlet x={244} y={512} s={0.9} />
            <Hamlet x={588} y={230} s={0.9} />
            <Hamlet x={392} y={288} s={0.85} />
            <Hamlet x={520} y={470} s={0.9} />

            {/* ---- the kingdoms themselves ---- */}
            {KINGDOMS.map((k) => {
              const seat = SEATS[k.id];
              const Capital = CAPITAL[k.id];
              const followed = me?.kingdoms?.includes(k.id);
              return (
                <g
                  key={k.id}
                  className={`place place--drawn ${followed ? "is-followed" : ""} ${chosenId === k.id ? "is-chosen" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${k.name} — ${k.real}`}
                  onClick={() => toggle(k.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(k.id);
                    }
                  }}
                >
                  <circle className="place-halo" cx={seat.x} cy={seat.y - 10} r="74" />
                  <Capital x={seat.x} y={seat.y} />
                  {followed && <path className="realm-flag" d={`M ${seat.x + 34} ${seat.y - 20} v -30 l 16 6 -16 6`} />}
                  <text className="place-name realm-name" x={seat.x} y={seat.y + 44} textAnchor="middle">{k.name}</text>
                  <text className="place-gloss" x={seat.x} y={seat.y + 65} textAnchor="middle">{k.real}</text>
                </g>
              );
            })}

            {/* ---- annotations in a later hand ---- */}
            <text className="map-hand" x="470" y="252" transform="rotate(-3 470 252)">the high roads meet here</text>
            <text className="map-hand" x="852" y="336" textAnchor="middle" transform="rotate(3 852 336)">answers to no one</text>
            <text className="map-hand" x="118" y="332" transform="rotate(-4 118 332)">hunters start west</text>

            {/* ---- sea lettering and fittings ---- */}
            <text className="map-sea-name" x="0" y="0" transform="translate(500 688) rotate(-2)" textAnchor="middle">The Sundering Sea</text>
            <text className="map-warning" x="812" y="112" textAnchor="middle" transform="rotate(-6 812 112)">Hic sunt dracones</text>
            <Serpent x={846} y={640} />
            <CompassRose x={906} y={158} r={32} />
            <ScaleBar x={44} y={664} />

            {/* ---- cartouche, top-left, like the realm survey ---- */}
            <g>
              <path className="mk-frame mk-fill-paper" d="M 30 26 h 290 l 14 14 v 58 l -14 14 H 44 L 30 98 Z" />
              <path className="mk-hachure" d="M 37 33 h 276 l 9 9 v 46 l -9 9 H 48 l -11 -9 Z" />
              <text className="map-cartouche-title" x="52" y="60" style={{ fontSize: 20 }}>The Known World</text>
              <text className="map-cartouche-sub" x="52" y="80">Five kingdoms of the hunt</text>
              <text className="map-cartouche-sub" x="52" y="94">From the hunters&rsquo; accounts</text>
            </g>

            {/* ---- outer frame ---- */}
            <path className="mk-frame" d={`M 6 6 h ${W - 12} v ${H - 12} H 6 Z`} />
            <path className="mk-hachure" d={`M 13 13 h ${W - 26} v ${H - 26} H 13 Z`} />
          </svg>
        </div>
        <p className="survey-hint">drag the sheet to read the far corners</p>
      </div>

      <aside>
        {chosen ? (
          <KingdomCard k={chosen} quests={quests || []} hunter={me} onClose={() => setChosenId(null)} />
        ) : (
          <AtlasLegend />
        )}
      </aside>
    </div>
  );
}
