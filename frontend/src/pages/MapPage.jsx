import { Link } from "react-router-dom";
import WorldMap from "../components/ms/WorldMap";
import { Fleuron, RuleHead, Stamp, Stars, Measure, Mark, Seal } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { PLACES, STATE_NOTE } from "../data/world";
import { QUESTS, HUNTER, rankOf, DIFFICULTY_WORD } from "../data/journal";
import { DUNGEONS } from "../data/dungeons";

/* ==========================================================================
   THE FIRST FOLIO — the desk
   ==========================================================================
   Five descending tiers, each announced by the surface it sits on:

     the opening   an aged band across the head of the folio
     § I  survey   the pinned sheet
     § II quest    the one .leaf--chapter on the page, ribboned in rubric
     § III index   a ruled register, the ground you stand on marked
     § IV dungeons plain entries, ruled off
     § V  oath     a quiet aged leaf, sealed

   Spacing follows one rule: a label stands clear of what it introduces
   (.label-gap), a group stands clear of the next group, and no line of
   prose runs past the measure (.column / .column-wide, set in characters).
   ========================================================================== */

function Figure({ label, children }) {
  return (
    <div>
      <span className="t-caps label-gap">{label}</span>
      {children}
    </div>
  );
}

function Standing() {
  const { level, rank, next, pct } = rankOf(HUNTER.xp);
  const where = PLACES.find((p) => p.id === HUNTER.whereabouts);

  return (
    <div className="slip slip--marked flex flex-col gap-6">
      <div>
        <p className="t-eyebrow label-gap">Kept by</p>
        <p className="t-entry">{HUNTER.shortName}</p>
        <p className="t-hand mt-1">{HUNTER.title}</p>
      </div>

      <div className="flex items-end justify-between gap-4">
        <Figure label="Level">
          <span className="t-chapter" style={{ fontSize: "2rem" }}>{roman(level)}</span>
        </Figure>
        <div className="text-right">
          <span className="t-caps label-gap">Rank</span>
          <span className="t-minor">{rank.title}</span>
        </div>
      </div>

      <div>
        <Measure pct={pct} cells={14} rubric />
        <p className="t-tech t-faint mt-2.5">
          {HUNTER.xp.toLocaleString("en-US")} / {(next?.xpReq ?? HUNTER.xp).toLocaleString("en-US")} XP
        </p>
        <p className="t-caps mt-1">
          {next ? `${(next.xpReq - HUNTER.xp).toLocaleString("en-US")} to ${next.title}` : "The road ends here"}
        </p>
      </div>

      <div>
        <span className="t-caps label-gap">Whereabouts</span>
        <p className="t-minor t-rubric">{where?.name}</p>
        <p className="margin-note mt-3">the gate keeper still hasn&rsquo;t looked up</p>
      </div>

      <Link to="/character" className="ink-btn ink-btn--small w-full">
        The character sheet
      </Link>
    </div>
  );
}

function Opening() {
  return (
    <section
      className="leaf leaf--aged"
      style={{ borderWidth: "0 0 3px", borderBottomColor: "var(--rule-strong)" }}
    >
      <div className="px-5 sm:px-10" style={{ paddingBlock: "3.4rem" }}>
        <div className="spread">
          <div>
            <p className="t-eyebrow">Being the first folio of</p>
            <h1 className="t-folio mt-3 mb-5" style={{ maxWidth: "20ch" }}>
              The Hunter&rsquo;s Codex
            </h1>
            <Fleuron width={200} />

            <p className="dropcap t-lead mt-8 column">
              Herein is set down the whole survey of the Web Realm, as walked by the hunters of
              this guild and corrected after each account: the roads that are safe, the gates that
              no longer ask who is knocking, and the ground from which nobody has yet returned
              with a report worth reading.
            </p>

            <div className="prose-flow mt-6 column">
              <p className="t-body t-soft">
                Learn the realm and you will not need to be told where the flaw is — you will
                already know which houses keep their records in the open.
              </p>
              <p className="t-body t-soft">
                Nothing in this book was invented for effect. Every account began as a disclosed
                report, and every ward at the foot of a page is the repair its keeper actually made.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-10">
              <Link to="/quests" className="ink-btn ink-btn--filled">Take up a quest</Link>
              <Link to="/dungeons" className="ink-btn">Go down a dungeon</Link>
            </div>
            <p className="t-caps mt-5">or touch any place on the sheet below</p>
          </div>

          <aside>
            <Standing />
          </aside>
        </div>
      </div>
    </section>
  );
}

