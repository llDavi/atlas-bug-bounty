import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { kingdomMap } from "../../data/kingdomMaps";
import { kingdomById } from "../../data/realm";
import { roman } from "../../utils/numerals";
import { Stamp, Fleuron, Mark } from "./Codex";
import { GLYPH, roadPath, Range, Wood, Reeds, CompassRose, ScaleBar, Serpent } from "./WorldMap";
import "./world-map.css";

/* ==========================================================================
   A KINGDOM, SURVEYED LIKE THE WEB REALM
   ==========================================================================
   Renders a hand-drawn kingdom map from its definition in data/kingdomMaps:
   an organic coast, ranges, woods, rivers, and every chapter placed on
   ground that suits it, joined by wandering roads. Each place is one chapter;
   touch it to read what it teaches and, once written, to open its quest.
   ========================================================================== */

const W = 1000;
const H = 720;

/* Themed glyphs, in the ink of the survey, added to the Web Realm's set. */
const EXTRA = {
  market: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 26} ${y} v -20 h 52 v 20 Z`} style={{ fill: "var(--survey-bg)" }} />
      <path className="place-ink" d={`M ${x - 30} ${y - 20} l 6 -12 h 48 l 6 12 Z`} />
      <path className="place-ink-soft" d={`M ${x - 18} ${y} v -14 h 12 v 14 M ${x + 6} ${y} v -14 h 12 v 14`} />
      <path className="place-ink-soft" d={`M ${x - 24} ${y - 20} h 48`} />
    </g>
  ),
  toll: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 20} ${y} v -28 M ${x + 20} ${y} v -28`} />
      <path className="place-ink" d={`M ${x - 25} ${y - 28} h 50 v -7 h -50 Z`} />
      <path className="place-ink-soft" d={`M ${x - 20} ${y - 15} h 40`} />
      <path className="place-ink-soft" d={`M ${x - 6} ${y} v -13 h 12 v 13`} />
    </g>
  ),
  crossroads: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x} ${y} v -34`} />
      <path className="place-ink" d={`M ${x} ${y - 34} h 16 l -4 5 h -12`} />
      <path className="place-ink" d={`M ${x} ${y - 24} h -16 l 4 5 h 12`} />
      <path className="place-ink-soft" d={`M ${x - 22} ${y} l 22 -12 22 12`} />
      <path className="place-ink-soft" d={`M ${x - 22} ${y + 6} l 22 -12 22 12`} />
    </g>
  ),
  harbour: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 22} ${y} q 22 -12 44 0`} />
      <path className="place-ink" d={`M ${x} ${y - 8} v -30 M ${x} ${y - 30} l 16 6 -16 5`} />
      <path className="mk-water" d={`M ${x - 30} ${y + 8} q 8 -4 15 0 q 7 4 15 0 q 8 -4 15 0`} style={{ fill: "none" }} />
    </g>
  ),
  lighthouse: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 9} ${y} L ${x - 5} ${y - 36} h 10 L ${x + 9} ${y} Z`} />
      <path className="place-ink" d={`M ${x - 6} ${y - 36} h 12 v -7 h -12 Z`} />
      <path className="place-ink-soft" d={`M ${x - 7} ${y - 14} h 14 M ${x - 8} ${y - 26} h 16`} />
      <path className="place-ink-soft" d={`M ${x - 10} ${y - 43} l -12 -3 M ${x + 10} ${y - 43} l 12 -3`} />
    </g>
  ),
  vault: ({ x, y }) => (
    <g>
      <path className="place-ink" d={`M ${x - 24} ${y} v -24 h 48 v 24 Z`} style={{ fill: "var(--survey-bg)" }} />
      <path className="place-ink" d={`M ${x - 28} ${y - 24} h 56 l -6 -8 h -44 Z`} />
      <circle className="place-ink" cx={x} cy={y - 13} r="5" />
      <path className="place-ink" d={`M ${x - 2} ${y - 9} l -3 8 h 10 l -3 -8`} />
    </g>
  ),
};

function glyphFor(kind) {
  return GLYPH[kind] || EXTRA[kind] || GLYPH.village;
}

/* Long chapter names are broken over two lines so they never crowd a
   neighbour — the Web Realm's own places have short names and need no wrap. */
function wrapName(name) {
  if (name.length <= 17) return [name];
  const mid = name.length / 2;
  let best = -1;
  for (let i = 0; i < name.length; i++) {
    if (name[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  if (best < 0) return [name];
  return [name.slice(0, best), name.slice(best + 1)];
}

/* label placement, matching the Web Realm survey */
function labelPos(p) {
  const off = { above: -46, below: 30 };
  let x = p.x + (p.labelDx || 0);
  let y = p.y + (off[p.label] ?? 30);
  let anchor = "middle";
  if (p.label === "left") { x = p.x - 34; y = p.y - 4; anchor = "end"; }
  if (p.label === "right") { x = p.x + 34; y = p.y - 4; anchor = "start"; }
  return { x, y, anchor };
}

export default function RealmMap({ kingdomId, quests = [] }) {
  const k = kingdomById(kingdomId);
  const def = kingdomMap(kingdomId);
  const [chosen, setChosen] = useState(null);

  const byIndex = useMemo(() => def?.places || [], [def]);
  const chapter = chosen == null ? null : byIndex[chosen];
  const chapterQuest = chapter?.place
    ? quests.find((q) => q.place === chapter.place && q.kingdom === kingdomId)
    : null;

  if (!def) return null;

  return (
    <div className="survey-layout">
      <div className="survey">
        <div className="survey-sheet">
          <svg viewBox={`0 0 ${W} ${H}`} className="survey-svg" role="img" aria-label={`Survey of ${def.title}`}>
            {/* ---- an island landmass, ringed by water-lines ---- */}
            {def.land && <path className="realm-land" d={def.land} />}
            {def.waterRings && [10, 20, 30].map((d, i) => (
              <path
                key={d}
                className="mk-water"
                d={def.waterRings.d}
                transform={`translate(${def.waterRings.cx} ${def.waterRings.cy}) scale(${1 + (i + 1) * 0.02}) translate(${-def.waterRings.cx} ${-def.waterRings.cy})`}
                opacity={0.4 - i * 0.11}
                style={{ fill: "none" }}
              />
            ))}

            {/* ---- the sea, along the coast, hachured ---- */}
            {def.coast && (
              <>
                <path className="mk-coast" d={def.coast} />
                {[8, 17, 27].map((d, i) => (
                  <path key={d} className="mk-hachure" d={def.coast} transform={`translate(${d} ${d * 0.3})`} opacity={0.7 - i * 0.18} style={{ fill: "none" }} />
                ))}
              </>
            )}
            {(def.seas || []).map(([x, y]) => (
              <path key={`${x}-${y}`} className="mk-water" d={`M ${x - 20} ${y} q 5 -4 11 0 q 6 4 11 0 q 5 -4 11 0`} style={{ fill: "none" }} />
            ))}
            {def.seaName && (
              <text className="map-sea-name" x="0" y="0" transform={`translate(${def.seaName.x} ${def.seaName.y}) rotate(${def.seaName.rot})`} textAnchor="middle">
                {def.seaName.text}
              </text>
            )}

            {/* ---- ranges, rivers, woods ---- */}
            {(def.ranges || []).map((r, i) => <Range key={`r${i}`} {...r} />)}
            {(def.rivers || []).map((d, i) => (
              <path key={`w${i}`} className="mk-water" d={d} opacity={i ? 0.5 : 0.75} style={{ fill: "none" }} />
            ))}
            {(def.woods || []).map((w, i) => <Wood key={`f${i}`} {...w} />)}
            {(def.reeds || []).map((r, i) => <Reeds key={`e${i}`} {...r} />)}

            {/* ---- roads, drawn under the settlements ---- */}
            {(def.roads || []).map(([a, b, kind], i) => (
              <path key={`${a}-${b}`} className={`mk-road mk-road--${kind}`} d={roadPath(def.places[a], def.places[b], kind, i * 13 + 5)} />
            ))}

            {/* ---- unnamed hamlets ---- */}
            {(def.hamlets || []).map(([x, y]) => (
              <g key={`${x}-${y}`} opacity="0.8">
                <path className="place-ink-soft" d={`M ${x - 6} ${y} v -6 h 12 v 6 Z`} />
                <path className="place-ink-soft" d={`M ${x - 8} ${y - 6} l 8 -6 8 6`} />
              </g>
            ))}

            {/* ---- the places: one per chapter ---- */}
            {def.places.map((p, i) => {
              const Glyph = glyphFor(p.kind);
              const written = p.place && quests.some((q) => q.place === p.place && q.kingdom === kingdomId);
              const lp = labelPos(p);
              const lines = wrapName(p.name);
              const firstY = lp.anchor === "middle" && lp.y < p.y ? lp.y - (lines.length - 1) * 16 : lp.y;
              const lastY = firstY + (lines.length - 1) * 16;
              return (
                <g
                  key={p.name}
                  className={`place place--drawn ${chosen === i ? "is-chosen" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Chapter ${i + 1}: ${p.name}`}
                  onClick={() => setChosen((c) => (c === i ? null : i))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setChosen((c) => (c === i ? null : i));
                    }
                  }}
                >
                  <circle className="place-halo" cx={p.x} cy={p.y - 12} r="50" />
                  <Glyph x={p.x} y={p.y} />
                  <text className="place-index" x={lp.x} y={firstY - 15} textAnchor={lp.anchor}>{roman(i + 1)}</text>
                  {lines.map((line, li) => (
                    <text key={line} className="place-name" x={lp.x} y={firstY + li * 16} textAnchor={lp.anchor}>{line}</text>
                  ))}
                  <text className="place-gloss" x={lp.x} y={lastY + 18} textAnchor={lp.anchor}>{p.domain}</text>
                  {!written && (
                    <text className="place-gloss place-gloss--faint" x={lp.x} y={lastY + 34} textAnchor={lp.anchor}>being written</text>
                  )}
                </g>
              );
            })}

            {/* ---- annotations in a later hand ---- */}
            {(def.annotations || []).map((a) => (
              <text key={a.text} className="map-hand" x={a.x} y={a.y} transform={`rotate(${a.rot} ${a.x} ${a.y})`} textAnchor="middle">{a.text}</text>
            ))}

            {/* ---- fittings ---- */}
            {def.compass && <CompassRose x={def.compass.x} y={def.compass.y} r={def.compass.r} />}
            {def.scale && <ScaleBar x={def.scale.x} y={def.scale.y} />}
            {def.serpent && <Serpent x={def.serpent.x} y={def.serpent.y} />}
            <g>
              <path className="mk-frame mk-fill-paper" d="M 30 26 h 300 l 14 14 v 58 l -14 14 H 44 L 30 98 Z" />
              <path className="mk-hachure" d="M 37 33 h 286 l 9 9 v 46 l -9 9 H 48 l -11 -9 Z" />
              <text className="map-cartouche-title" x="52" y="60" style={{ fontSize: 20 }}>{def.title}</text>
              {(def.sub || []).map((line, i) => (
                <text key={line} className="map-cartouche-sub" x="52" y={80 + i * 15}>{line}</text>
              ))}
            </g>
            <path className="mk-frame" d={`M 6 6 h ${W - 12} v ${H - 12} H 6 Z`} />
            <path className="mk-hachure" d={`M 13 13 h ${W - 26} v ${H - 26} H 13 Z`} />
          </svg>
        </div>
        <p className="survey-hint">drag the sheet to read the far corners</p>
      </div>

      <aside>
        {chapter ? (
          <div className="leaf leaf--lit quire" style={{ padding: "1.8rem 1.9rem" }}>
            <div className="flex items-start justify-between gap-3">
              <p className="t-caps">Chapter {roman(chosen + 1)}</p>
              <button type="button" onClick={() => setChosen(null)} className="t-caps" style={{ color: "var(--ink-faint)" }}>Close</button>
            </div>
            <h3 className="t-entry mt-3">{chapter.name}</h3>
            <p className="t-hand mt-1.5">{chapter.domain}</p>
            <hr className="rule rule--tight" />
            <div className="flex flex-wrap gap-2">
              <Stamp tone={chapterQuest ? "" : "faint"}>{chapterQuest ? "Quest written" : "Being written"}</Stamp>
            </div>
            {chapterQuest ? (
              <Link to={`/quests/${chapterQuest.slug}`} className="ink-btn ink-btn--filled w-full mt-6">Read the quest</Link>
            ) : (
              <p className="t-small mt-5">Its quest is still being copied into the journal. The chapter is named and its place is drawn.</p>
            )}
          </div>
        ) : (
          <div className="leaf leaf--aged" style={{ padding: "1.8rem 1.9rem" }}>
            <p className="t-caps">Reading the sheet</p>
            <h3 className="t-entry mt-2">{def.title}</h3>
            <Fleuron width={120} className="mt-3" />
            <p className="mt-5 t-small">
              Every place on this sheet is one chapter of the kingdom, set on the ground that suits
              it and joined by the roads a hunter walks. Touch a place to read what it teaches.
            </p>
            <hr className="rule rule--tight" />
            <p className="margin-note">The ground is drawn; the quests are still being written.</p>
            <div className="flex justify-center mt-4" style={{ color: "var(--ink-faint)" }}>
              <Mark name={k?.mark || "quill"} size={30} />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
