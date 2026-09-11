import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useUser, useAuth, SignInButton } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RuleHead, Stamp, Stars, Fleuron, Mark, Seal, Leader } from "../components/ms/Codex";
import { markForClass } from "../utils/marks";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const GRADE = {
  easy: { word: "Novice", stars: 1 },
  medium: { word: "Journeyman", stars: 3 },
  hard: { word: "Expert", stars: 5 },
};

/* ==========================================================================
   ONE FIELD JOURNAL — a hunter's own account, copied whole
   ========================================================================== */

/* Markdown is rendered as manuscript: ruled headings, typewritten
   transcripts, glosses in the margin hand. */
const marks = {
  h1: ({ children }) => <h2 className="t-title text-3xl mt-8 mb-2">{children}</h2>,
  h2: ({ children }) => (
    <>
      <div className="rule-head"><span>{children}</span></div>
    </>
  ),
  h3: ({ children }) => <h3 className="t-title text-xl mt-6 mb-1">{children}</h3>,
  p: ({ children }) => <p className="mb-4 text-[1.05rem] column-wide">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 flex flex-col gap-1.5 column-wide">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 flex flex-col gap-1.5 column-wide">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-3 items-baseline">
      <span style={{ color: "var(--gold-leaf)" }}>✦</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong style={{ fontWeight: 600, color: "var(--ink-strong)" }}>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="ink-link">{children}</a>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="t-tech" style={{ background: "var(--paper-lit)", padding: "0.1em 0.3em", border: "1px solid var(--rule-soft)" }}>
        {children}
      </code>
    ) : (
      <code>{children}</code>
    ),
  pre: ({ children }) => <pre className="typed mb-5">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="margin-note my-5" style={{ transform: "none", borderLeft: "2px solid var(--rubric)", paddingLeft: "0.9rem" }}>
      {children}
    </blockquote>
  ),
  hr: () => <hr className="rule rule--double" />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-5">
      <table className="ledger">{children}</table>
    </div>
  ),
};

