import { Link } from "react-router-dom";
import { PageHead, RuleHead, Fleuron, Leader, Mark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";

/* ==========================================================================
   THE CHARTER — what this book is, and what it refuses to be
   ========================================================================== */

const REFUSALS = [
  ["We do not hand over the answer", "Knowing a beast is called SSRF has never found one. Every quest is worded so you must ask what the builder assumed."],
  ["We do not invent accounts", "Every field journal began as a publicly disclosed report, and is credited to the hunter who wrote it."],
  ["We do not rank by reward", "The registry grades ground by how approachable it actually is: scope, competition, the barrier of the stack, and how well the keeper answers."],
  ["We do not teach trespass", "The first article of the oath is the boundary, and the second is restraint in proof. Both are the work, not a disclaimer."],
];

export default function CharterPage() {
  return (
    <div className="mx-auto" style={{ maxWidth: "52rem" }}>
      <PageHead
        folio={1}
        standing="Prefatory folio"
        title="The Charter"
        gloss="Set down at the front of the book, so that anybody copying it later knows what it was for."
      />

      <div className="leaf leaf--ruled quire">
        <div className="leaf-field">
          <p className="dropcap text-[1.06rem]">
            This is a place to learn bug bounty hunting by doing it, in a world drawn as a world:
            the ground is a realm, the flaws are beasts that nest in it, the exercises are dungeons
            you go down into, and your own progress is a sheet kept in your hand. The metaphor is
            not decoration — it is how the material is organised, because a hunter who knows the
            realm needs nobody to point at the flaw.
          </p>

          <p className="mt-4 column-wide">
            Alongside the survey, the guild keeps a register of live contracts copied from
            HackerOne, Bugcrowd, Intigriti, YesWeHack, Immunefi and Sherlock, graded by how
            approachable each one actually is.
          </p>

          <hr className="rule rule--double" />

          <RuleHead>What the guild refuses</RuleHead>

          <div className="flex flex-col gap-5">
            {REFUSALS.map(([title, text], i) => (
              <div key={title} className="flex gap-4 items-baseline">
                <span className="t-roman text-[0.8rem]" style={{ minWidth: "2.2rem" }}>{roman(i + 1)}</span>
                <div>
                  <h3 className="t-title text-xl">{title}</h3>
                  <p className="t-soft">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className="rule rule--double" />

          <RuleHead>The state of the book</RuleHead>

          <div className="spread">
            <div className="flex flex-col gap-1">
              <Leader label="The survey of the realm" value="Drawn" />
              <Leader label="The quest journal" value="Being written" />
              <Leader label="The dungeons" value="Three of six open" />
              <Leader label="The bestiary" value="Eight plates" />
              <Leader label="The registry" value="Recopied daily" />
              <Leader label="Ranks & experience" value="Taking shape" />
            </div>
            <aside>
              <p className="margin-note">
                the guild is young — expect the walls to move while you are inside them
              </p>
              <div className="flex justify-center mt-5" style={{ color: "var(--ink-faint)" }}>
                <Mark name="tome" size={40} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mt-10">
        <Fleuron width={150} />
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <Link to="/questions" className="ink-btn">Questions put to the keeper</Link>
          <Link to="/" className="ink-btn">The survey</Link>
        </div>
      </div>
    </div>
  );
}
