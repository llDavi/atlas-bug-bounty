import { Link } from "react-router-dom";
import { PageHead, RuleHead, Stamp, Stars, Fleuron } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { DUNGEONS, CHAMBER_ORDER } from "../data/dungeons";
import { placeById } from "../data/world";

/* ==========================================================================
   THE DUNGEONS — the practical work, drawn as ground you go down into
   ========================================================================== */

/* A section through the ground: entrance, then chambers going down.
   Drawn as a surveyor would sketch it in the margin of a report. */
export function DungeonSection({ chambers, depth = 5, width = 560, current = 0 }) {
  const H = 236;
  const stepX = width / (chambers.length + 1);
  const nodes = chambers.map((c, i) => ({
    ...c,
    x: stepX * (i + 1),
    y: 54 + (i + 1) * ((H - 80) / (chambers.length + 0.4)),
  }));

  return (
    <svg viewBox={`0 0 ${width} ${H}`} width="100%" style={{ display: "block" }} role="img" aria-label="Section through the dungeon">
      {/* ground line and the earth above it, hatched */}
      <path d="M 0 40 H 560" stroke="var(--ink-strong)" strokeWidth="1.6" fill="none" />
      {Array.from({ length: 46 }, (_, i) => (
        <line key={i} x1={i * 12.5} y1={40} x2={i * 12.5 - 7} y2={26} stroke="var(--ink-faint)" strokeWidth="0.6" />
      ))}
      {/* the mouth */}
      <path d={`M ${stepX * 0.35 - 16} 40 v -16 h 32 v 16`} stroke="var(--ink-strong)" strokeWidth="1.3" fill="none" />
      <path d={`M ${stepX * 0.35 - 10} 40 v -9 a 10 10 0 0 1 20 0 v 9`} stroke="var(--ink-soft)" strokeWidth="1" fill="none" />
      <text x={stepX * 0.35} y={18} textAnchor="middle" className="map-scale-text">Mouth</text>

      {/* passages */}
      <path
        d={`M ${stepX * 0.35} 40 ${nodes.map((n) => `L ${n.x} ${n.y}`).join(" ")}`}
        stroke="var(--ink-soft)"
        strokeWidth="1.1"
        strokeDasharray="6 4"
        fill="none"
      />

      {/* chambers */}
      {nodes.map((n, i) => {
        const done = n.done;
        const isCurrent = i === current;
        return (
          <g key={n.no}>
            <rect
              x={n.x - 26}
              y={n.y - 15}
              width={52}
              height={30}
              fill="var(--paper-lit)"
              stroke={done ? "var(--verdigris)" : "var(--ink-strong)"}
              strokeWidth={isCurrent ? 1.8 : 1.2}
            />
            <text
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              style={{
                fontFamily: "var(--face-roman)",
                fontSize: 13,
                fill: done ? "var(--verdigris)" : "var(--ink-strong)",
              }}
            >
              {roman(n.no)}
            </text>
            {isCurrent && (
              <path
                d={`M ${n.x - 36} ${n.y} c 0 -18 16 -25 36 -24 c 20 1 34 9 33 22 c -1 14 -18 22 -36 21 c -16 -1 -28 -7 -32 -17`}
                fill="none"
                stroke="var(--rubric)"
                strokeWidth="1.4"
              />
            )}
            <text
              x={n.x}
              y={n.y + 32}
              textAnchor="middle"
              className="map-scale-text"
              style={{ fill: done ? "var(--verdigris)" : "var(--ink-soft)" }}
            >
              {CHAMBER_ORDER[i]?.name}
            </text>
          </g>
        );
      })}

      <text x={width - 6} y={16} textAnchor="end" className="map-scale-text">
        Depth {roman(depth)} · not to scale
      </text>
    </svg>
  );
}

/* The same ground at thumbnail size. A section drawn for the margin has to
   drop its lettering or it becomes illegible: numerals only, ticked where a
   chamber has been struck through. */