function SealedFolio({ isSignedIn }) {
  return (
    <div className="leaf leaf--aged" style={{ padding: "2.4rem 2rem" }}>
      <div className="flex flex-wrap items-start gap-8">
        <div className="flex flex-col items-center">
          <Seal size={104} label="The folio is sealed" />
          <p className="t-caps mt-3">Sealed</p>
        </div>
        <div className="flex-1" style={{ minWidth: "17rem" }}>
          <p className="t-caps t-rubric">The archivist sets the folio down unopened</p>
          <h2 className="t-title text-3xl mt-2 mb-3">This account is kept for sworn hunters.</h2>
          <p className="column mb-4">
            Beneath the seal: the whole survey of the ground, the moment the hunter understood
            what the builder had assumed, the chain as it was actually walked, the proof they
            stopped at, and the account exactly as it was written and paid for.
          </p>
          <div className="flex flex-col gap-1 mb-5" style={{ maxWidth: "26rem" }}>
            <Leader label="The survey, in full" value="Sealed" />
            <Leader label="The turn" value="Sealed" />
            <Leader label="The chain" value="Sealed" />
            <Leader label="The proof" value="Sealed" />
            <Leader label="The account as filed" value="Sealed" />
          </div>
          {isSignedIn ? (
            <Link to="/oath" className="ink-btn ink-btn--rubric">Swear the guild oath</Link>
          ) : (
            <SignInButton mode="modal">
              <button type="button" className="ink-btn ink-btn--rubric">Sign the register first</button>
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const { slug } = useParams();
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const sworn = user?.publicMetadata?.is_pro === true;

  const [meta, setMeta] = useState(null);
  const [body, setBody] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState(null);

  /* Whether the folio is still being read is derived, not stored: it is true
     for a sworn hunter from the moment the request goes out until the body
     or an error comes back. */
  const loadingBody = sworn && !body && !error;

  useEffect(() => {
    fetch(`${API_URL}/api/walkthroughs`)
      .then((r) => r.json())
      .then((list) => {
        const found = Array.isArray(list) ? list.find((w) => w.slug === slug) : null;
        if (!found) setError("No account of that name is bound in this archive.");
        else setMeta(found);
      })
      .catch(() => setError("Nobody answers at the archive door."))
      .finally(() => setLoadingMeta(false));
  }, [slug]);

  useEffect(() => {
    if (!isLoaded || !sworn || !slug) return;
    let dropped = false;
    getToken().then((token) => {
      if (dropped) return;
      if (!token) {
        setError("The register could not confirm your name — reload the page.");
        return;
      }
      fetch(`${API_URL}/api/walkthroughs/${slug}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => {
          if (!r.ok) return r.json().then((e) => { throw new Error(e.detail || r.status); });
          return r.json();
        })
        .then((data) => { if (!dropped) setBody(data.body); })
        .catch((e) => { if (!dropped) setError(`The folio would not open: ${e.message}`); });
    });
    return () => { dropped = true; };
  }, [isLoaded, sworn, slug, getToken]);

  if (loadingMeta) {
    return (
      <div className="leaf" style={{ padding: "2.5rem", textAlign: "center" }}>
        <p className="t-title text-2xl">The archivist is fetching the folio…</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="leaf leaf--lit" style={{ padding: "2.5rem" }}>
        <p className="t-caps t-rubric">The archivist checks the shelf twice</p>
        <h1 className="t-title text-3xl mt-2 mb-4">{error || "Not bound here."}</h1>
        <Link to="/journals" className="ink-btn">Back to the field journals</Link>
      </div>
    );
  }

  const g = GRADE[meta.difficulty] || GRADE.hard;

  return (
    <>
      <Link to="/journals" className="t-caps" style={{ color: "var(--rubric)" }}>
        ← Field journals
      </Link>

      <header className="mt-4 mb-8">
        <div className="flex items-start gap-4">
          <span style={{ color: "var(--ink-strong)" }}>
            <Mark name={markForClass(meta.vuln_class)} size={54} />
          </span>
          <div className="flex-1">
            <p className="t-caps">
              {meta.vuln_class} · {meta.program} · {meta.platform}
            </p>
            <h1 className="t-title text-4xl sm:text-5xl mt-1">{meta.title}</h1>
          </div>
        </div>
        <Fleuron width={180} className="mt-4" />
      </header>

      <div className="spread mb-2">
        <div>
          <p className="dropcap text-[1.08rem] column-wide">{meta.teaser}</p>

          <hr className="rule" />

          <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
            <span>
              <span className="t-caps block mb-1">Order of beast</span>
              <Link to="/bestiary" className="ink-link text-[1.05rem]">{meta.vuln_class}</Link>
            </span>
            <span>
              <span className="t-caps block mb-1">Ground</span>
              <span className="text-[1.05rem]">{meta.program}</span>
            </span>
            <span>
              <span className="t-caps block mb-1">Try it yourself</span>
              <Link to="/dungeons" className="ink-link text-[1.05rem]">Go down a dungeon</Link>
            </span>
          </div>

          <p className="margin-note mt-6">
            copied from the hunter&rsquo;s own journal — spelling and all
          </p>
        </div>
        <aside>
          <div className="slip">
            <p className="t-caps mb-2">Particulars of the hunt</p>
            <div className="flex flex-col gap-1">
              <Leader label="Paid" value={meta.bounty ? `$${meta.bounty.toLocaleString("en-US")}` : "—"} />
              <Leader label="Keeper" value={meta.program || "—"} />
              <Leader label="Platform" value={meta.platform || "—"} />
              <Leader label="Disclosed" value={meta.published_at || "—"} />
              <Leader label="Grade" value={g.word} />
            </div>
            <div className="mt-2"><Stars value={g.stars} /></div>
          </div>
          {meta.source_url && (
            <a href={meta.source_url} target="_blank" rel="noopener noreferrer" className="ink-btn ink-btn--small w-full mt-4">
              The original report ↗
            </a>
          )}
          {sworn && <Stamp tone="green" className="mt-4">Folio open to you</Stamp>}
        </aside>
      </div>

      <RuleHead>The account</RuleHead>

      {!sworn && <SealedFolio isSignedIn={isSignedIn} />}

      {sworn && loadingBody && (
        <div className="leaf" style={{ padding: "2.5rem", textAlign: "center" }}>
          <p className="t-title text-2xl">Reading the whole account…</p>
        </div>
      )}

      {sworn && error && !loadingBody && (
        <div className="leaf" style={{ padding: "2rem" }}>
          <p className="t-caps t-rubric">A tear in the folio</p>
          <pre className="typed mt-2">{error}</pre>
        </div>
      )}

      {sworn && body && !loadingBody && (
        <article className="leaf leaf--ruled quire">
          <div className="leaf-field">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={marks}>
              {body}
            </ReactMarkdown>
            <hr className="rule rule--double" />
            <p className="t-caps text-center">
              Here the account ends · copied faithfully from the hunter&rsquo;s journal
            </p>
          </div>
        </article>
      )}

      <div className="flex flex-col items-center mt-12">
        <Fleuron width={150} />
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <Link to="/journals" className="ink-btn">More accounts</Link>
          <Link to="/bestiary" className="ink-btn">The beast in question</Link>
          <Link to="/dungeons" className="ink-btn">Try it underground</Link>
        </div>
      </div>
    </>
  );
}
