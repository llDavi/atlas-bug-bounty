import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PLACES, ROADS, REALM, STATE_NOTE } from "../../data/world";
import { dungeonsAtPlace } from "../../data/dungeons";
import { Stamp, Fleuron, Mark } from "./Codex";
import { roman } from "../../utils/numerals";
import "./world-map.css";

/* ==========================================================================
   THE SURVEY OF THE WEB REALM
   ==========================================================================
   A cartographer's sheet: coast, hachures, ranges, woods, rivers, roads and
   settlements. The learning areas ARE the settlements — the wood is drawn as
   a wood, the keep as a keep — so nothing here floats above a backdrop.
   ========================================================================== */

const W = 1000;
const H = 760;

/* deterministic jitter, so the hand is uneven but never re-draws itself */
function hand(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return (spread = 1) => {
    s = (s * 9301 + 49297) % 233280;
    return ((s / 233280) - 0.5) * 2 * spread;
  };
}

/* ------------------------------------------------------------- terrain */

/* A range of peaks, hatched on the eastern flank as an engraver would. */
export function Range({ x, y, count = 5, scale = 1, seed = 1 }) {
  const j = hand(seed);
  const peaks = Array.from({ length: count }, (_, i) => {
    const w = (26 + j(6)) * scale;
    const h = (22 + j(9)) * scale;
    const px = x + i * (w * 1.45) + j(5);
    const py = y + j(6);
    return { px, py, w, h };
  });
  return (
    <g>
      {peaks.map(({ px, py, w, h }, i) => (
        <g key={i}>
          <path className="mk-terrain" d={`M ${px - w} ${py} L ${px - w * 0.15} ${py - h} L ${px + w * 0.2} ${py - h * 0.62} L ${px + w} ${py}`} />
          {/* shading strokes down the shadowed flank */}
          {[0.25, 0.45, 0.65, 0.85].map((t) => (
            <line
              key={t}
              className="mk-hatch"
              x1={px - w * 0.15 + t * (w * 1.1)}
              y1={py - h + t * h * 0.9}
              x2={px - w * 0.15 + t * (w * 1.1) - 4}
              y2={py}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

/* A single drawn tree. Woods are made of many of them, never of a shape. */
function Tree({ x, y, s = 1 }) {
  return (
    <g>
      <path className="mk-terrain" d={`M ${x} ${y} L ${x} ${y - 5 * s}`} />
      <path
        className="mk-terrain"
        d={`M ${x - 6 * s} ${y - 5 * s} L ${x} ${y - 17 * s} L ${x + 6 * s} ${y - 5 * s} Z`}
      />
      <path className="mk-hatch" d={`M ${x - 4 * s} ${y - 8 * s} L ${x + 4 * s} ${y - 8 * s}`} />
    </g>
  );
}

export function Wood({ x, y, w, h, n = 9, seed = 3, s = 1 }) {
  const j = hand(seed);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <Tree key={i} x={x + j(w / 2) + (w / n) * (i - n / 2)} y={y + j(h / 2)} s={s * (0.85 + j(0.2))} />
      ))}
    </g>
  );
}

/* Reeds and standing water. */
export function Reeds({ x, y, n = 7, seed = 5 }) {
  const j = hand(seed);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const rx = x + (i - n / 2) * 11 + j(4);
        const ry = y + j(7);
        return (
          <g key={i}>
            <path className="mk-terrain" d={`M ${rx} ${ry} C ${rx + 2} ${ry - 8} ${rx - 2} ${ry - 12} ${rx + 3} ${ry - 17}`} />
            <path className="mk-water" d={`M ${rx - 9} ${ry + 3} q 5 -3 10 0 q 5 3 10 0`} />
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------- place glyphs */

// eslint-disable-next-line react-refresh/only-export-components
export const GLYPH = {
  village: ({ x, y }) => (
    <g>
      {[[-17, 2, 1], [2, 0, 1.18], [20, 4, 0.9]].map(([dx, dy, s], i) => (
        <g key={i}>
          <path className="place-ink" d={`M ${x + dx - 9 * s} ${y + dy} v ${-10 * s} h ${18 * s} v ${10 * s} Z`} />
          <path className="place-ink" d={`M ${x + dx - 12 * s} ${y + dy - 10 * s} L ${x + dx} ${y + dy - 19 * s} L ${x + dx + 12 * s} ${y + dy - 10 * s}`} />
          <path className="place-ink-soft" d={`M ${x + dx - 2} ${y + dy} v ${-5 * s} h 4 v ${5 * s}`} />
        </g>
      ))}
    </g>
  ),
  forest: ({ x, y }) => (
    <g>
      <Wood x={x} y={y + 12} w={86} h={26} n={9} seed={11} s={1.35} />
      <Wood x={x} y={y - 8} w={64} h={18} n={6} seed={17} s={1.15} />
    </g>
  ),
  gate: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 22} ${y} v -26 h 12 v 26`} />
      <path className="place-ink" d={`M ${x + 10} ${y} v -26 h 12 v 26`} />
      <path className="place-ink" d={`M ${x - 10} ${y} v -18 h 20 v 18`} />
      <path className="place-ink" d={`M ${x - 6} ${y} v -9 a 6 6 0 0 1 12 0 v 9`} />
      {[-22, -18, -14, 10, 14, 18].map((dx) => (
        <path key={dx} className="place-ink" d={`M ${x + dx} ${y - 26} v -4 h 4 v 4`} />
      ))}
    </g>
  ),
  ruin: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 20} ${y} v -22 l 3 -4 v 26`} />
      <path className="place-ink" d={`M ${x + 14} ${y} v -16 l 3 -3 v 19`} />
      <path className="place-ink" d={`M ${x - 17} ${y - 26} q 9 -10 18 -2`} />
      <path className="place-ink-soft" d={`M ${x - 6} ${y} l 5 -7 4 7`} />
      <path className="place-ink-soft" d={`M ${x - 24} ${y} h 44`} />
    </g>
  ),
  tower: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 14} ${y} v -42 h 28 v 42 Z`} />
      <path className="place-ink" d={`M ${x - 19} ${y - 42} L ${x} ${y - 62} L ${x + 19} ${y - 42} Z`} />
      <path className="place-ink-soft" d={`M ${x - 4} ${y - 18} h 8 v 18 h -8 Z`} />
      <path className="place-ink-soft" d={`M ${x - 14} ${y - 30} h 28`} />
      <path className="place-ink-soft" d={`M ${x - 6} ${y - 36} h 4 v 5 h -4 Z M ${x + 3} ${y - 36} h 4 v 5 h -4 Z`} />
      <path className="place-ink-soft" d={`M ${x} ${y - 62} v -7 l 11 4 -11 4`} />
    </g>
  ),
  marsh: ({ x, y }) => (
    <g>
      <Reeds x={x} y={y + 8} n={7} seed={23} />
      <path className="mk-water" d={`M ${x - 42} ${y + 16} q 8 -4 16 0 q 8 4 16 0 q 8 -4 16 0 q 8 4 16 0`} />
      <path className="mk-water" d={`M ${x - 34} ${y + 22} q 8 -4 16 0 q 8 4 16 0 q 8 -4 16 0`} />
    </g>
  ),
  bridge: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 26} ${y} q 26 -24 52 0`} />
      <path className="place-ink" d={`M ${x - 26} ${y + 6} q 26 -24 52 0`} />
      <path className="place-ink-soft" d={`M ${x - 12} ${y + 4} v -9 M ${x} ${y + 1} v -11 M ${x + 12} ${y + 4} v -9`} />
      <path className="mk-water" d={`M ${x - 40} ${y + 12} q 10 -5 20 0 q 10 5 20 0 q 10 -5 20 0`} />
    </g>
  ),
  keep: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 30} ${y} v -20 h 60 v 20 Z`} />
      {[-30, -24, -18, -12, -6, 0, 6, 12, 18, 24].map((dx) => (
        <path key={dx} className="place-ink" d={`M ${x + dx} ${y - 20} v -4 h 4 v 4`} />
      ))}
      <path className="place-ink" d={`M ${x - 30} ${y - 24} v -14 h 14 v 14`} />
      <path className="place-ink" d={`M ${x + 16} ${y - 24} v -14 h 14 v 14`} />
      <path className="place-ink" d={`M ${x - 8} ${y - 24} v -22 h 16 v 22`} />
      <path className="place-ink" d={`M ${x - 12} ${y - 46} L ${x} ${y - 58} L ${x + 12} ${y - 46}`} />
      <path className="place-ink-soft" d={`M ${x - 4} ${y} v -10 a 4 4 0 0 1 8 0 v 10`} />
      <path className="place-ink-soft" d={`M ${x + 3} ${y - 58} l 12 4 -12 4`} />
    </g>
  ),
  dungeon: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 30} ${y} q 6 -30 30 -30 q 24 0 30 30 Z`} fill="var(--paper)" />
      <path className="place-ink" d={`M ${x - 13} ${y} v -14 a 13 13 0 0 1 26 0 v 14 Z`} fill="var(--ink-strong)" fillOpacity="0.82" />
      {[-8, -3, 2, 7].map((dx) => (
        <line key={dx} className="place-ink-soft" x1={x + dx} y1={y - 24} x2={x + dx} y2={y} stroke="var(--paper)" />
      ))}
      {[0.3, 0.6, 0.9].map((t) => (
        <path key={t} className="mk-hatch" d={`M ${x - 30 + t * 20} ${y} q 4 -${12 + t * 8} ${10 + t * 6} -${16 + t * 10}`} />
      ))}
    </g>
  ),
  abyss: ({ x, y }) => (
    <g>
      {[34, 26, 18, 10].map((r, i) => (
        <path
          key={r}
          className="mk-water"
          d={`M ${x - r} ${y} a ${r} ${r * 0.42} 0 1 0 ${r * 2} 0 a ${r} ${r * 0.42} 0 1 0 ${-r * 2} 0`}
          opacity={0.8 - i * 0.12}
        />
      ))}
      <path className="place-ink" d={`M ${x - 9} ${y - 3} q 9 8 18 0`} stroke="var(--ink-faint)" />
      <path className="mk-hatch" d={`M ${x - 40} ${y - 14} q 40 -10 80 0`} />
    </g>
  ),
};

