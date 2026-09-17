import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { Fleuron, Stars, Seal, Stamp, CheckMark, LockMark } from "../components/ms/Codex";
import Manuscript from "../components/ms/Manuscript";
import { roman } from "../utils/numerals";
import { api } from "../api";
import { useHunter } from "../hunter-context";
import { kingdomById, alignmentById } from "../data/realm";
import { placeById } from "../data/world";
import { DIFFICULTY_WORD } from "../data/journal";

/* ==========================================================================
   ONE QUEST — a lesson with questions set into the text
   ==========================================================================
   The browser never holds an answer: each one is sent to the register and
   judged there. Wrong answers can be retried without limit or penalty; when
   every question is answered the quest is discharged, sealed, and its XP
   entered once.
   ========================================================================== */

function QuestionBox({ q, number, slug, canAnswer, onJudged }) {
  const { getToken } = useAuth();
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState(q.answered ? "right" : null); // null | "right" | "wrong"
  const [tries, setTries] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const answered = verdict === "right";

  const submit = async (e) => {
    e.preventDefault();
    if (!value.trim() || pending || answered) return;
    setPending(true);
    setError(null);
    try {
      const result = await api(`/api/quests/${slug}/answer`, {
        getToken,
        method: "POST",
        body: { question_id: q.id, answer: value },
      });
      setVerdict(result.correct ? "right" : "wrong");
      if (!result.correct) setTries((t) => t + 1);
      onJudged(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <aside className={`qbox ${answered ? "qbox--right" : verdict === "wrong" ? "qbox--wrong" : ""}`}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="t-eyebrow">Question {roman(number)}</span>
        {answered && (
          <span className="t-done flex items-center gap-1.5">
            <CheckMark size={16} /> <span className="t-caps t-done">Answered</span>
          </span>
        )}
      </div>
      <p className="t-lead mt-3">{q.prompt}</p>

      {!canAnswer ? (
        <div className="mt-5">
          <SignInButton mode="modal">
            <button type="button" className="ink-btn ink-btn--small">Sign in to answer</button>
          </SignInButton>
        </div>
      ) : answered ? (
        <p className="t-small mt-4">Entered in the register.</p>
      ) : (
        <form onSubmit={submit} className="mt-5 flex flex-wrap items-end gap-4">
          <label className="flex-1" style={{ minWidth: "12rem" }}>
            <span className="t-caps label-gap">Your answer</span>
            <input
              className="field-input t-tech"
              style={{ fontSize: "1rem" }}
              value={value}
              maxLength={500}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => {
                setValue(e.target.value);
                if (verdict === "wrong") setVerdict(null);
              }}
            />
          </label>
          <button type="submit" className="ink-btn ink-btn--small" disabled={!value.trim() || pending}>
            {pending ? "Judging…" : "Answer"}
          </button>
        </form>
      )}

      {verdict === "wrong" && (
        <p className="t-small t-rubric mt-4">
          Not so{tries > 1 ? ` — ${tries} tries` : ""}. Read the passage above again; there is no penalty for trying.
        </p>
      )}
      {error && <p className="t-small t-rubric mt-4">{error}</p>}

      {q.hint && !answered && (
        <div className="mt-4">
          {showHint ? (
            <p className="margin-note">{q.hint}</p>
          ) : (
            <button type="button" className="ink-btn ink-btn--plain t-caps" onClick={() => setShowHint(true)}>
              A hint in the margin
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

export default function QuestPage() {
  const { slug } = useParams();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { status, hunter, refresh } = useHunter();
  const [quest, setQuest] = useState(null);
  const [error, setError] = useState(null);
  const [answeredIds, setAnsweredIds] = useState(null); // live set once the hunter starts answering
  const [discharged, setDischarged] = useState(null); // { xp } when completed during this visit

  useEffect(() => {
    if (!isLoaded) return;
    let dropped = false;
    api(`/api/quests/${slug}`, { getToken: isSignedIn ? getToken : undefined })
      .then((q) => {
        if (!dropped) setQuest(q);
      })
      .catch((err) => {
        if (!dropped) setError(err.status === 404 ? "No quest of that name is written in the journal." : err.message);
      });
    return () => {
      dropped = true;
    };
  }, [slug, isLoaded, isSignedIn, getToken]);

  if (error) {
    return (
      <div className="leaf leaf--lit" style={{ padding: "2.5rem" }}>
        <p className="t-eyebrow">The keeper checks the journal twice</p>
        <h1 className="t-chapter mt-3 mb-6">{error}</h1>
        <Link to="/quests" className="ink-btn">Back to the quest journal</Link>
      </div>
    );
  }
  if (!quest) {
    return (
      <div className="leaf" style={{ padding: "3rem", textAlign: "center" }}>
        <p className="t-entry">Unrolling the quest…</p>
      </div>
    );
  }

  const kingdom = kingdomById(quest.kingdom);
  const place = placeById(quest.place);
  const questions = quest.sections.filter((s) => s.type === "question");
  const answered = answeredIds ?? new Set(questions.filter((s) => s.answered).map((s) => s.id));
  const done = discharged || quest.status === "completed";
  const locked = quest.status === "locked";
  const canAnswer = status === "ready" && !locked;
  const seal = alignmentById(hunter?.alignment)?.seal;

  const onJudged = (result) => {
    setAnsweredIds(new Set(result.answered));
    if (result.completed && result.xp_awarded > 0) {
      setDischarged({ xp: result.xp_awarded });
      refresh();
    }
  };

  // Questions are numbered in the order they are set into the lesson.
  const numberOf = new Map(questions.map((q, i) => [q.id, i + 1]));

  return (
    <div className="mx-auto" style={{ maxWidth: "58rem" }}>
      <Link to="/quests" className="t-caps" style={{ color: "var(--rubric)" }}>← The quest journal</Link>

      <header className="mt-6 mb-10">
        <p className="t-eyebrow">
          {kingdom?.name}
          {place && ` · ${place.name}`}
        </p>
        <h1 className="t-folio mt-3 mb-5">{quest.title}</h1>
        <Fleuron width={190} />

        <div className="flex flex-wrap items-start gap-x-12 gap-y-5 mt-8">
          <div>
            <span className="t-caps label-gap">Difficulty</span>
            <Stars value={quest.difficulty} />
            <span className="t-caps block mt-1.5">{DIFFICULTY_WORD[quest.difficulty]}</span>
          </div>
          <div>
            <span className="t-caps label-gap">Reward</span>
            <span className="t-figure" style={{ fontSize: "1.2rem" }}>{quest.xp} XP</span>
          </div>
          {quest.minutes && (
            <div>
              <span className="t-caps label-gap">Reckoned at</span>
              <span className="t-body">{quest.minutes} minutes</span>
            </div>
          )}
          <div>
            <span className="t-caps label-gap">Questions answered</span>
            <span className="t-roman" style={{ fontSize: "1rem" }}>
              {answered.size ? roman(answered.size) : "—"} of {roman(questions.length)}
            </span>
          </div>
        </div>

        <p className="t-lead column mt-8" style={{ fontStyle: "italic" }}>{quest.summary}</p>
      </header>

      {locked && (
        <div className="leaf leaf--aged mb-10" style={{ padding: "1.6rem 1.8rem" }}>
          <p className="flex items-center gap-3 t-entry"><LockMark size={20} /> This quest is still locked</p>
          <p className="t-small mt-3">Discharge the quests on the road before it first. You can read the lesson meanwhile.</p>
        </div>
      )}
      {status === "unregistered" && (
        <div className="leaf leaf--aged mb-10" style={{ padding: "1.6rem 1.8rem" }}>
          <p className="t-entry">Sign the register to have your answers kept.</p>
          <Link to="/register" className="ink-btn ink-btn--filled mt-5">Sign the register</Link>
        </div>
      )}

      <div className="quest-body">
        {quest.sections.map((s, i) => {
          if (s.type === "text") return <Manuscript key={i}>{s.markdown}</Manuscript>;
          return (
            <QuestionBox
              key={s.id}
              q={{ ...s, answered: answered.has(s.id) }}
              number={numberOf.get(s.id)}
              slug={quest.slug}
              canAnswer={canAnswer}
              onJudged={onJudged}
            />
          );
        })}
      </div>

      {done && (
        <div className="leaf leaf--chapter mt-14" style={{ padding: "2.4rem 2.2rem" }}>
          <div className="flex flex-wrap items-center gap-8">
            <Seal size={92} color={seal} label="Quest discharged" />
            <div className="flex-1" style={{ minWidth: "15rem" }}>
              <p className="t-eyebrow">Quest discharged</p>
              <h2 className="t-chapter mt-2">{quest.title}</h2>
              <p className="t-body mt-3">
                {discharged ? (
                  <>Entered in the register: <span className="t-figure">+{discharged.xp} XP</span>.</>
                ) : (
                  "You discharged this quest before. Read it again as often as you like."
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/quests" className="ink-btn ink-btn--filled">The next quest</Link>
              <Stamp tone="green" pressed>Sealed</Stamp>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
