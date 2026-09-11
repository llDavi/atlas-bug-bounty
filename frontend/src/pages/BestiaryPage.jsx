import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { PageHead, RuleHead, Stamp, Stars, Mark, Fleuron, Leader } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { BEASTS, MASTERY, DIFFICULTY_WORD } from "../data/journal";
import { placeById } from "../data/world";

/* ==========================================================================
   THE BESTIARY
   ==========================================================================
   Vulnerability classes, entered as beasts: what it is, where it nests, how
   it is recognised in the field, and the ward against it. Each entry is an
   illuminated page — engraving in the margin, gloss beneath.
   ========================================================================== */

function BeastEntry({ b, sworn }) {
  const sealed = b.mastery === "sealed" && !sworn;
  const place = placeById(b.place);
  const mastery = MASTERY[b.mastery] || MASTERY.read;

  return (
    <article className="entry">
      <div className="spread spread--margin-left">
        <aside className="order-2 lg:order-1">
          <div className="flex flex-col items-center lg:items-start">
            <span style={{ color: sealed ? "var(--ink-faint)" : "var(--ink-strong)" }}>
              <Mark name={b.mark} size={78} />
            </span>
            <p className="t-caps mt-3">Plate {roman(BEASTS.indexOf(b) + 1)}</p>
            <p className="t-hand mt-1" style={{ fontSize: "1rem" }}>{b.order}</p>
          </div>

          <hr className="rule rule--tight" />

          <div className="flex flex-col gap-1">
            <Leader label="Standing" value={mastery.label} />
            <Leader label="Reward" value={`${b.reward} XP`} />
            <Leader label="Grade" value={DIFFICULTY_WORD[b.difficulty]} />
          </div>

          {place && (
            <p className="mt-3">
              <span className="t-caps">Nests at </span>
              <Link to={`/quests?place=${place.id}`} className="ink-link text-[0.95rem]">{place.name}</Link>
            </p>
          )}
        </aside>

        <div className={`order-1 lg:order-2 ${sealed ? "entry--obscured" : ""}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="t-title text-3xl sm:text-4xl">{b.name}</h2>
            <div className="flex items-center gap-3">
              <Stars value={b.difficulty} />
              <Stamp tone={mastery.tone} pressed={b.mastery === "mastered"}>{mastery.label}</Stamp>
            </div>
          </div>

          <p className="mt-3 text-[1.05rem] column-wide" style={{ fontStyle: "italic" }}>{b.habitat}</p>

          <hr className="rule rule--tight" />

          <p className="t-caps mb-1.5">Recognised by</p>
          <p className="column-wide mb-4">{sealed ? "Kept from the unsworn." : b.spoor}</p>

          <p className="t-caps mb-1.5">The ward against it</p>
          <p className="column-wide mb-4">{sealed ? "Kept from the unsworn." : b.ward}</p>

          <p className="t-caps mb-1.5">Proof, as copied from a report</p>
          <pre className={`typed ${sealed ? "typed--redacted" : ""}`}>
            {sealed ? "████████  ███████████  ██████" : b.proof}
          </pre>

          <div className="flex flex-wrap gap-3 mt-5">
            {sealed ? (
              <Link to="/oath" className="ink-btn ink-btn--rubric">Break the seal</Link>
            ) : (
              <>
                <Link to="/journals" className="ink-btn ink-btn--filled">Accounts of this beast</Link>
                {place && <Link to={`/quests?place=${place.id}`} className="ink-btn">Quests on that ground</Link>}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BestiaryPage() {
  const { user } = useUser();
  const sworn = user?.publicMetadata?.is_pro === true;
  const sealedCount = BEASTS.filter((b) => b.mastery === "sealed").length;

  return (
    <>
      <PageHead
        folio={4}
        standing="The fourth folio"
        title="A Bestiary of Flaws"
        gloss="Knowing that a beast is called SSRF has never found one. Knowing that some keeps run errands on a stranger's word — that finds them. Each plate below is drawn from a beast somebody actually met."
        hand={`${BEASTS.length} plates · ${sworn ? "none sealed to you" : `${sealedCount} sealed`}`}
      />

      <RuleHead>Index of plates</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-1 mb-10">
        {BEASTS.map((b, i) => (
          <a key={b.slug} href={`#beast-${b.slug}`}>
            <Leader
              label={`${roman(i + 1)}. ${b.name}`}
              value={(MASTERY[b.mastery] || MASTERY.read).label}
              struck={b.mastery === "mastered"}
            />
          </a>
        ))}
      </div>

      <hr className="rule rule--double" />

      <div className="flex flex-col">
        {BEASTS.map((b) => (
          <span key={b.slug} id={`beast-${b.slug}`}>
            <BeastEntry b={b} sworn={sworn} />
          </span>
        ))}
      </div>

      <div className="flex flex-col items-center mt-12">
        <Fleuron width={160} />
        <p className="t-caps mt-3">Here the bestiary ends</p>
        <p className="margin-note mt-3 text-center">
          more plates are being copied — the marshes alone will take a season
        </p>
      </div>
    </>
  );
}