export function DungeonPlanMini({ chambers, current = 0 }) {
  const W = 236;
  const H = 152;
  const stepY = (H - 46) / chambers.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} role="img" aria-label="Plan of the descent">
      <path d={`M 0 22 H ${W}`} stroke="var(--ink-strong)" strokeWidth="1.4" fill="none" />
      {Array.from({ length: 20 }, (_, i) => (
        <line key={i} x1={i * 12} y1={22} x2={i * 12 - 6} y2={12} stroke="var(--ink-faint)" strokeWidth="0.6" />
      ))}
      <path d="M 20 22 v -10 h 18 v 10" stroke="var(--ink-strong)" strokeWidth="1.1" fill="none" />
      {chambers.map((c, i) => {
        const x = 34 + i * ((W - 74) / (chambers.length - 1 || 1));
        const y = 40 + (i + 0.5) * stepY;
        const done = c.done;
        const here = i === current;
        return (
          <g key={c.no}>
            {i === 0 ? (
              <path d={`M 29 22 L ${x} ${y - 11}`} stroke="var(--ink-soft)" strokeWidth="1" strokeDasharray="4 3" fill="none" />
            ) : (
              <path
                d={`M ${34 + (i - 1) * ((W - 74) / (chambers.length - 1 || 1))} ${40 + (i - 0.5) * stepY} L ${x} ${y - 11}`}
                stroke="var(--ink-soft)"
                strokeWidth="1"
                strokeDasharray="4 3"
                fill="none"
              />
            )}
            <rect
              x={x - 15}
              y={y - 11}
              width={30}
              height={22}
              fill="var(--paper)"
              stroke={done ? "var(--verdigris)" : here ? "var(--rubric)" : "var(--ink-strong)"}
              strokeWidth={here ? 1.6 : 1.1}
            />
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              style={{
                fontFamily: "var(--face-roman)",
                fontSize: 12,
                fill: done ? "var(--verdigris)" : here ? "var(--rubric)" : "var(--ink-strong)",
              }}
            >
              {roman(c.no)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* A figure on the page: its label stands clear above it. */
function Figure({ label, children }) {
  return (
    <div>
      <span className="t-caps label-gap">{label}</span>
      {children}
    </div>
  );
}

export default function DungeonsPage() {
  return (
    <>
      <PageHead
        folio={3}
        standing="The third folio"
        title="The Dungeons"
        gloss="Reading about a gate has never opened one. The dungeons are where the work is done by hand — five chambers apiece, always the same five, because the work is always the same five."
        hand="still being dug — the first opens with the next edition of the codex"
      />

      <RuleHead no={1}>The five chambers of any descent</RuleHead>
      <ol className="flex flex-col">
        {CHAMBER_ORDER.map((c) => (
          <li key={c.no} className="flex flex-wrap gap-x-6 gap-y-1 items-baseline py-4" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
            <span className="t-roman" style={{ minWidth: "2.6rem", fontSize: "0.85rem" }}>{roman(c.no)}</span>
            <span className="t-entry" style={{ minWidth: "12rem" }}>{c.name}</span>
            <span className="t-small flex-1" style={{ minWidth: "16rem" }}>{c.gloss}</span>
          </li>
        ))}
      </ol>

      <RuleHead no={2}>Six ways under the realm</RuleHead>
      <div className="flex flex-col">
        {DUNGEONS.map((d) => {
          const place = placeById(d.place);
          return (
            <article key={d.slug} className="entry">
              <div className="spread">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                    <p className="t-eyebrow">{d.order}</p>
                    {place && <span className="t-hand">at {place.name}</span>}
                    <Stamp tone="faint">Still being dug</Stamp>
                  </div>

                  <h2 className="t-chapter mt-3">{d.name}</h2>
                  <p className="t-caps mt-2">{d.kind}</p>
                  <p className="t-body column mt-5">{d.gloss}</p>

                  <div className="flex flex-wrap items-start gap-x-12 gap-y-5 mt-7">
                    <Figure label="Difficulty">
                      <Stars value={d.difficulty} />
                    </Figure>
                    <Figure label="Reward on the report">
                      <span className="t-figure">{d.reward} XP</span>
                    </Figure>
                    <Figure label="Reckoned at">
                      <span className="t-body">{d.hours}</span>
                    </Figure>
                  </div>

                  <div className="mt-8">
                    <Link to={`/dungeons/${d.slug}`} className="ink-btn">Read the plan</Link>
                  </div>
                </div>

                <aside>
                  <div className="slip">
                    <span className="t-caps label-gap">Plan of the descent</span>
                    <DungeonPlanMini chambers={d.chambers} current={-1} />
                    <p className="t-caps mt-3 t-faint">
                      Depth {roman(d.depth)} · {roman(d.chambers.length)} chambers
                    </p>
                  </div>
                </aside>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col items-center mt-16">
        <Fleuron width={160} />
        <p className="t-caps mt-4">Six ways under the realm, all still being dug</p>
      </div>
    </>
  );
}
