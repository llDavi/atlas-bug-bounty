import { Link, useLocation } from "react-router-dom";
import { useUser, useClerk, SignInButton } from "@clerk/clerk-react";
import { HUNTER, rankOf } from "../../data/journal";
import { roman } from "../../utils/numerals";
import { useLamp } from "../../lamp";

/* ==========================================================================
   The Codex kit — every mark on every page is drawn from here.
   Nothing in this file may use a gradient, a glow or a rounded corner.
   ========================================================================== */

/* ----------------------------------------------------------- ornaments */

/* A printer's fleuron. Hand-cut, so the two halves aren't identical. */
export function Fleuron({ width = 132, className = "" }) {
  return (
    <svg
      viewBox="0 0 132 16"
      width={width}
      height={(width / 132) * 16}
      className={`ornament ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <path d="M2 8h38" />
      <path d="M40 8c4-6 9-6 12-2s-1 8-5 7-5-5-2-7 8-1 11 2" />
      <path d="M66 2c3 3 3 8 0 12-3-4-3-9 0-12Z" />
      <path d="M92 8c-4-6-9-6-12-2s1 8 5 7 5-5 2-7-8-1-11 2" />
      <path d="M92 8h38" />
      <circle cx="66" cy="8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* A heading set into a broken rule. */
export function RuleHead({ children, no, quiet = false, className = "" }) {
  return (
    <div className={`rule-head ${quiet ? "rule-head--quiet" : ""} ${className}`}>
      <span>
        {no != null && <span className="sec-no">§ {roman(no)}</span>}
        {children}
      </span>
    </div>
  );
}

/* The head of a page: standing, title, gloss. Reads like a chapter opening. */
export function PageHead({ folio, standing, title, gloss, hand }) {
  return (
    <header className="mb-8">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        {standing && <p className="t-eyebrow">{standing}</p>}
        {folio && <p className="t-caps t-faint">Folio {roman(folio)}</p>}
      </div>
      <h1 className="t-folio mb-3">{title}</h1>
      <Fleuron width={150} />
      {gloss && <p className="mt-4 column-wide t-lead">{gloss}</p>}
      {hand && <p className="margin-note mt-4" style={{ maxWidth: "28rem" }}>{hand}</p>}
    </header>
  );
}

/* ------------------------------------------------------------- surfaces */

export function Leaf({ children, tone = "", ruled = false, quire = false, className = "", fieldClass = "" }) {
  const tones = { lit: "leaf--lit", aged: "leaf--aged" };
  const body = ruled ? <div className={`leaf-field ${fieldClass}`}>{children}</div> : children;
  const leaf = (
    <div className={`leaf ${tones[tone] || ""} ${ruled ? "leaf--ruled" : ""} ${className}`}>
      {body}
    </div>
  );
  return quire ? <div className="quire">{leaf}</div> : leaf;
}

export function Slip({ children, className = "" }) {
  return <div className={`slip ${className}`}>{children}</div>;
}

export function Plate({ children, className = "" }) {
  return <div className={`plate ${className}`}>{children}</div>;
}

/* --------------------------------------------------------------- marks */

export function Stamp({ children, tone = "", pressed = false, className = "" }) {
  const tones = {
    rubric: "stamp--rubric",
    green: "stamp--green",
    gold: "stamp--gold",
    faint: "stamp--faint",
  };
  return (
    <span className={`stamp ${tones[tone] || ""} ${pressed ? "stamp--pressed" : ""} ${className}`}>
      {children}
    </span>
  );
}

/* A wax seal. Broken means the oath was never sworn — or is spent. */
export function Seal({ size = 62, broken = false, label = "", children }) {
  return (
    <span
      className={`seal ${broken ? "seal--broken" : ""}`}
      style={{ width: size, height: size }}
      aria-label={label || undefined}
    >
      {children || (
        <svg viewBox="0 0 40 40" width={size * 0.56} height={size * 0.56} fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <circle cx="20" cy="20" r="14" />
          <path d="M20 7v26M7 20h26" />
          <path d="M13 13l14 14M27 13 13 27" strokeWidth="0.8" />
        </svg>
      )}
    </span>
  );
}

export function Stars({ value, of = 5 }) {
  return (
    <span className="stars" aria-label={`${value} of ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < value ? "" : "dim"}>
          {i < value ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export function Pips({ value, of = 10 }) {
  return (
    <span className="pips" aria-label={`${value} of ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={`pip ${i < value ? "pip--full" : ""}`} />
      ))}
    </span>
  );
}

/* An apothecary's measure — ticked cells, no bar fill, no glow. */
export function Measure({ pct, cells = 16, rubric = false }) {
  const full = Math.round((pct / 100) * cells);
  return (
    <div className={`measure ${rubric ? "measure--rubric" : ""}`} role="img" aria-label={`${pct}% filled`}>
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} className={`measure-cell ${i < full ? "measure-cell--full" : ""}`} />
      ))}
    </div>
  );
}

/* "HTTP ........ Mastered" */
export function Leader({ label, value, struck = false }) {
  return (
    <div className="leader">
      <span className={struck ? "struck" : ""}>{label}</span>
      <span className="leader-fill" />
      <span className="leader-value">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------- engraved icons
   Line engravings. Every one is drawn open-stroke, with a slightly uneven
   hand — none of them are icon-font pictograms. */

const MARKS = {
  serpent: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M6 30c6 2 9-2 8-6s-6-4-7-8 4-8 10-8 12 5 12 12" />
      <path d="M29 20c3 1 5 4 5 7" />
      <path d="M31 8c2-1 4 0 4 2s-2 3-4 2" />
      <circle cx="32.5" cy="9.6" r="0.8" fill="currentColor" stroke="none" />
      <path d="M33 13l3 3" strokeWidth="1" />
    </svg>
  ),
  gate: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M8 34V14c0-5 5-8 12-8s12 3 12 8v20" />
      <path d="M20 6v28M8 20h24M8 27h24" strokeWidth="0.9" />
      <path d="M14 34v-4h4v4M22 34v-4h4v4" strokeWidth="0.9" />
      <circle cx="24" cy="22" r="1.4" />
    </svg>
  ),
  raven: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M4 26c8 2 12-4 14-10 1-4 5-6 9-5 3 1 5 4 4 7" />
      <path d="M31 18c-2 8-9 14-18 14" />
      <path d="M31 12l5 1-4 3" />
      <circle cx="29" cy="12.5" r="0.8" fill="currentColor" stroke="none" />
      <path d="M18 22c3 4 8 6 13 6" strokeWidth="0.9" />
    </svg>
  ),
  hydra: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M8 34c-1-8 3-12 6-16 2-3 1-7-2-8" />
      <path d="M20 34c0-10 2-14 2-20 0-3-2-5-4-5" />
      <path d="M32 34c1-8-2-13-4-17-1-3 0-6 3-7" />
      <circle cx="11" cy="9" r="2.4" />
      <circle cx="18" cy="7" r="2.4" />
      <circle cx="30" cy="9" r="2.4" />
      <path d="M6 36h28" strokeWidth="0.9" />
    </svg>
  ),
  mirror: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M20 4c7 0 12 6 12 13s-5 13-12 13S8 24 8 17 13 4 20 4Z" />
      <path d="M20 30v6M14 36h12" />
      <path d="M14 18c1-5 4-8 8-9" strokeWidth="0.9" />
    </svg>
  ),
  worm: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M6 12c4-4 9-2 10 2s-3 7-7 7 8 3 12 6 5 8 2 9" />
      <path d="M28 30c4-1 7-5 6-9s-5-6-9-5" strokeWidth="0.9" />
      <circle cx="8" cy="11" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  signpost: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M18 36V6" />
      <path d="M18 10h14l-4 4H18M18 19H6l4 4h8" />
      <path d="M12 36h12" strokeWidth="0.9" />
    </svg>
  ),
  key: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <circle cx="13" cy="13" r="7" />
      <circle cx="13" cy="13" r="2.4" strokeWidth="0.9" />
      <path d="M18 18l16 16" />
      <path d="M27 27l4-4M31 31l4-4" />
    </svg>
  ),
  quill: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M6 34c4-14 14-24 28-28-2 14-11 24-24 27" />
      <path d="M12 28c5-6 10-10 16-12" strokeWidth="0.9" />
      <path d="M4 36l6-2" />
    </svg>
  ),
  lantern: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M14 12h12l3 18H11l3-18Z" />
      <path d="M16 12V9a4 4 0 0 1 8 0v3" />
      <path d="M11 30h18M20 17v8" strokeWidth="0.9" />
      <path d="M20 5V2" />
    </svg>
  ),
  tome: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M6 8c5-2 10-2 14 1 4-3 9-3 14-1v24c-5-2-10-2-14 1-4-3-9-3-14-1V8Z" />
      <path d="M20 9v24" strokeWidth="0.9" />
      <path d="M9 14h7M9 19h7M24 14h7M24 19h7" strokeWidth="0.7" />
    </svg>
  ),
  crown: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M6 28 8 12l6 7 6-11 6 11 6-7 2 16H6Z" />
      <path d="M6 32h28" strokeWidth="0.9" />
    </svg>
  ),
  chain: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <rect x="5" y="16" width="14" height="9" rx="4.5" />
      <rect x="21" y="16" width="14" height="9" rx="4.5" />
      <path d="M17 20.5h6" />
    </svg>
  ),
  eye: (p) => (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...p}>
      <path d="M4 20c5-8 10-12 16-12s11 4 16 12c-5 8-10 12-16 12S9 28 4 20Z" />
      <circle cx="20" cy="20" r="5" />
      <circle cx="20" cy="20" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export function Mark({ name, size = 26, className = "", style }) {
  const draw = MARKS[name] || MARKS.eye;
  return draw({ width: size, height: size, className, style, "aria-hidden": "true" });
}

export function LockMark({ size = 16, ...p }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true" {...p}>
      <rect x="5" y="11" width="14" height="9" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  );
}

export function CheckMark({ size = 16, ...p }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" {...p}>
      <path d="M4 13l5 5L20 6" />
    </svg>
  );
}

/* The guild device: a compass rose over a quill. Used as the mark of the codex. */
export function Device({ size = 30, className = "" }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="20" cy="20" r="14.5" />
      <circle cx="20" cy="20" r="10.5" strokeWidth="0.7" />
      <path d="M20 3.5 23 17l13.5 3L23 23l-3 13.5L17 23 3.5 20 17 17 20 3.5Z" />
      <circle cx="20" cy="20" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* The candle beside the book: lit for night, snuffed for day. */
export function Candle({ lit, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M9 21h6M10 21v-9h4v9" />
      <path d="M9.4 12h5.2" strokeWidth="1" />
      {lit ? (
        <path d="M12 11c2.2-1.4 2.6-3.4 1.2-5.2C12.4 4.7 12 3.9 12 3c-1.6 1.4-3 3-3 4.8 0 1.5 1 2.6 3 3.2Z" className="flame" fill="currentColor" fillOpacity="0.25" />
      ) : (
        <path d="M12 11V8" strokeWidth="1" />
      )}
    </svg>
  );
}

export function LampToggle() {
  const { night, toggle } = useLamp();
  return (
    <button
      type="button"
      onClick={toggle}
      className="lamp-btn"
      title={night ? "Read by daylight" : "Read by candlelight"}
      aria-label={night ? "Read by daylight" : "Read by candlelight"}
    >
      <Candle lit={night} />
      {night ? "Daylight" : "Candle"}
    </button>
  );
}

/* ------------------------------------------------------ book navigation */

const CHAPTERS = [
  { label: "The Map", to: "/" },
  { label: "Quests", to: "/quests" },
  { label: "Dungeons", to: "/dungeons" },
  { label: "Bestiary", to: "/bestiary" },
  { label: "Field Journals", to: "/journals" },
  { label: "Registry", to: "/registry" },
  { label: "Character", to: "/character" },
  { label: "The Roll", to: "/roll" },
];

export function CodexHeader() {
  const { pathname } = useLocation();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { level, rank, next, pct } = rankOf(HUNTER.xp);
  const sworn = user?.publicMetadata?.is_pro === true;

  const here = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="codex-head">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-5 pb-3">
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <Link to="/" className="flex items-center gap-3">
            <Device size={34} style={{ color: "var(--ink-strong)" }} />
            <span>
              <span className="t-title block text-xl leading-none">The Hunter&rsquo;s Codex</span>
              <span className="t-caps block mt-1" style={{ letterSpacing: "0.3em" }}>
                Of Bounties &amp; Broken Gates
              </span>
            </span>
          </Link>

          {isSignedIn ? (
            <div className="flex items-end gap-4">
              <LampToggle />
              <Link to="/character" className="text-right">
                <span className="t-title block text-[1.05rem] leading-tight">
                  {user?.firstName || HUNTER.name}
                </span>
                <span className="t-caps block">
                  {rank.title} · Lvl {level}
                  {sworn && " · Sworn"}
                </span>
              </Link>
              <button type="button" onClick={() => signOut()} className="ink-btn ink-btn--small">
                Close the book
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <LampToggle />
              <SignInButton mode="modal">
                <button type="button" className="ink-btn ink-btn--small">
                  Sign the register
                </button>
              </SignInButton>
            </div>
          )}
        </div>

        <hr className="rule rule--tight" />

        <div className="flex items-center gap-x-5 gap-y-2 flex-wrap">
          <nav className="codex-nav flex-1" style={{ minWidth: 0 }}>
            {CHAPTERS.map((c) => (
              <Link key={c.to} to={c.to} className={here(c.to) ? "is-here" : ""}>
                {c.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto sm:justify-end">
            <span className="t-caps">XP</span>
            <span style={{ width: 84 }}>
              <Measure pct={pct} cells={8} />
            </span>
            <span className="t-tech t-soft">
              {HUNTER.xp.toLocaleString("en-US")}/{(next?.xpReq ?? HUNTER.xp).toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Colophon() {
  return (
    <footer className="colophon mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-8" style={{ paddingBlock: "2rem" }}>
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div style={{ maxWidth: "26rem" }}>
          <p className="t-caps">Colophon</p>
          <p className="mt-2">
            Copied, glossed and corrected in the hand of many hunters. Every account herein was
            taken from a disclosed report; nothing was invented for effect.
          </p>
        </div>
        <nav className="flex flex-col gap-1.5">
          {[
            ["The Charter", "/charter"],
            ["Questions put to the keeper", "/questions"],
            ["The Guild Oath", "/oath"],
          ].map(([label, to]) => (
            <Link key={to} to={to} className="t-caps">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <hr className="rule rule--tight" />
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <p className="t-tech t-faint">Atlas · anno {new Date().getFullYear()}</p>
        <Device size={22} style={{ color: "var(--ink-faint)" }} />
      </div>
      </div>
    </footer>
  );
}