/* ------------------------------------------------------------- fittings */

export function CompassRose({ x, y, r = 46 }) {
  return (
    <g>
      <circle className="mk-frame" cx={x} cy={y} r={r} />
      <circle className="mk-hachure" cx={x} cy={y} r={r - 7} />
      {[0, 90, 180, 270].map((a) => (
        <path
          key={a}
          className="place-ink"
          transform={`rotate(${a} ${x} ${y})`}
          d={`M ${x} ${y - r + 2} L ${x + 7} ${y} L ${x} ${y + 7} L ${x - 7} ${y} Z`}
          fill={a === 0 ? "var(--rubric)" : "none"}
        />
      ))}
      {[45, 135, 225, 315].map((a) => (
        <path key={a} className="mk-hachure" transform={`rotate(${a} ${x} ${y})`} d={`M ${x} ${y - r + 12} L ${x + 4} ${y} L ${x - 4} ${y} Z`} />
      ))}
      <text className="map-compass-letter" x={x} y={y - r - 6} textAnchor="middle">N</text>
      <text className="map-compass-letter" x={x} y={y + r + 15} textAnchor="middle">S</text>
      <text className="map-compass-letter" x={x + r + 10} y={y + 5} textAnchor="middle">E</text>
      <text className="map-compass-letter" x={x - r - 10} y={y + 5} textAnchor="middle">O</text>
    </g>
  );
}

