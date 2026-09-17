import { Link, useParams } from "react-router-dom";
import { RuleHead, Stars, Fleuron, Mark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { DungeonSection } from "./DungeonsPage";
import { dungeonBySlug, CHAMBER_ORDER } from "../data/dungeons";
import { placeById } from "../data/world";

/* ==========================================================================
   ONE DUNGEON — its plan, while it is still being dug
   ==========================================================================
   No dungeon is open yet: the answer boxes come with the next edition. The
   page shows the ground and the five chambers so a hunter can read the plan,
   and nothing on it pretends to progress that has not happened.
   ========================================================================== */

function Chamber({ c, i }) {
  const meta = CHAMBER_ORDER[i];
  return (
    <article className="entry">
      <div className="flex items-start gap-6">
        <span className="t-roman" style={{ minWidth: "3rem", fontSize: "1.05rem" }}>{roman(c.no)}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="t-entry">{meta?.name}</h3>
            {c.craft && <span className="t-caps">{c.craft}</span>}
          </div>
          <p className="t-hand mt-2">{meta?.gloss}</p>
          <p className="t-body column mt-4">{c.task}</p>
        </div>
      </div>
    </article>
  );
}

function Figure({ label, children }) {
  return (
    <div>
      <span className="t-caps label-gap">{label}</span>
      {children}
    </div>
  );
}

export default function DungeonPage() {
  const { slug } = useParams();
  const d = dungeonBySlug(slug);

  if (!d) {
    return (
      <div className="leaf leaf--lit" style={{ padding: "2.6rem" }}>
        <p className="t-eyebrow">The keeper checks the index</p>
        <h1 className="t-chapter mt-3 mb-8">No such way under the ground.</h1>
        <Link to="/dungeons" className="ink-btn">Back to the dungeons</Link>
      </div>
    );
  }

  const place = placeById(d.place);

  return (
    <>
      <Link to="/dungeons" className="t-caps" style={{ color: "var(--rubric)" }}>← The dungeons</Link>

      <header className="mt-6 mb-10">
        <p className="t-eyebrow">
          {d.order}
          {place && <> · below {place.name}</>}
        </p>
        <h1 className="t-folio mt-3 mb-4">{d.name}</h1>
        <p className="t-caps">{d.kind}</p>
        <Fleuron width={180} className="mt-5" />
      </header>

      <div className="leaf leaf--aged mb-12" style={{ padding: "1.8rem 2rem" }}>
        <p className="t-eyebrow">Still being dug</p>
        <p className="t-entry mt-2">This dungeon is not open yet</p>
        <p className="t-small column-wide mt-3">
          Its five chambers are drawn below so you can read the plan. The answer boxes open with the
          next edition of the codex.
        </p>
      </div>

      <div className="spread">
        <div className="leaf leaf--ruled quire">
          <div className="leaf-field">
            <span className="t-caps label-gap">Section through the ground</span>
            <DungeonSection chambers={d.chambers} depth={d.depth} current={-1} />
            <hr className="rule" />
            <p className="dropcap t-lead column">{d.gloss}</p>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="slip flex flex-col gap-5">
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
          <div className="flex justify-center" style={{ color: "var(--ink-faint)" }}>
            <Mark name="lantern" size={34} />
          </div>
        </aside>
      </div>

      <RuleHead no={1}>The chambers</RuleHead>
      <div className="flex flex-col">
        {d.chambers.map((c, i) => (
          <Chamber key={c.no} c={c} i={i} />
        ))}
      </div>

      <div className="flex flex-col items-center mt-16">
        <Fleuron width={150} />
        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          <Link to="/quests" className="ink-btn ink-btn--filled">The quest journal</Link>
          <Link to="/bestiary" className="ink-btn">What lives here</Link>
        </div>
      </div>
    </>
  );
}
