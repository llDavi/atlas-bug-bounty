import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { PageHead, Stars, Fleuron, Mark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { api } from "../api";
import { useHunter } from "../hunter-context";
import { KINGDOMS, kingdomById } from "../data/realm";
import { chaptersOf } from "../data/chapters";
import { placeById } from "../data/world";
import { DUNGEONS } from "../data/dungeons";

/* ==========================================================================
   THE QUEST JOURNAL — an open book, kingdom by kingdom
   ==========================================================================
   Each kingdom is a spread: on the left leaf THE LESSONS (its quests, where
   you read and answer and learn where to look), on the right leaf THE TRIALS
   (its dungeons, where you go in and do the work for real). Every place on
   the kingdom's map is a lesson; a trial is dug at a place when the guild has
   cut one. The two leaves are bound by a fold down the middle.
   ========================================================================== */

/* A muted ink colour per kingdom, on the binding of each spread. */
const ACCENT = {
  web: "#3f5a7a",
  api: "#7a5a30",
  mobile: "#3d6b63",
  "smart-contracts": "#6b3f5c",
  networks: "#55606e",
};

const QUEST_NOTE = {
  completed: { label: "discharged", color: "var(--verdigris)" },
  available: { label: "open · begin", color: "var(--rubric)" },
  locked: { label: "further on", color: "var(--ink-faint)" },
};

/* One lesson line: rubricated number, title, and a note on its standing. */
function Lesson({ chapter, number, quest }) {
  const written = Boolean(quest);
  const note = quest ? QUEST_NOTE[quest.status] || QUEST_NOTE.available : null;
  return (
    <div className={`lesson ${written ? "" : "lesson--unwritten"}`}>
      <span className="lesson-no">{roman(number)}</span>
      {written ? (
        <Link to={`/quests/${quest.slug}`} className="lesson-title">{chapter.title}</Link>
      ) : (
        <span className="lesson-title">{chapter.title}</span>
      )}
      {written ? (
        <span className="lesson-note" style={{ color: note.color }}>
          {quest.xp} XP · {note.label}
        </span>
      ) : (
        <span className="lesson-note" style={{ color: "var(--ink-faint)" }}>being written</span>
      )}
    </div>
  );
}

/* One trial (dungeon) on the right leaf. */
function Trial({ dungeon }) {
  return (
    <div className="trial">
      <span className="trial-mark"><Mark name="chain" size={22} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h4 className="t-entry" style={{ fontSize: "1.05rem" }}>
          <Link to={`/dungeons/${dungeon.slug}`}>{dungeon.name}</Link>
        </h4>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
          <Stars value={dungeon.difficulty} />
          <span className="t-figure">{dungeon.reward} XP</span>
          <span className="t-caps" style={{ color: "var(--ink-faint)" }}>still being dug</span>
        </div>
      </div>
    </div>
  );
}

export default function QuestsPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { hunter } = useHunter();
  const [params, setParams] = useSearchParams();
  const placeFilter = params.get("place");
  const [quests, setQuests] = useState(null);
  const [error, setError] = useState(null);
  const done = hunter?.completed_quests?.length ?? 0;

  useEffect(() => {
    if (!isLoaded) return;
    let dropped = false;
    api("/api/quests", { getToken: isSignedIn ? getToken : undefined })
      .then((list) => {
        if (!dropped) setQuests(list);
      })
      .catch((err) => {
        if (!dropped) setError(err.message);
      });
    return () => {
      dropped = true;
    };
  }, [isLoaded, isSignedIn, getToken, done]);

  const writtenByKey = useMemo(() => {
    const m = {};
    for (const q of quests || []) if (q.place) m[`${q.kingdom}:${q.place}`] = q;
    return m;
  }, [quests]);

  const groups = useMemo(() => {
    const followed = hunter?.kingdoms ?? [];
    const order = [...followed, ...KINGDOMS.map((k) => k.id).filter((k) => !followed.includes(k))];
    return order
      .map((id) => {
        const kingdom = kingdomById(id);
        let chapters = chaptersOf(id).map((c, i) => ({ chapter: c, number: i + 1 }));
        // Every current dungeon sits at a Web Realm place.
        let dungeons = (id === "web" ? DUNGEONS : []);
        if (placeFilter) {
          chapters = chapters.filter((e) => e.chapter.place === placeFilter);
          dungeons = dungeons.filter((d) => d.place === placeFilter);
        }
        return { kingdom, chapters, dungeons };
      })
      .filter((g) => g.chapters.length);
  }, [hunter, placeFilter]);

  const place = placeFilter ? placeById(placeFilter) : null;
  const loading = !quests && !error;

  return (
    <>
      <PageHead
        folio={2}
        standing="The second folio"
        title="The Quest Journal"
        gloss="Every kingdom is a spread of two leaves: the lessons, where you read and answer and learn where to look, and the trials, where you go in and do the work for real. One leaf teaches; the other proves."
      />

      {place && (
        <p className="mb-8 flex items-center gap-4 flex-wrap">
          <span className="t-caps">The chapter at</span>
          <span className="t-entry">{place.name}</span>
          <button type="button" onClick={() => setParams({})} className="t-caps" style={{ color: "var(--rubric)" }}>
            Show every kingdom
          </button>
        </p>
      )}

      {error && (
        <div className="leaf" style={{ padding: "2.4rem" }}>
          <p className="t-eyebrow">The journal is shut</p>
          <p className="t-entry mt-3">The register did not answer.</p>
          <pre className="typed mt-5">{error}</pre>
        </div>
      )}

      {loading && (
        <div className="leaf" style={{ padding: "3rem", textAlign: "center" }}>
          <p className="t-entry">Opening the journal…</p>
        </div>
      )}

      {!error &&
        groups.map((g) => {
          const accent = ACCENT[g.kingdom.id] || "var(--rule-strong)";
          const written = g.chapters.filter((e) => e.chapter.place && writtenByKey[`${g.kingdom.id}:${e.chapter.place}`]).length;
          const followed = hunter?.kingdoms?.includes(g.kingdom.id);
          return (
            <section key={g.kingdom.id} className="mb-14">
              <div className="kingdom-banner mb-5" style={{ "--accent": accent }}>
                <span className="banner-mark"><Mark name={g.kingdom.mark} size={26} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h2 className="t-entry">{g.kingdom.name}</h2>
                    {followed && <span className="t-caps" style={{ color: "var(--rubric)" }}>followed</span>}
                  </div>
                  <p className="t-small mt-1">{g.kingdom.gloss}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="t-caps">{written} of {g.chapters.length} written</p>
                  <Link to={`/kingdoms/${g.kingdom.id}`} className="t-caps" style={{ color: "var(--rubric)" }}>the map →</Link>
                </div>
              </div>

              <div className="spread-book" style={{ "--accent": accent }}>
                {/* left leaf — the lessons */}
                <div className="spread-page spread-page--left">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="spread-rubric">The lessons</span>
                    <span className="t-caps" style={{ color: "var(--ink-faint)" }}>learn where to look</span>
                  </div>
                  <div className="mt-4">
                    {g.chapters.map(({ chapter, number }) => (
                      <Lesson
                        key={chapter.title}
                        chapter={chapter}
                        number={number}
                        quest={chapter.place ? writtenByKey[`${g.kingdom.id}:${chapter.place}`] : null}
                      />
                    ))}
                  </div>
                </div>

                {/* right leaf — the trials */}
                <div className="spread-page spread-page--right">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="spread-rubric">The trials</span>
                    <span className="t-caps" style={{ color: "var(--ink-faint)" }}>go in and do it</span>
                  </div>
                  {g.dungeons.length ? (
                    <div className="mt-4">
                      {g.dungeons.map((d) => <Trial key={d.slug} dungeon={d} />)}
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-col items-start gap-3">
                      <span style={{ color: "var(--ink-faint)" }}><Mark name={g.kingdom.mark} size={30} /></span>
                      <p className="t-small" style={{ color: "var(--ink-faint)", maxWidth: "34ch" }}>
                        No trials have been cut in this kingdom yet. Its dungeons are still being dug.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}

      <div className="flex flex-col items-center mt-14">
        <Fleuron width={160} />
        <p className="t-caps mt-4">Here the quest journal ends, for now</p>
      </div>
    </>
  );
}