function Cartouche() {
  return (
    <g>
      <path className="mk-frame mk-fill-paper" d="M 30 24 h 320 l 14 14 v 64 l -14 14 H 44 L 30 102 Z" />
      <path className="mk-hachure" d="M 37 31 h 306 l 9 9 v 52 l -9 9 H 48 l -11 -9 Z" />
      <text className="map-cartouche-title" x="52" y="58">{REALM.title}</text>
      {REALM.surveyLines.map((line, i) => (
        <text key={line} className="map-cartouche-sub" x="52" y={80 + i * 16}>{line}</text>
      ))}
    </g>
  );
}

export function ScaleBar({ x, y }) {
  return (
    <g>
      <text className="map-scale-text" x={x} y={y - 8}>Leagues of the hunt</text>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={x + i * 34}
          y={y}
          width={34}
          height={7}
          fill={i % 2 ? "var(--ink-strong)" : "var(--paper)"}
          stroke="var(--ink-strong)"
          strokeWidth="0.8"
        />
      ))}
      <text className="map-scale-text" x={x} y={y + 20}>0</text>
      <text className="map-scale-text" x={x + 136} y={y + 20} textAnchor="end">XII</text>
    </g>
  );
}

/* A sea beast, because the engraver had room left over. */
export function Serpent({ x, y }) {
  return (
    <g opacity="0.7">
      <path className="mk-water" d={`M ${x - 46} ${y} q 12 -16 24 0 q 12 16 24 0 q 12 -16 24 0`} />
      <path className="mk-water" d={`M ${x + 26} ${y - 4} q 8 -12 18 -6 q -6 4 -4 12 q -8 2 -14 -6 Z`} />
      <circle cx={x + 36} cy={y - 7} r="1.2" fill="var(--indigo)" />
    </g>
  );
}

