import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHead, Stamp, Stars, Mark, Fleuron } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { QUESTS, DIFFICULTY_WORD } from "../data/journal";
import { placeById } from "../data/world";
import { dungeonsAtPlace } from "../data/dungeons";

/* ==========================================================================
   THE QUEST JOURNAL
   ==========================================================================
   Not courses, and not cards. Each quest is an entry written on the page,
   ruled off from the one before it, in the order it was taken down.
   ========================================================================== */

const STATES = {
  completed: { label: "Discharged", tone: "green" },
  "in-progress": { label: "In hand", tone: "rubric" },
  available: { label: "Unclaimed", tone: "" },
  sealed: { label: "Sealed", tone: "faint" },
};

const FILTERS = [
  ["all", "Every quest"],
  ["available", "Unclaimed"],
  ["in-progress", "In hand"],
  ["completed", "Discharged"],
  ["sealed", "Sealed"],
];

function QuestEntry({ q }) {
  const st = STATES[q.state];
  const place = placeById(q.place);
  const sealed = q.state === "sealed";
  const dungeon = dungeonsAtPlace(q.place)[0];

  return (
    <article id={`quest-${q.no}`} className={`entry ${sealed ? "entry--obscured" : ""}`}>
      <div className="spread">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="t-roman text-[0.78rem]">Quest {roman(q.no)}</p>
            <Stamp tone={st.tone} pressed={q.state === "completed"}>{st.label}</Stamp>
            {place && (
              <Link to={`/quests?place=${place.id}`} className="t-caps">
                {place.name}
              </Link>
            )}
          </div>

          <h2 className="t-title text-3xl sm:text-4xl mt-2 mb-3">{q.title}</h2>

          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 mb-4">
            <span>
              <span className="t-caps block mb-0.5">Difficulty</span>
              <Stars value={q.difficulty} />
              <span className="block t-caps">{DIFFICULTY_WORD[q.difficulty]}</span>
            </span>
            <span>
              <span className="t-caps block mb-0.5">Reward</span>
              <span className="t-roman text-[0.95rem]">{q.reward} XP</span>
            </span>
            <span>
              <span className="t-caps block mb-0.5">Reckoned at</span>
              <span className="text-[0.95rem]">{q.hours}</span>
            </span>
            {q.beast !== "—" && (
              <span>
                <span className="t-caps block mb-0.5">Beast</span>
                <Link to="/bestiary" className="ink-link text-[0.95rem]">{q.beast}</Link>
              </span>
            )}
          </div>

          <p className="t-caps mb-1.5">Objective</p>
          <p className="text-[1.08rem] column-wide mb-5">
            {sealed ? "The wording of this quest is kept from the unsworn." : q.objective}
          </p>

          {!sealed && (
            <>
              <p className="t-caps mb-2">The work, in order</p>
              <ol className="flex flex-col gap-1.5 mb-5">
                {q.steps.map((s, i) => (
                  <li key={s} className="flex gap-3 items-baseline">
                    <span
                      className="t-roman text-[0.7rem]"
                      style={{ minWidth: "2.2rem", color: i < q.done ? "var(--verdigris)" : "var(--ink-faint)" }}
                    >
                      {roman(i + 1)}
                    </span>
                    <span className={i < q.done ? "struck" : ""}>{s}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {sealed ? (
              <Link to="/oath" className="ink-btn ink-btn--rubric">Break the seal</Link>
            ) : q.state === "completed" ? (
              <Link to="/journals" className="ink-btn">Read the account again</Link>
            ) : (
              <Link to={dungeon ? `/dungeons/${dungeon.slug}` : "/dungeons"} className="ink-btn ink-btn--filled">
                {q.state === "in-progress" ? "Take up the work" : "Accept the quest"}
              </Link>
            )}
            {q.done > 0 && q.done < q.steps.length && (
              <span className="t-caps">
                {roman(q.done)} of {roman(q.steps.length)} steps struck through
              </span>
            )}
          </div>
        </div>

        <aside>
          <div className="slip">
            <p className="t-caps mb-2">As it was told</p>
            <p className="text-[0.95rem]" style={{ fontStyle: "italic" }}>&ldquo;{q.gloss}&rdquo;</p>
            <div className="flex justify-end mt-3" style={{ color: "var(--ink-faint)" }}>
              <Mark name={sealed ? "chain" : "quill"} size={24} />
            </div>
          </div>
          {q.state === "in-progress" && (
            <p className="margin-note margin-note--right mt-4">
              two steps struck through — the third is the hard one
            </p>
          )}
        </aside>
      </div>
    </article>
  );
}

export default function QuestsPage() {
  const [params, setParams] = useSearchParams();
  const placeId = params.get("place");
  const [state, setState] = useState("all");

  const shown = useMemo(
    () =>
      QUESTS.filter((q) => {
        if (placeId && q.place !== placeId) return false;
        if (state !== "all" && q.state !== state) return false;
        return true;
      }),
    [placeId, state]
  );

  const place = placeId ? placeById(placeId) : null;
  const tally = QUESTS.reduce((acc, q) => ({ ...acc, [q.state]: (acc[q.state] || 0) + 1 }), {});

  return (
    <>
      <PageHead
        folio={2}
        standing="The second folio"
        title="The Quest Journal"
        gloss="Every quest was written down as it was taken, and struck through as it was discharged. The wording never says where the flaw is: a real programme does not say either."
        hand={`${tally.available || 0} unclaimed · ${tally["in-progress"] || 0} in hand · ${tally.sealed || 0} sealed`}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setState(key)}
            className={`t-caps ${state === key ? "" : ""}`}
            style={{
              color: state === key ? "var(--rubric)" : "var(--ink-soft)",
              borderBottom: state === key ? "1px solid var(--rubric)" : "1px solid transparent",
              paddingBottom: "2px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {place && (
        <p className="mt-4 mb-2 flex items-center gap-3 flex-wrap">
          <span className="t-caps">Quests written at</span>
          <span className="t-title text-xl">{place.name}</span>
          <button type="button" onClick={() => setParams({})} className="t-caps" style={{ color: "var(--rubric)" }}>
            Show the whole realm
          </button>
        </p>
      )}

      <hr className="rule" />

      {shown.length === 0 ? (
        <div className="leaf leaf--lit" style={{ padding: "2rem" }}>
          <p className="t-title text-xl mb-2">Nothing of that kind is entered here.</p>
          <p className="t-soft">The keeper suggests you try another ground, or another standing.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {shown.map((q) => (
            <QuestEntry key={q.slug} q={q} />
          ))}
        </div>
      )}

      <div className="flex flex-col items-center mt-12">
        <Fleuron width={160} />
        <p className="t-caps mt-3">Here the quest journal ends</p>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <Link to="/dungeons" className="ink-btn">The dungeons</Link>
          <Link to="/bestiary" className="ink-btn">The bestiary</Link>
          <Link to="/" className="ink-btn">Back to the survey</Link>
        </div>
      </div>
    </>
  );
}
