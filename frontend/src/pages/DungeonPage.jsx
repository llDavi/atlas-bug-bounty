import { Link, useParams } from "react-router-dom";
import { RuleHead, Stamp, Stars, Fleuron, Mark, CheckMark, LockMark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { DungeonSection } from "./DungeonsPage";
import { dungeonBySlug, CHAMBER_ORDER } from "../data/dungeons";
import { placeById } from "../data/world";

/* ==========================================================================
   ONE DUNGEON — a place, entered chamber by chamber
   ==========================================================================
   The bench at the foot of the page is the only deliberately plain thing in
   this book: the work itself is typed, so it is set in typewriter face on a
   pasted-in slip, the way a hunter tapes a transcript into a journal.
   ========================================================================== */

function Chamber({ c, i, current, sealed }) {
  const meta = CHAMBER_ORDER[i];
  const state = c.done ? "struck" : i === current ? "open" : "ahead";

  return (
    <article className="entry">
      <div className="flex items-start gap-5">
        <div className="text-center" style={{ minWidth: "3.4rem" }}>
          <p className="t-roman text-lg" style={{ color: c.done ? "var(--verdigris)" : "var(--ink-strong)" }}>
            {roman(c.no)}
          </p>
          <p style={{ color: c.done ? "var(--verdigris)" : "var(--ink-faint)" }}>
            {c.done ? <CheckMark size={16} /> : sealed ? <LockMark size={14} /> : null}
          </p>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="t-title text-2xl">{meta?.name}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stamp tone={c.done ? "green" : state === "open" ? "rubric" : "faint"}>
                {c.done ? "Struck through" : state === "open" ? "The chamber you stand in" : "Ahead"}
              </Stamp>
              {!sealed && <span className="t-caps">{c.craft}</span>}
            </div>
          </div>

          <p className="t-hand mt-1">{meta?.gloss}</p>

          <p className={`mt-3 text-[1.05rem] column ${c.done ? "struck" : ""}`}>{c.task}</p>

          {state === "open" && !sealed && (
            <div className="mt-4">
              <p className="t-caps mb-1.5">The bench</p>
              <pre className="typed">{`$ curl -s -i https://target.example/postern/ \\
    -H 'Cookie: session=<yours>'

HTTP/1.1 200 OK
x-served-by: legacy-edge-3
# note what the reply admits to before you touch anything`}</pre>
              <p className="margin-note mt-3">
                write down what you see here before you change a single value
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button type="button" className="ink-btn ink-btn--filled">Mark this chamber struck</button>
                <Link to="/journals" className="ink-btn">Read a hunter&rsquo;s account</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function DungeonPage() {
  const { slug } = useParams();
  const d = dungeonBySlug(slug);

  if (!d) {
    return (
      <div className="leaf leaf--lit" style={{ padding: "2.5rem" }}>
        <p className="t-caps">The keeper checks the index</p>
        <h1 className="t-title text-3xl mt-2 mb-3">No such way under the ground.</h1>
        <Link to="/dungeons" className="ink-btn">Back to the dungeons</Link>
      </div>
    );
  }

  const place = placeById(d.place);
  const sealed = d.state === "sealed";
  const struck = d.chambers.filter((c) => c.done).length;

  return (
    <>
      <Link to="/dungeons" className="t-caps" style={{ color: "var(--rubric)" }}>
        ← The dungeons
      </Link>

      <header className="mt-4 mb-8">
        <p className="t-caps">
          {d.order}
          {place && <> · below {place.name}</>}
        </p>
        <h1 className="t-title text-4xl sm:text-5xl mt-1 mb-2">{d.name}</h1>
        <p className="t-caps">{d.kind}</p>
        <Fleuron width={170} className="mt-3" />
      </header>

      <div className="spread mb-2">
        <div className="leaf leaf--ruled quire">
          <div className="leaf-field">
            <p className="t-caps mb-3">Section through the ground</p>
            <DungeonSection chambers={d.chambers} depth={d.depth} current={struck} />
            <hr className="rule" />
            <p className="dropcap text-[1.05rem]">{d.entrance}</p>
          </div>
        </div>

        <aside>
          <div className="slip mb-4">
            <div className="flex flex-col gap-3">
              <span>
                <span className="t-caps block mb-0.5">Difficulty</span>
                <Stars value={d.difficulty} />
              </span>
              <span>
                <span className="t-caps block mb-0.5">Reward on the report</span>
                <span className="t-roman text-[0.95rem]">{d.reward} XP</span>
              </span>
              <span>
                <span className="t-caps block mb-0.5">Reckoned at</span>
                <span className="text-[0.95rem]">{d.hours}</span>
              </span>
              <span>
                <span className="t-caps block mb-0.5">Chambers struck</span>
                <span className="t-roman text-[0.95rem]">
                  {struck ? roman(struck) : "—"} of {roman(d.chambers.length)}
                </span>
              </span>
            </div>
          </div>

          <p className="text-[0.95rem]" style={{ fontStyle: "italic" }}>&ldquo;{d.gloss}&rdquo;</p>

          <div className="flex justify-center mt-4" style={{ color: "var(--ink-faint)" }}>
            <Mark name={sealed ? "chain" : "lantern"} size={34} />
          </div>

          {sealed && (
            <Link to="/oath" className="ink-btn ink-btn--rubric w-full mt-4">
              Swear the oath
            </Link>
          )}
        </aside>
      </div>

      <RuleHead>The chambers</RuleHead>

      <div className="flex flex-col">
        {d.chambers.map((c, i) => (
          <Chamber key={c.no} c={c} i={i} current={struck} sealed={sealed} />
        ))}
      </div>

      <div className="flex flex-col items-center mt-12">
        <Fleuron width={150} />
        <p className="t-caps mt-3">Come back up the way you came down</p>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <Link to="/quests" className="ink-btn">The quest journal</Link>
          <Link to="/bestiary" className="ink-btn">What lives here</Link>
        </div>
      </div>
    </>
  );
}