/* ---------------------------------------------------------------- roads */

// eslint-disable-next-line react-refresh/only-export-components
export function roadPath(a, b, kind, seed) {
  const j = hand(seed);
  const mx = (a.x + b.x) / 2 + j(28);
  const my = (a.y + b.y) / 2 + j(28);
  const q1x = (a.x + mx) / 2 + j(16);
  const q1y = (a.y + my) / 2 + j(16);
  const q2x = (b.x + mx) / 2 + j(16);
  const q2y = (b.y + my) / 2 + j(16);
  return `M ${a.x} ${a.y} Q ${q1x} ${q1y} ${mx} ${my} Q ${q2x} ${q2y} ${b.x} ${b.y}`;
}

/* --------------------------------------------------------------- labels */

function PlaceLabel({ p }) {
  const off = { above: -46, below: 30, left: 0, right: 0 };
  let x = p.x + (p.labelDx || 0);
  let y = p.y + (off[p.label] ?? 30);
  let anchor = "middle";
  if (p.label === "left") { x = p.x - 34; y = p.y - 4; anchor = "end"; }
  if (p.label === "right") { x = p.x + 34; y = p.y - 4; anchor = "start"; }
  return (
    <>
      <text className="place-name" x={x} y={y} textAnchor={anchor}>{p.name}</text>
      {p.state !== "unknown" && (
        <text className="place-gloss" x={x} y={y + 19} textAnchor={anchor}>{p.domain}</text>
      )}
      {p.state === "charted" && (
        <path className="place-tick" d={`M ${anchor === "end" ? x + 8 : x - 8} ${y - 11} l 4 5 7 -11`} />
      )}
    </>
  );
}

/* ------------------------------------------------------------ the sheet */

/* `places` carry the state derived from the hunter's progress (see
   data/progress.js); `questsByPlace` are the quests the register has written
   at each place. Both default to the bare survey for callers without them. */
