import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";
import { Fleuron, RuleHead, Seal, Mark, CheckMark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { api } from "../api";
import { useHunter } from "../hunter-context";
import { ALIGNMENTS, KINGDOMS } from "../data/realm";

/* ==========================================================================
   SIGNING THE REGISTER — the first thing a new hunter does
   ==========================================================================
   Four articles on one sheet: a name, an alignment (the class — any of the
   nine, it is only who you say you are), the kingdoms you mean to walk, and
   the two articles of the oath every hunter swears. Signing creates the
   hunter; from then on the book keeps their progress.
   ========================================================================== */

const OATH = [
  "I shall test only the ground a keeper has declared open, and stop at the boundary as it is written.",
  "I shall take proof enough to be believed, and not one record more.",
];

function Article({ no, title, children, gloss }) {
  return (
    <section className="mt-2">
      <RuleHead no={no}>{title}</RuleHead>
      {gloss && <p className="t-small column-wide mb-6">{gloss}</p>}
      {children}
    </section>
  );
}

export default function RegisterPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { status, setHunter } = useHunter();
  const navigate = useNavigate();

  const [name, setName] = useState(null); // null = not yet typed; falls back to Clerk's first name
  const [alignment, setAlignment] = useState(null);
  const [kingdoms, setKingdoms] = useState(["web"]);
  const [sworn, setSworn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  if (status === "ready") return <Navigate to="/" replace />;

  if (status === "anon") {
    return (
      <div className="leaf leaf--ruled quire mx-auto" style={{ maxWidth: "36rem" }}>
        <div className="leaf-field text-center">
          <p className="t-eyebrow">The register of the guild</p>
          <h1 className="t-chapter mt-3">Sign in before you sign</h1>
          <Fleuron width={150} className="ornament--center" />
          <p className="t-body column mx-auto">The register is kept against your account, so your progress follows you.</p>
          <SignInButton mode="modal">
            <button type="button" className="ink-btn ink-btn--filled mt-8">Sign in</button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="leaf" style={{ padding: "3rem", textAlign: "center" }}>
        <p className="t-entry">The clerk is opening the register…</p>
      </div>
    );
  }

  const shownName = name ?? user?.firstName ?? "";
  const ready = shownName.trim().length >= 2 && alignment && kingdoms.length > 0 && sworn;

  const toggleKingdom = (id) =>
    setKingdoms((current) => (current.includes(id) ? current.filter((k) => k !== id) : [...current, id]));

  const sign = async () => {
    setPending(true);
    setError(null);
    try {
      const hunter = await api("/api/hunter/register", {
        getToken,
        method: "POST",
        body: { name: shownName.trim(), alignment, kingdoms, oath: sworn },
      });
      setHunter(hunter);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  };

  const picked = ALIGNMENTS.find((a) => a.id === alignment);

  return (
    <div className="mx-auto" style={{ maxWidth: "62rem" }}>
      <div className="quire">
        <article className="leaf leaf--chapter leaf--ruled" style={{ position: "relative" }}>
          <span className="ribbon">First page</span>
          <div className="leaf-field" style={{ paddingTop: "3.2rem" }}>
            <p className="t-eyebrow">The register of the guild</p>
            <h1 className="t-folio mt-3 mb-5">Sign the Register</h1>
            <Fleuron width={200} />
            <p className="t-lead column mt-8">
              Four articles, one page. Once your name is written here the book keeps everything
              you do: every answer, every quest discharged, every seal.
            </p>

            {status === "error" && (
              <p className="t-small t-rubric mt-6">
                The register did not answer just now. You can still fill in the page; signing will try again.
              </p>
            )}

            <Article no={1} title="Your name">
              <label className="block" style={{ maxWidth: "26rem" }}>
                <span className="t-caps label-gap">As it will be written in the book</span>
                <input
                  className="field-input"
                  value={shownName}
                  maxLength={40}
                  placeholder="the name you hunt under"
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            </Article>

            <Article
              no={2}
              title="Your alignment"
              gloss="Choose the one you recognise yourself in. It changes nothing you can do — it is who you say you are, and it gives you your seal. You can change it whenever you like."
            >
              <div className="choice-grid" role="radiogroup" aria-label="Alignment">
                {ALIGNMENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={alignment === a.id}
                    onClick={() => setAlignment(a.id)}
                    className={`choice ${alignment === a.id ? "is-picked" : ""}`}
                  >
                    <span className="flex items-center gap-3">
                      <Seal size={34} color={a.seal} label={`${a.en} seal`} />
                      <span>
                        <span className="t-minor block">{a.archetype}</span>
                        <span className="t-caps block">{a.en}</span>
                      </span>
                    </span>
                    <span className="t-small block mt-3" style={{ fontStyle: "italic" }}>{a.note}</span>
                  </button>
                ))}
              </div>
            </Article>

            <Article
              no={3}
              title="The kingdoms you will walk"
              gloss="Every road a bug bounty hunter can take. Follow as many as you like; each keeps its own grade on your sheet."
            >
              <div className="choice-grid" role="group" aria-label="Kingdoms">
                {KINGDOMS.map((k) => {
                  const on = kingdoms.includes(k.id);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleKingdom(k.id)}
                      className={`choice ${on ? "is-picked" : ""}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3">
                          <span style={{ color: "var(--ink-strong)" }}><Mark name={k.mark} size={30} /></span>
                          <span>
                            <span className="t-minor block">{k.name}</span>
                            <span className="t-caps block">{k.real}</span>
                          </span>
                        </span>
                        {on && <span className="t-done"><CheckMark size={18} /></span>}
                      </span>
                      <span className="t-small block mt-3">{k.gloss}</span>
                    </button>
                  );
                })}
              </div>
            </Article>

            <Article no={4} title="The oath">
              <ol className="flex flex-col gap-4 mb-7">
                {OATH.map((line, i) => (
                  <li key={line} className="flex gap-4 items-baseline">
                    <span className="t-roman" style={{ minWidth: "2.4rem", fontSize: "0.8rem" }}>{roman(i + 1)}</span>
                    <span className="t-lead" style={{ fontStyle: "italic" }}>{line}</span>
                  </li>
                ))}
              </ol>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={sworn} onChange={(e) => setSworn(e.target.checked)} className="oath-check" />
                <span className="t-caps" style={{ color: "var(--ink-strong)" }}>I swear it</span>
              </label>
            </Article>

            <hr className="rule rule--double" />

            <div className="flex flex-wrap items-center gap-6">
              {picked ? (
                <Seal size={64} color={picked.seal} label={`${picked.en} seal`} />
              ) : (
                <Seal size={64} broken label="No alignment chosen yet" />
              )}
              <div className="flex-1" style={{ minWidth: "14rem" }}>
                <p className="t-entry">{shownName.trim() || "Your name"}</p>
                <p className="t-hand mt-1">
                  {picked ? `${picked.archetype} · ${picked.en}` : "no alignment chosen yet"}
                </p>
              </div>
              <button type="button" className="ink-btn ink-btn--filled" disabled={!ready || pending} onClick={sign}>
                {pending ? "Pressing the seal…" : "Sign & seal"}
              </button>
            </div>

            {!ready && (
              <p className="t-caps mt-5">
                {!alignment ? "Choose an alignment" : !kingdoms.length ? "Choose at least one kingdom" : !sworn ? "Swear the oath" : "Write your name"}
              </p>
            )}
            {error && <pre className="typed mt-5">{error}</pre>}

            <p className="t-small mt-8">
              Not ready to sign? <Link to="/" className="ink-link">Look around the survey first.</Link>
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
