import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHead, Fleuron } from "../components/ms/Codex";
import { roman } from "../utils/numerals";

/* ==========================================================================
   QUESTIONS PUT TO THE KEEPER
   ==========================================================================
   Marginal questions in one hand, answered underneath in another.
   ========================================================================== */

const QUESTIONS = [
  {
    q: "What is this book?",
    a: "A survey of the Web Realm with the material of bug bounty hunting laid out as places in it: quests you accept, dungeons you descend, a bestiary of the flaws that nest there, and an archive of accounts by hunters who met them.",
  },
  {
    q: "Is it free?",
    a: "The survey, the quest journal, the open dungeons and the unsealed plates are free and stay free. The oath unseals the archive, the barred ground and the registry's own intelligence.",
  },
  {
    q: "Why does no quest say where the flaw is?",
    a: "Because no real contract says either. The point is the reflex of asking what the builder assumed here — not the recall of a vulnerability's name.",
  },
  {
    q: "Where do the field journals come from?",
    a: "Publicly disclosed reports, broken into the five chambers of the work: the survey of the ground, the turn, the chain, the proof, and the account as it was filed.",
  },
  {
    q: "How is a contract graded?",
    a: "By how approachable the ground actually is — the size of the declared scope, how many hunters already walk it, the barrier of the stack, and how well the keeper answers — instead of by the loudest advertised reward.",
  },
  {
    q: "What is experience for?",
    a: "It moves you along the road: Wanderer, Scout, Hunter, Ranger, Warden, Master of the Hunt. Reading a page earns none of it. Striking through a chamber, finding the flaw and writing the account earns all of it.",
  },
  {
    q: "Is any of this legal to practise?",
    a: "The dungeons are built for practice, and the first article of the oath is the boundary: test only ground a keeper has declared open, and stop at proof. The guild has no interest in hunters who cannot hold that line.",
  },
];

export default function QuestionsPage() {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto" style={{ maxWidth: "48rem" }}>
      <PageHead
        folio={8}
        standing="Marginal folio"
        title="Questions Put to the Keeper"
        gloss="Asked by hunters at the door, and answered here so the keeper need not answer them twice."
      />

      <div className="flex flex-col">
        {QUESTIONS.map((item, i) => {
          const shown = open === i;
          return (
            <div key={item.q} className="entry" style={{ paddingTop: i === 0 ? 0 : undefined }}>
              <button
                type="button"
                onClick={() => setOpen(shown ? -1 : i)}
                className="w-full text-left flex items-baseline gap-4"
              >
                <span className="t-roman text-[0.78rem]" style={{ minWidth: "2.2rem", color: "var(--ink-faint)" }}>
                  {roman(i + 1)}
                </span>
                <span className="t-title text-2xl flex-1">{item.q}</span>
                <span className="t-caps" style={{ color: shown ? "var(--rubric)" : "var(--ink-faint)" }}>
                  {shown ? "—" : "+"}
                </span>
              </button>
              {shown && (
                <p className="mt-3 column-wide text-[1.05rem]" style={{ marginLeft: "3.2rem" }}>
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center mt-10">
        <Fleuron width={150} />
        <p className="margin-note mt-3 text-center">put a new question to the keeper any time</p>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <Link to="/charter" className="ink-btn">The charter</Link>
          <Link to="/oath" className="ink-btn">The oath</Link>
        </div>
      </div>
    </div>
  );
}
