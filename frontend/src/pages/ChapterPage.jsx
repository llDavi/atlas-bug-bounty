import { Link, useParams } from "react-router-dom";
import { PageHead, RuleHead, Stamp, Fleuron, Mark } from "../components/ms/Codex";
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
  const quest = (quests || []).find((q) => q.place === chapter.place && q.kingdom === id);
  const dungeons = dungeonsAtPlace(chapter.place);
  const dungeon = dungeons[0] || null;

  return (
    <>
      <Link to={`/kingdoms/${kingdom.id}`} className="t-caps" style={{ color: "var(--rubric)" }}>← {kingdom.name}</Link>

      <PageHead
        standing={isBoss ? `${kingdom.name} · Final Boss` : `${kingdom.name} · Chapter ${roman(number)} of ${chaptersOf(id).length}`}
        title={chapter.title}
        gloss={chapter.finalBoss ? chapter.brief : `${chapter.real}. ${chapter.topics.length} lessons walked in order, then the trial that proves them.`}
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
            <Stamp tone="faint">Being written</Stamp>
          </div>
        </>
      ) : (
        <>
          <RuleHead no={1}>The lessons of this chapter</RuleHead>
          <p className="t-body column-wide">
            The chapter is walked as these lessons, in order. Each teaches you one thing to look for;
            together they are the ground of <span style={{ fontStyle: "italic" }}>{chapter.real}</span>.
          </p>
          <ol className="topic-grid mt-7">
            {chapter.topics.map((t, i) => (
              <li key={t} className="topic">
                <span className="topic-no">{String(i + 1).padStart(2, "0")}</span>
                <span className="topic-name">{t}</span>
              </li>
            ))}
          </ol>

          <RuleHead no={2}>Walk it</RuleHead>
          <div className="flex flex-wrap items-start gap-x-14 gap-y-8">
            <div style={{ flex: 1, minWidth: "16rem" }}>
              <p className="t-caps label-gap">The quest · learn</p>
              {quest ? (
                <>
                  <p className="t-small column">Read the passage and answer the questions set into it. {quest.xp} XP.</p>
                  <Link to={`/quests/${quest.slug}`} className="ink-btn ink-btn--filled mt-5">
                    {quest.status === "completed" ? "Read it again" : "Begin the quest"}
                  </Link>
                </>
              ) : (
                <>
                  <p className="t-small column">Its quest is still being copied into the journal.</p>
                  <div className="mt-4"><Stamp tone="faint">Being written</Stamp></div>
                </>
              )}
            </div>

            <div style={{ flex: 1, minWidth: "16rem" }}>
              <p className="t-caps label-gap">The trial · prove</p>
              {dungeon ? (
                <>
                  <p className="t-small column">{dungeon.name} — go in and do the work for real, through its five chambers.</p>
                  <Link to={`/dungeons/${dungeon.slug}`} className="ink-btn mt-5">The plan of {dungeon.name}</Link>
                </>
              ) : chapter.trial ? (
                <>
                  <p className="t-small column">{chapter.trial.kind === "dungeon" ? "A dungeon" : "A boss"}: {chapter.trial.brief}</p>
                  <div className="mt-4"><Stamp tone="faint">Being dug</Stamp></div>
                </>
              ) : (
                <p className="t-small column" style={{ color: "var(--ink-faint)" }}>No trial is set for this chapter.</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col items-center mt-16">
        <Fleuron width={150} />
        <div className="flex items-center gap-3 mt-5">
          <span style={{ color: "var(--ink-faint)" }}><Mark name={kingdom.mark} size={22} /></span>
          <Link to={`/kingdoms/${kingdom.id}`} className="t-caps" style={{ color: "var(--rubric)" }}>Back to {kingdom.name}</Link>
        </div>
      </div>
    </>
  );
}
