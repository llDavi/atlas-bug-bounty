import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser, useAuth, SignInButton } from "@clerk/clerk-react";
import { RuleHead, Stamp, Fleuron, Mark, Seal, Leader, CheckMark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ==========================================================================
   THE GUILD OATH — a charter, sworn and sealed
   ========================================================================== */

const GRANTS = [
  {
    mark: "tome",
    title: "Every field journal, unsealed",
    text: "The whole survey, the turn, the chain, the proof and the filed account of every hunt in the archive.",
  },
  {
    mark: "hydra",
    title: "The sealed plates of the bestiary",
    text: "The marsh hydra, the hollow crown and the bound worm — their spoor and their wards, written out in full.",
  },
  {
    mark: "lantern",
    title: "The barred ground",
    text: "The marshes, the counting house, the well of Stonewatch and the dungeon beneath the mountains.",
  },
  {
    mark: "raven",
    title: "Word from the registry",
    text: "Hunters already on the ground, reports resolved, how fast a keeper answers, and word when a scope widens.",
  },
];

const ARTICLES = [
  "I shall test only the ground a keeper has declared open, and stop at the boundary as it is written.",
  "I shall take proof enough to be believed, and not one record more.",
  "I shall write the account so the repair is plain to somebody who was not there.",
  "I shall sell nothing that I find, to anybody, at any price.",
];

export default function OathPage() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const sworn = user?.publicMetadata?.is_pro === true;

  const swear = async (plan) => {
    setPending(plan);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error("The clerk could not open the ledger.");
      const data = await res.json();
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setPending(null);
    }
  };

  if (sworn) {
    return (
      <div className="leaf leaf--ruled quire">
        <div className="leaf-field text-center">
          <div className="flex justify-center"><Seal size={96} label="Sworn" /></div>
          <h1 className="t-title text-4xl mt-5 mb-2">You are sworn to the guild.</h1>
          <Fleuron width={170} className="ornament--center" />
          <p className="column mx-auto">
            Every seal in this book is broken for you: the sealed folios of the archive, the
            barred plates of the bestiary, and the four grounds nobody walks unsworn.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link to="/journals" className="ink-btn ink-btn--filled">Open the archive</Link>
            <Link to="/dungeons" className="ink-btn">Descend somewhere new</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="leaf leaf--ruled quire">
        <div className="leaf-field">
          <div className="text-center">
            <p className="t-caps">Charter of the guild · to be read before signing</p>
            <h1 className="t-title text-4xl sm:text-5xl mt-2">The Guild Oath</h1>
            <Fleuron width={190} className="ornament--center" />
            <p className="column mx-auto text-[1.05rem]">
              The survey stays open to everybody who walks in off the road. What the guild keeps
              for its sworn hunters is the hard-won half: how each hunt actually went, and where
              to point the lantern next.
            </p>
          </div>

          <hr className="rule rule--double" />

          <div className="spread">
            <div>
              <p className="t-caps mb-3">The articles</p>
              <ol className="flex flex-col gap-3">
                {ARTICLES.map((a, i) => (
                  <li key={a} className="flex gap-4 items-baseline">
                    <span className="t-roman text-[0.8rem]" style={{ minWidth: "2.2rem" }}>{roman(i + 1)}</span>
                    <span className="text-[1.05rem]" style={{ fontStyle: "italic" }}>{a}</span>
                  </li>
                ))}
              </ol>
              <p className="margin-note mt-5">
                the fourth article is the one the guild exists for
              </p>
            </div>
            <aside className="flex flex-col items-center">
              <Seal size={104} broken label="The seal, as yet unbroken" />
              <p className="t-caps mt-3 text-center">Unsigned</p>
              <p className="t-hand mt-2 text-center" style={{ fontSize: "1rem" }}>
                sign below and the wax is pressed
              </p>
            </aside>
          </div>
        </div>
      </div>

      <RuleHead>What the oath grants</RuleHead>

      <div className="flex flex-col">
        {GRANTS.map((g, i) => (
          <article key={g.title} className="entry" style={{ paddingTop: i === 0 ? 0 : undefined }}>
            <div className="flex items-start gap-5">
              <span style={{ color: "var(--ink-strong)" }}><Mark name={g.mark} size={44} /></span>
              <div className="flex-1">
                <p className="t-caps">Grant {roman(i + 1)}</p>
                <h3 className="t-title text-2xl mt-0.5 mb-1">{g.title}</h3>
                <p className="column-wide t-soft">{g.text}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <RuleHead>Terms of swearing</RuleHead>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="leaf leaf--lit" style={{ padding: "1.8rem" }}>
          <p className="t-caps">By the month</p>
          <p className="t-title text-4xl mt-1">€8.99</p>
          <p className="t-soft mb-4">the month · leave at any month&rsquo;s end</p>
          <div className="flex flex-col gap-1 mb-5">
            <Leader label="Archive unsealed" value="Yes" />
            <Leader label="Barred ground" value="Yes" />
            <Leader label="Registry word" value="Yes" />
            <Leader label="Bound for" value="One month" />
          </div>
          {isSignedIn ? (
            <button type="button" className="ink-btn w-full" onClick={() => swear("monthly")} disabled={!!pending}>
              {pending === "monthly" ? "Opening the ledger…" : "Swear by the month"}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button type="button" className="ink-btn w-full">Sign the register first</button>
            </SignInButton>
          )}
        </div>

        <div className="leaf leaf--aged" style={{ padding: "1.8rem" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="t-caps">By the year</p>
              <p className="t-title text-4xl mt-1">€89</p>
              <p className="t-soft mb-4">the year · two moons given</p>
            </div>
            <Stamp tone="rubric" pressed>Best terms</Stamp>
          </div>
          <div className="flex flex-col gap-1 mb-5">
            <Leader label="Archive unsealed" value="Yes" />
            <Leader label="Barred ground" value="Yes" />
            <Leader label="Registry word" value="Yes" />
            <Leader label="Bound for" value="One year" />
          </div>
          {isSignedIn ? (
            <button
              type="button"
              className="ink-btn ink-btn--filled w-full"
              onClick={() => swear("yearly")}
              disabled={!!pending}
            >
              {pending === "yearly" ? "Opening the ledger…" : "Swear by the year"}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button type="button" className="ink-btn ink-btn--filled w-full">Sign the register first</button>
            </SignInButton>
          )}
        </div>
      </div>

      {error && (
        <div className="leaf mt-6" style={{ padding: "1.2rem" }}>
          <p className="t-caps t-rubric">The clerk shakes their head</p>
          <pre className="typed mt-2">{error}</pre>
        </div>
      )}

      <div className="flex flex-col items-center mt-12">
        <Fleuron width={150} />
        <p className="t-caps mt-3 flex items-center gap-2">
          <CheckMark size={14} /> The survey, the quest journal and the first plates stay free
        </p>
      </div>
    </>
  );
}