function Survey() {
  return (
    <section>
      <RuleHead no={1}>The survey, spread on the desk</RuleHead>
      <WorldMap />
    </section>
  );
}

function QuestInHand() {
  const q = QUESTS.find((x) => x.state === "in-progress") || QUESTS.find((x) => x.state === "available");
  if (!q) return null;
  const place = PLACES.find((p) => p.id === q.place);

  return (
    <section>
      <RuleHead no={2}>The quest in hand</RuleHead>

      <div className="quire">
        <article className="leaf leaf--chapter leaf--ruled" style={{ position: "relative" }}>
          <span className="ribbon">{q.state === "in-progress" ? "In hand" : "Unclaimed"}</span>

          <div className="leaf-field" style={{ paddingTop: "3.2rem" }}>
            <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-6">
              <div>
                <p className="t-eyebrow">Quest {roman(q.no)} · {place?.name}</p>
                <h2 className="t-chapter mt-3">{q.title}</h2>
              </div>

              <div className="flex items-start gap-12">
                <Figure label="Difficulty">
                  <Stars value={q.difficulty} />
                  <span className="t-caps block mt-1.5">{DIFFICULTY_WORD[q.difficulty]}</span>
                </Figure>
                <Figure label="Reward">
                  <span className="t-figure" style={{ fontSize: "1.2rem" }}>{q.reward} XP</span>
                  <span className="t-caps block mt-1.5">{q.hours}</span>
                </Figure>
              </div>
            </div>

            <hr className="rule" />

            <div className="spread">
              <div>
                <span className="t-caps label-gap">Objective</span>
                <p className="t-lead column">{q.objective}</p>

                <RuleHead quiet>The work, in order</RuleHead>
                <ol className="flex flex-col gap-3.5">
                  {q.steps.map((s, i) => {
                    const done = i < q.done;
                    return (
                      <li key={s} className="flex gap-4 items-baseline">
                        <span
                          className="t-roman"
                          style={{
                            minWidth: "2.6rem",
                            fontSize: "0.78rem",
                            color: done ? "var(--verdigris)" : "var(--ink-faint)",
                          }}
                        >
                          {roman(i + 1)}
                        </span>
                        <span className={done ? "struck t-body" : "t-body"}>{s}</span>
                      </li>
                    );
                  })}
                </ol>

                <div className="flex flex-wrap items-center gap-5 mt-10">
                  <Link to="/quests" className="ink-btn ink-btn--filled">
                    {q.state === "in-progress" ? "Resume the quest" : "Accept the quest"}
                  </Link>
                  <span className="t-caps">
                    {roman(q.done)} of {roman(q.steps.length)} steps struck through
                  </span>
                </div>
              </div>

              <aside className="flex flex-col gap-5">
                <div className="slip">
                  <span className="t-caps label-gap">Told at the waystation</span>
                  <p className="t-small" style={{ fontStyle: "italic" }}>&ldquo;{q.gloss}&rdquo;</p>
                  <div className="flex justify-end mt-4" style={{ color: "var(--ink-faint)" }}>
                    <Mark name="lantern" size={26} />
                  </div>
                </div>
                <p className="margin-note margin-note--right">
                  two struck through — the third is the hard one
                </p>
              </aside>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function RealmIndex() {
  return (
    <section>
      <RuleHead no={3}>Index of the realm</RuleHead>
      <div className="overflow-x-auto">
        <table className="ledger">
          <thead>
            <tr>
              <th style={{ width: "3.2rem" }}>№</th>
              <th style={{ minWidth: "15rem" }}>Place</th>
              <th>Ground</th>
              <th style={{ width: "13rem" }}>Standing</th>
              <th style={{ width: "5rem" }}>Quests</th>
              <th style={{ width: "7rem" }} />
            </tr>
          </thead>
          <tbody>
            {PLACES.map((p, i) => {
              const barred = p.state === "sealed" || p.state === "unknown";
              return (
                <tr key={p.id} className={p.state === "current" ? "is-now" : barred ? "is-locked" : ""}>
                  <td className="ledger-num">{roman(i + 1)}</td>
                  <td>
                    <span className={p.state === "current" ? "t-minor t-rubric" : "t-minor"}>{p.name}</span>
                    <span className="block t-hand mt-1" style={{ fontSize: "1.05rem" }}>{p.domain}</span>
                  </td>
                  <td className="t-small">{p.teaches.join(" · ")}</td>
                  <td>
                    <Stamp
                      tone={p.state === "current" ? "rubric" : p.state === "charted" ? "green" : "faint"}
                      pressed={p.state === "charted"}
                    >
                      {STATE_NOTE[p.state]}
                    </Stamp>
                  </td>
                  <td className="ledger-num">{p.quests ? roman(p.quests) : "—"}</td>
                  <td>
                    {barred ? (
                      <Link to="/oath" className="t-caps" style={{ color: "var(--rubric)" }}>The oath →</Link>
                    ) : (
                      <Link to={`/quests?place=${p.id}`} className="t-caps">Quests →</Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WaysUnder() {
  return (
    <section>
      <RuleHead no={4}>Ways under the ground</RuleHead>
      <div className="flex flex-col">
        {DUNGEONS.slice(0, 4).map((d) => {
          const sealed = d.state === "sealed";
          const struck = d.chambers.filter((c) => c.done).length;
          return (
            <article key={d.slug} className={`entry ${sealed ? "entry--obscured" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-5">
                <div style={{ minWidth: "18rem", flex: 1 }}>
                  <p className="t-caps">{d.kind}</p>
                  <h3 className="t-entry mt-2">{d.name}</h3>
                  <p className="t-small column mt-3">{d.gloss}</p>
                </div>

                <div className="flex items-center gap-8 shrink-0">
                  <div className="text-right">
                    <Stars value={d.difficulty} />
                    <span className="block t-figure mt-1.5">{d.reward} XP</span>
                  </div>
                  {sealed ? (
                    <Stamp tone="faint" pressed>Sealed</Stamp>
                  ) : (
                    <div className="text-right">
                      <Link to={`/dungeons/${d.slug}`} className="ink-btn ink-btn--small">Descend</Link>
                      <span className="block t-caps mt-2">
                        {struck ? `${roman(struck)} of ${roman(d.chambers.length)} struck` : "untouched"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-8">
        <Link to="/dungeons" className="ink-btn">All six dungeons</Link>
      </div>
    </section>
  );
}

function OathFoot() {
  return (
    <section>
      <RuleHead no={5}>What is kept from the unsworn</RuleHead>
      <div className="leaf leaf--aged" style={{ padding: "2.6rem 2.4rem" }}>
        <div className="flex flex-wrap items-center gap-10">
          <Seal size={84} label="The guild seal" />
          <div style={{ flex: 1, minWidth: "17rem" }}>
            <p className="t-eyebrow">The sealed folios</p>
            <h3 className="t-entry mt-2">Four grounds are barred</h3>
            <p className="t-small column mt-3">
              The marshes, the counting house, the well of Stonewatch and the dungeon beneath the
              mountains. Swearing the guild oath breaks the seal on all four, and on every field
              journal in the archive.
            </p>
          </div>
          <Link to="/oath" className="ink-btn ink-btn--rubric">Read the oath</Link>
        </div>
      </div>
    </section>
  );
}

export default function MapPage() {
  return (
    <>
      <Opening />
      <Survey />
      <QuestInHand />
      <RealmIndex />
      <WaysUnder />
      <OathFoot />
    </>
  );
}
