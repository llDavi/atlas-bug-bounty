import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHead, RuleHead, Stamp, Stars, Mark, Fleuron, Leader } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { BEASTS, DIFFICULTY_WORD } from "../data/journal";
import { placeById } from "../data/world";
import { useHunter } from "../hunter-context";
import { useQuests } from "../useQuests";
import { deriveSheet } from "../data/progress";

/* ==========================================================================
   THE BESTIARY
   ==========================================================================
   Vulnerability classes, entered as beasts: what it is, where it nests, how
   it is recognised in the field, and the ward against it. Open to visitors.
   Standing is shown only to a hunter, and only as their own record gives it;
   a plate whose account is not yet written says so plainly.
   ========================================================================== */

const STANDING_TONE = { Mastered: "gold", Advanced: "green", Practised: "green", "Not yet met": "faint" };

/* discipline id → the hunter's standing in it, or null for a visitor */
function useStandings() {
  const { status, hunter } = useHunter();
  const { quests } = useQuests();
  return useMemo(() => {
    if (status !== "ready" || !quests) return null;
    const { skills } = deriveSheet(quests, new Set(hunter.completed_quests));
    return Object.fromEntries(skills.map((s) => [s.id, s.standing]));
  }, [status, hunter, quests]);
}

function BeastEntry({ b, number, standing }) {
  const drawn = Boolean(b.spoor);
  const place = placeById(b.place);

  return (
    <article className="entry">
      <div className="spread spread--margin-left">
        <aside className="order-2 lg:order-1">
          <div className="flex flex-col items-center lg:items-start">
            <span style={{ color: drawn ? "var(--ink-strong)" : "var(--ink-faint)" }}>
              <Mark name={b.mark} size={78} />
            </span>
            <p className="t-caps mt-4">Plate {roman(number)}</p>
            <p className="t-hand mt-1">{b.order}</p>
          </div>

          <hr className="rule rule--tight" />

          <div className="flex flex-col">
            <Leader label="Grade" value={DIFFICULTY_WORD[b.difficulty]} />
            {standing && <Leader label="Your standing" value={standing} />}
          </div>

          {place && (
            <p className="mt-4">
              <span className="t-caps label-gap">Nests at</span>
              <span className="t-body">{place.name}</span>
            </p>
          )}
        </aside>

        <div className={`order-1 lg:order-2 ${drawn ? "" : "entry--obscured"}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="t-chapter">{b.name}</h2>
            <div className="flex items-center gap-4">
              <Stars value={b.difficulty} />
              {!drawn ? (
                <Stamp tone="faint">Still being drawn</Stamp>
              ) : (
                standing && <Stamp tone={STANDING_TONE[standing]} pressed={standing === "Mastered"}>{standing}</Stamp>
              )}
            </div>
          </div>

          <p className="t-lead column-wide mt-5" style={{ fontStyle: "italic" }}>{b.habitat}</p>

          {drawn ? (
            <>
              <span className="t-caps label-gap mt-8">Recognised by</span>
              <p className="t-body column-wide">{b.spoor}</p>

              <span className="t-caps label-gap mt-6">The ward against it</span>
              <p className="t-body column-wide">{b.ward}</p>

              <span className="t-caps label-gap mt-6">Proof, as copied from a report</span>
              <pre className="typed column-wide">{b.proof}</pre>

              <div className="flex flex-wrap gap-4 mt-8">
                <Link to="/journals" className="ink-btn ink-btn--filled">Accounts of this beast</Link>
                {place && <Link to={`/quests?place=${place.id}`} className="ink-btn">Quests on that ground</Link>}
              </div>
            </>
          ) : (
            <p className="t-small column-wide mt-6">
              This plate is still being drawn from the accounts. Its spoor, its ward and a proof
              copied from a real report will be entered in the next edition of the codex.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function BestiaryPage() {
  const standings = useStandings();
  const drawn = BEASTS.filter((b) => b.spoor).length;

  return (
    <>
      <PageHead
        folio={4}
        standing="The fourth folio"
        title="A Bestiary of Flaws"
        gloss="Knowing that a beast is called SSRF has never found one. Knowing that some keeps run errands on a stranger's word — that finds them. Each plate is drawn from a beast somebody actually met."
        hand={`${drawn} plates drawn · ${BEASTS.length - drawn} still being drawn`}
      />

      <RuleHead no={1}>Index of plates</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
        {BEASTS.map((b, i) => (
          <a key={b.slug} href={`#beast-${b.slug}`}>
            <Leader
              label={`${roman(i + 1)}. ${b.name}`}
              value={!b.spoor ? "Being drawn" : standings ? standings[b.slug] ?? "Not yet met" : b.order.split(" · ")[0]}
            />
          </a>
        ))}
      </div>

      <RuleHead no={2}>The plates</RuleHead>
      <div className="flex flex-col">
        {BEASTS.map((b, i) => (
          <div key={b.slug} id={`beast-${b.slug}`}>
            <BeastEntry b={b} number={i + 1} standing={standings ? standings[b.slug] ?? "Not yet met" : null} />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center mt-16">
        <Fleuron width={160} />
        <p className="t-caps mt-4">Here the bestiary ends, for now</p>
      </div>
    </>
  );
}