export default function WorldMap({ initial = null, places = PLACES, questsByPlace = {} }) {
  const [chosenId, setChosenId] = useState(initial);
  const chosen = chosenId ? places.find((p) => p.id === chosenId) : null;

  const byId = useMemo(() => Object.fromEntries(places.map((p) => [p.id, p])), [places]);

  return (
    <div className="survey-layout">
      <div className="survey">
        <div className="survey-sheet">
          <svg viewBox={`0 0 ${W} ${H}`} className="survey-svg" role="img" aria-label={`Survey of ${REALM.title}`}>
            {/* ---- the sea, east and south-east, with hachured coast ---- */}
            <path className="mk-coast" d="M 1000 120 C 962 250 922 368 908 512 C 896 620 852 676 800 760" />
            {[8, 17, 27, 38].map((d, i) => (
              <path
                key={d}
                className="mk-hachure"
                d={`M ${1000 + d} ${120 + d * 0.4} C ${962 + d} ${250 + d * 0.3} ${922 + d} ${368 + d * 0.2} ${908 + d} ${512} C ${896 + d} ${620} ${852 + d} ${676} ${800 + d} ${760}`}
                opacity={0.8 - i * 0.15}
              />
            ))}
            <text className="map-sea-name" x="0" y="0" transform="translate(945 520) rotate(80)" textAnchor="middle">
              The Sundering Sea
            </text>
            <text className="map-warning" x="0" y="0" transform="translate(946 185) rotate(72)" textAnchor="middle">
              Hic sunt dracones
            </text>
            <Serpent x={905} y={735} />

            {/* ---- ranges ---- */}
            <Range x={70} y={152} count={5} scale={1.1} seed={2} />
            <Range x={228} y={128} count={3} scale={0.9} seed={7} />
            <Range x={600} y={104} count={5} scale={1} seed={13} />
            <Range x={790} y={148} count={3} scale={0.85} seed={19} />

            {/* ---- rivers, running from the ranges to the sea ---- */}
            <path className="mk-water" d="M 208 170 C 246 262 302 300 352 402 S 486 566 604 654 C 690 700 748 726 806 748" />
            <path className="mk-water" d="M 700 135 C 732 192 792 216 850 242 S 930 266 968 284" />
            <path className="mk-water" d="M 356 404 C 392 430 424 452 436 494" opacity="0.5" />

            {/* ---- wild woods that are not learning places ---- */}
            <Wood x={112} y={300} w={70} h={26} n={6} seed={29} s={0.9} />
            <Wood x={560} y={612} w={96} h={30} n={8} seed={31} s={1} />
            <Wood x={706} y={646} w={70} h={24} n={5} seed={37} s={0.85} />
            <Wood x={470} y={392} w={80} h={22} n={6} seed={41} s={0.8} />

            {/* ---- roads: drawn under the settlements ---- */}
            {ROADS.map((r, i) => {
              const a = byId[r.from];
              const b = byId[r.to];
              if (!a || !b) return null;
              const walked = a.state === "charted" && (b.state === "charted" || b.state === "current");
              return (
                <path
                  key={`${r.from}-${r.to}`}
                  className={`mk-road mk-road--${r.kind} ${walked ? "mk-road--walked" : ""}`}
                  d={roadPath(a, b, r.kind, i * 13 + 3)}
                />
              );
            })}

            {/* ---- the settlements themselves ---- */}
            {places.map((p) => {
              const Glyph = GLYPH[p.kind] || GLYPH.village;
              return (
                <g
                  key={p.id}
                  className={`place place--${p.state} ${chosenId === p.id ? "is-chosen" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.name} — ${p.domain}`}
                  onClick={() => setChosenId(p.id === chosenId ? null : p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setChosenId(p.id === chosenId ? null : p.id);
                    }
                  }}
                >
                  {/* a generous invisible target, so a place is clicked, not aimed at */}
                  <circle className="place-halo" cx={p.x} cy={p.y - 12} r="52" />
                  <Glyph x={p.x} y={p.y} />
                  {p.state === "current" && (
                    <path
                      className="place-here"
                      d={`M ${p.x - 44} ${p.y - 10} c -4 -30 22 -44 46 -42 c 26 2 44 18 40 40 c -4 22 -26 34 -48 32 c -20 -2 -34 -12 -38 -30 c -2 -8 0 -14 4 -20`}
                    />
                  )}
                  {p.state === "sealed" && (
                    <>
                      <path className="place-ink-soft" d={`M ${p.x - 14} ${p.y + 8} h 28`} stroke="var(--rubric)" />
                      <path className="place-ink-soft" d={`M ${p.x - 10} ${p.y + 4} v 8 M ${p.x} ${p.y + 4} v 8 M ${p.x + 10} ${p.y + 4} v 8`} stroke="var(--rubric)" />
                    </>
                  )}
                  <PlaceLabel p={p} />
                </g>
              );
            })}

            {/* ---- annotations in a later hand ---- */}
            <text className="map-hand" x="120" y="576" transform="rotate(-4 120 576)">
              start here — the road is safe
            </text>
            <text className="map-hand" x="452" y="268" transform="rotate(3 452 268)">
              two hunters lost, 2024
            </text>
            <text className="map-hand" x="612" y="424" transform="rotate(-2 612 424)">
              messenger runs any errand?
            </text>

            {/* ---- fittings ---- */}
            <Cartouche />
            <CompassRose x={96} y={664} r={44} />
            <ScaleBar x={330} y={708} />
            <path className="mk-frame" d={`M 6 6 h ${W - 12} v ${H - 12} H 6 Z`} />
            <path className="mk-hachure" d={`M 13 13 h ${W - 26} v ${H - 26} H 13 Z`} />
          </svg>
        </div>
        <p className="survey-hint">drag the sheet to read the far corners</p>
      </div>

      {/* ------------------------------------------- the reading, in the margin */}
      <aside>
        {chosen ? <PlaceReading p={chosen} quests={questsByPlace[chosen.id] || []} onClose={() => setChosenId(null)} /> : <SurveyLegend />}
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------- readings */

function PlaceReading({ p, quests, onClose }) {
  const dungeons = dungeonsAtPlace(p.id);
  const sealed = p.state === "sealed";
  const offSurvey = p.state === "unknown";
  const barred = sealed || offSurvey;

  return (
    <div className="leaf leaf--lit quire" style={{ padding: "1.8rem 1.9rem" }}>
      <div className="flex items-start justify-between gap-3">
        <p className="t-caps">{STATE_NOTE[p.state]}</p>
        <button type="button" onClick={onClose} className="t-caps" style={{ color: "var(--ink-faint)" }}>
          Close
        </button>
      </div>

      <h3 className="t-entry mt-3">{p.name}</h3>
      <p className="t-hand mt-1.5">{p.domain}</p>

      <hr className="rule rule--tight" />

      <p className="t-small">{p.gloss}</p>

      {p.teaches?.[0] !== "—" && (
        <>
          <p className="t-caps mt-6 label-gap">Taught on this ground</p>
          <div className="flex flex-col">
            {p.teaches.map((t) => (
              <Leaderish key={t} label={t} />
            ))}
          </div>
        </>
      )}

      <hr className="rule rule--tight" />

      <div className="flex flex-wrap gap-2 items-center">
        <Stamp tone={barred || !quests.length ? "faint" : ""}>
          {quests.length ? `${quests.length} ${quests.length === 1 ? "quest" : "quests"} written` : "No quest written yet"}
        </Stamp>
        {dungeons.map((d) => (
          <Stamp key={d.slug} tone="faint">Dungeon being dug</Stamp>
        ))}
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <Link to={`/kingdoms/web/${p.id}`} className="ink-btn ink-btn--filled">Open the chapter</Link>
      </div>
    </div>
  );
}

function Leaderish({ label }) {
  return (
    <div className="leader">
      <span>{label}</span>
      <span className="leader-fill" />
    </div>
  );
}

function SurveyLegend() {
  const marks = [
    ["Walked and written up", "charted"],
    ["Where you stand", "current"],
    ["Heard of, not walked", "rumoured"],
    ["Off the survey", "unknown"],
  ];
  return (
    <div className="leaf leaf--aged" style={{ padding: "1.8rem 1.9rem" }}>
      <p className="t-caps">Reading the sheet</p>
      <h3 className="t-entry mt-2">Marks &amp; conventions</h3>
      <Fleuron width={120} className="mt-3" />
      <p className="mt-5 t-small">{REALM.legend}</p>

      <hr className="rule rule--tight" />

      <dl className="flex flex-col gap-3">
        {marks.map(([label, key], i) => (
          <div key={key} className="flex items-baseline gap-2">
            <dt className="t-caps" style={{ minWidth: "1.6rem", color: "var(--ink-faint)" }}>{roman(i + 1)}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>

      <hr className="rule rule--tight" />

      <p className="margin-note">
        Touch any place on the sheet and I will read you what is written of it.
      </p>
      <div className="flex justify-center mt-4" style={{ color: "var(--ink-faint)" }}>
        <Mark name="quill" size={30} />
      </div>
    </div>
  );
}
