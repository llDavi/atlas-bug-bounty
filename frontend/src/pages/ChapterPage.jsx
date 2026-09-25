import { Link, useParams } from "react-router-dom";
import { PageHead, RuleHead, Stamp, Fleuron } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { kingdomById } from "../data/realm";
import { chaptersWithBoss, chaptersOf } from "../data/chapters";
import { dungeonsAtPlace } from "../data/dungeons";
import { useQuests } from "../useQuests";

/* ==========================================================================
   ONE CHAPTER — its lessons, its trial
   ==========================================================================
   A chapter is a module. This folio opens it: the topics it teaches, set out
   as the micro-lessons walked in order; the quest that assesses them, when
   the register has written one; and the Boss or Dungeon that proves the
   chapter in practice. The kingdom's last chapter is its Final Boss, walked
   Recon → Discovery → Investigation → Exploitation → Impact → Report.
   ========================================================================== */

const BOSS_STEPS = [
  ["Reconnaissance", "Walk the ground. Write down what is there before touching any of it."],
  ["Discovery", "Find the assumption nobody wrote down."],
  ["Investigation", "Follow the thread. Understand before you act."],
  ["Exploitation", "Turn the assumption into something a keeper cannot argue with."],
  ["Impact", "Establish what it costs. Stop the moment it is established."],
  ["Report", "Write it so the repair is obvious to somebody who was not there."],
];

function NotFound({ kingdom }) {
  return (
    <div className="leaf leaf--lit" style={{ padding: "2.6rem" }}>
      <p className="t-eyebrow">The cartographer checks the survey twice</p>
      <h1 className="t-chapter mt-3 mb-8">No chapter of that name is on this sheet.</h1>
      <Link to={kingdom ? `/kingdoms/${kingdom.id}` : "/"} className="ink-btn">
        {kingdom ? `Back to ${kingdom.name}` : "Back to the known world"}
      </Link>
    </div>
  );
}

export default function ChapterPage() {
  const { id, place } = useParams();
  const kingdom = kingdomById(id);
  const { quests } = useQuests();

  const chapters = chaptersWithBoss(id);
  const index = chapters.findIndex((c) => c.place === place);
  const chapter = index >= 0 ? chapters[index] : null;

  if (!kingdom || !chapter) return <NotFound kingdom={kingdom} />;

  const isBoss = Boolean(chapter.finalBoss);
  const number = index + 1;
  // A chapter holds several lessons: every quest written at this place, in order.
  const lessons = (quests || [])
    .filter((q) => q.place === chapter.place && q.kingdom === id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const dungeons = dungeonsAtPlace(chapter.place);
  const dungeon = dungeons[0] || null;

  return (
    <>
      <Link to={`/kingdoms/${kingdom.id}`} className="t-caps" style={{ color: "var(--rubric)" }}>← {kingdom.name}</Link>

      <PageHead
        standing={isBoss ? `${kingdom.name} · Final Boss` : `${kingdom.name} · Chapter ${roman(number)} of ${chaptersOf(id).length}`}
        title={chapter.title}
        gloss={chapter.finalBoss ? chapter.brief : `${chapter.real}. Its ground is ${chapter.topics.length} topics, gathered into the lessons below, then a trial to prove them.`}
      />

      {isBoss ? (
        <>
          <RuleHead no={1}>The last trial</RuleHead>
          <p className="t-body column-wide">
            No hints, and no telling in advance where it breaks. Everything the kingdom taught you,
            spent on one target — walked end to end, the way a real engagement is walked.
          </p>
          <ol className="flex flex-col gap-0 mt-8">
            {BOSS_STEPS.map(([name, gloss], i) => (
              <li key={name} className="entry" style={{ padding: "1.4rem 0" }}>
                <div className="flex items-baseline gap-4">
                  <span className="t-roman" style={{ color: "var(--rubric)", minWidth: "2.2rem" }}>{roman(i + 1)}</span>
                  <div>
                    <h3 className="t-entry">{name}</h3>
                    <p className="t-small mt-1.5 column">{gloss}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Stamp tone="rubric">Final Boss</Stamp>
            {lessons.length === 0 && <Stamp tone="faint">Being written</Stamp>}
          </div>
          {lessons.map((l) => (
            <div key={l.slug} className="mt-8 flex flex-wrap items-center justify-between gap-6">
              <div style={{ flex: 1, minWidth: "16rem" }}>
                <h3 className="t-entry">{l.title}</h3>
                {l.summary && <p className="t-small column mt-1.5">{l.summary}</p>}
              </div>
              <div className="flex items-center gap-5 shrink-0">
                <span className="t-figure">{l.xp} XP</span>
                <Link to={`/quests/${l.slug}`} className="ink-btn ink-btn--rubric">
                  {l.status === "completed" ? "Walk it again" : "Walk the final trial"}
                </Link>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <RuleHead no={1}>The lessons</RuleHead>
          <p className="t-body column-wide">
            The chapter is walked as these lessons, in order. Each gathers a few of its topics into
            one reading, with the questions set into the text.
          </p>
          {lessons.length ? (
            <div className="flex flex-col mt-6">
              {lessons.map((l, i) => (
                <article key={l.slug} className="entry">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
                    <div style={{ flex: 1, minWidth: "16rem" }}>
                      <p className="t-roman" style={{ fontSize: "0.8rem" }}>Lesson {roman(i + 1)}</p>
                      <h3 className="t-entry mt-1">{l.title}</h3>
                      {l.summary && <p className="t-small column mt-1.5">{l.summary}</p>}
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <span className="t-figure">{l.xp} XP</span>
                      <Link
                        to={`/quests/${l.slug}`}
                        className={`ink-btn ink-btn--small ${l.status === "available" ? "ink-btn--filled" : ""}`}
                      >
                        {l.status === "completed" ? "Read again" : l.status === "available" ? "Begin" : "Read the lesson"}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <Stamp tone="faint">Being written</Stamp>
              <p className="t-small column mt-3">The lessons for this chapter are still being written. Its ground is set out below.</p>
            </div>
          )}

          <RuleHead no={2}>The ground it covers</RuleHead>
          <p className="t-body column-wide">
            Every topic of <span style={{ fontStyle: "italic" }}>{chapter.real}</span>, in the order it is learned.
          </p>
          <ol className="topic-grid mt-6">
            {chapter.topics.map((t, i) => (
              <li key={t} className="topic">
                <span className="topic-no">{String(i + 1).padStart(2, "0")}</span>
                <span className="topic-name">{t}</span>
              </li>
            ))}
          </ol>

          <RuleHead no={3}>The trial · prove</RuleHead>
          {dungeon ? (
            <div className="flex flex-wrap items-start justify-between gap-6">
              <p className="t-body column">{dungeon.name} — go in and do the work for real, through its five chambers.</p>
              <Link to={`/dungeons/${dungeon.slug}`} className="ink-btn shrink-0">The plan of {dungeon.name}</Link>
            </div>
          ) : chapter.trial ? (
            <div>
              <p className="t-body column">{chapter.trial.kind === "dungeon" ? "A dungeon" : "A boss"}: {chapter.trial.brief}</p>
              <div className="mt-4"><Stamp tone="faint">Being dug</Stamp></div>
            </div>
          ) : (
            <p className="t-body column" style={{ color: "var(--ink-faint)" }}>No trial is set for this chapter.</p>
          )}
        </>
      )}

      <div className="flex flex-col items-center mt-16">
        <Fleuron width={150} />
      </div>
    </>
  );
}
