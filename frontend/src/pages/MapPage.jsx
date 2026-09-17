import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SignInButton, useAuth } from "@clerk/clerk-react";
import WorldAtlas from "../components/ms/WorldAtlas";
import { Fleuron, RuleHead, Measure, Seal } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { rankOf } from "../data/journal";
import { api } from "../api";
import { useHunter } from "../hunter-context";
import { useQuests } from "../useQuests";
import { ALIGNMENTS, alignmentById, kingdomById } from "../data/realm";

/* ==========================================================================
   THE FIRST FOLIO — the desk
   ==========================================================================
   Five descending tiers, each announced by the surface it sits on:

     the opening   an aged band across the head of the folio
     § I  survey   the pinned sheet
     § II quest    the one .leaf--chapter on the page, ribboned in rubric
     § III index   a ruled register, the ground you stand on marked
     § IV dungeons plain entries, ruled off
     § V  oath     a quiet aged leaf, sealed

   Spacing follows one rule: a label stands clear of what it introduces
   (.label-gap), a group stands clear of the next group, and no line of
   prose runs past the measure (.column / .column-wide, set in characters).
   ========================================================================== */

function Figure({ label, children }) {
  return (
    <div>
      <span className="t-caps label-gap">{label}</span>
      {children}
    </div>
  );
}

/* The card a visitor meets: an invitation to begin, not an empty form.
   Three seals hint at the choice waiting on the other side of the login. */
function UnsignedPage({ status }) {
  const teaser = ["lawful-good", "chaotic-good", "chaotic-neutral"].map(alignmentById);
  const begin = <span>Begin your adventure</span>;

  return (
    <div className="slip slip--marked flex flex-col gap-5">
      <div>
        <p className="t-eyebrow label-gap">Your adventure awaits</p>
        <p className="t-entry">Your tale is not yet written</p>
      </div>

      <p className="t-small">
        Sign the register and step onto the road. Choose who you are — paladin, rebel or
        rogue of the realm — press your seal in wax, and pick the kingdoms you mean to walk.
        From then on, every quest you finish is written here in your own hand.
      </p>

      <div className="flex items-center gap-3">
        {teaser.map((a) => (
          <Seal key={a.id} size={34} color={a.seal} label={a.archetype} />
        ))}
        <span className="t-hand">which will be yours?</span>
      </div>

      {status === "unregistered" ? (
        <Link to="/register" className="ink-btn ink-btn--filled w-full">{begin}</Link>
      ) : status === "anon" ? (
        <SignInButton mode="modal">
          <button type="button" className="ink-btn ink-btn--filled w-full">{begin}</button>
        </SignInButton>
      ) : (
        <p className="t-caps">The clerk is fetching your page…</p>
      )}

      <p className="margin-note">the first road starts at Wanderer&rsquo;s Rest — it is safe</p>
    </div>
  );
}

function Standing() {
  const { status, hunter } = useHunter();
  if (status !== "ready") return <UnsignedPage status={status} />;

  const { level, rank, next, pct } = rankOf(hunter.xp);
  const alignment = alignmentById(hunter.alignment);

  return (
    <div className="slip slip--marked flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="t-eyebrow label-gap">Kept by</p>
          <p className="t-entry">{hunter.name}</p>
          <p className="t-hand mt-1">{alignment?.archetype}</p>
        </div>
        <Seal size={46} color={alignment?.seal} label={alignment?.en} />
      </div>

      <div className="flex items-end justify-between gap-4">
        <Figure label="Level">
          <span className="t-chapter" style={{ fontSize: "2rem" }}>{roman(level)}</span>
        </Figure>
        <div className="text-right">
          <span className="t-caps label-gap">Rank</span>
          <span className="t-minor">{rank.title}</span>
        </div>
      </div>

      <div>
        <Measure pct={pct} cells={14} rubric />
        <p className="t-tech t-faint mt-2.5">
          {hunter.xp.toLocaleString("en-US")} / {(next?.xpReq ?? hunter.xp).toLocaleString("en-US")} XP
        </p>
        <p className="t-caps mt-1">
          {next ? `${(next.xpReq - hunter.xp).toLocaleString("en-US")} to ${next.title}` : "The road ends here"}
        </p>
      </div>

      <div>
        <span className="t-caps label-gap">Kingdoms followed</span>
        <div className="flex flex-col">
          {hunter.kingdoms.map((k) => (
            <div key={k} className="leader">
              <span>{kingdomById(k)?.name}</span>
              <span className="leader-fill" />
              <span className="leader-value">Grade {roman(rankOf(hunter.kingdom_xp[k] || 0).level)}</span>
            </div>
          ))}
        </div>
      </div>

      <Link to="/character" className="ink-btn ink-btn--small w-full">
        The character sheet
      </Link>
    </div>
  );
}

function Opening() {
  return (
    <section
      className="leaf leaf--aged"
      style={{ borderWidth: "0 0 3px", borderBottomColor: "var(--rule-strong)" }}
    >
      <div className="px-5 sm:px-10" style={{ paddingBlock: "3.4rem" }}>
        <div className="spread">
          <div>
            <p className="t-eyebrow">Being the first folio of</p>
            <h1 className="t-folio mt-3 mb-5" style={{ maxWidth: "20ch" }}>
              The Hunter&rsquo;s Codex
            </h1>
            <Fleuron width={200} />

            <p className="dropcap t-lead mt-8 column">
              Herein is set down the whole survey of the known world, five kingdoms as walked by
              the hunters of this guild and corrected after each account: the roads that are safe,
              the gates that no longer ask who is knocking, and the ground from which nobody has
              yet returned with a report worth reading.
            </p>

            <div className="prose-flow mt-6 column">
              <p className="t-body t-soft">
                Learn the realm and you will not need to be told where the flaw is — you will
                already know which houses keep their records in the open.
              </p>
              <p className="t-body t-soft">
                Nothing in this book was invented for effect. Every account began as a disclosed
                report, and every ward at the foot of a page is the repair its keeper actually made.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-10">
              <Link to="/quests" className="ink-btn ink-btn--filled">Take up a quest</Link>
              <Link to="/dungeons" className="ink-btn">Go down a dungeon</Link>
            </div>
            <p className="t-caps mt-5">or touch a kingdom on the map below</p>
          </div>

          <aside>
            <Standing />
          </aside>
        </div>
      </div>
    </section>
  );
}

function Survey({ quests }) {
  return (
    <section>
      <RuleHead no={1}>The known world</RuleHead>
      <WorldAtlas quests={quests} />
    </section>
  );
}

/* The nine classes, set as a manuscript table. Choosing one is the hunter's
   own business, so all nine are shown as equals; a signed hunter's own class
   is marked "Yours". */
function Classes() {
  const { status, hunter } = useHunter();
  const mine = status === "ready" ? hunter?.alignment : null;

  return (
    <section>
      <RuleHead no={2}>The classes</RuleHead>
      <p className="t-body">
        Your class is how you see the work — from the paladin who never steps out of scope to the
        destroyer who burns it down. It changes nothing but the seal you press in wax: all nine are
        yours to take, and you may change your mind later.
      </p>

      <div className="class-grid mt-8">
        {ALIGNMENTS.map((a) => (
          <article key={a.id} className={`class-cell ${mine === a.id ? "is-mine" : ""}`}>
            <div className="flex items-center gap-3">
              <Seal size={38} color={a.seal} label={a.en} />
              <div style={{ minWidth: 0 }}>
                <h3 className="t-entry">{a.archetype}</h3>
                <p className="t-caps">{a.en}</p>
              </div>
              {mine === a.id && <span className="t-caps t-rubric" style={{ marginLeft: "auto" }}>Yours</span>}
            </div>
            <p className="t-small mt-3">{a.note}</p>
          </article>
        ))}
      </div>

      {!mine && (
        <p className="t-caps mt-6">
          {status === "unregistered" ? (
            <Link to="/register" className="t-rubric">Choose your class in the register →</Link>
          ) : status === "anon" ? (
            "Sign the register to press your own seal."
          ) : null}
        </p>
      )}
    </section>
  );
}

/* A glance at the roll of hunters: the first three names cut in stone, and a
   way through to the whole register. Open to visitors — register names only. */
function RollTop() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    if (!isLoaded) return;
    let dropped = false;
    api("/api/roll", { getToken: isSignedIn ? getToken : undefined })
      .then((rows) => !dropped && setState({ status: "ready", rows: rows.slice(0, 3) }))
      .catch(() => !dropped && setState({ status: "error" }));
    return () => { dropped = true; };
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <section>
      <RuleHead no={3}>The roll of hunters</RuleHead>
      <p className="t-body">
        Every hunter who signs the register is written into the roll, ranked by the experience they
        have earned. The first three names are cut into the stone above the guild door.
      </p>

      {state.status === "ready" && state.rows.length > 0 ? (
        <div className="plate mt-6" style={{ padding: "1.9rem 1.8rem" }}>
          <ol className="flex flex-col gap-5">
            {state.rows.map((h) => {
              const alignment = alignmentById(h.alignment);
              return (
                <li key={h.place} className="flex items-center gap-5">
                  <span className="t-roman" style={{ color: "var(--plate-ink)", minWidth: "2.4rem", fontSize: "1rem" }}>{roman(h.place)}</span>
                  <Seal size={34} color={alignment?.seal} label={alignment?.en} />
                  <span className="flex-1" style={{ minWidth: 0 }}>
                    <span className="t-entry block" style={{ color: "var(--plate-ink)" }}>{h.name}</span>
                    <span className="t-caps block mt-1" style={{ color: "var(--plate-ink)", opacity: 0.65 }}>
                      {rankOf(h.xp).rank.title} · {alignment?.archetype}
                    </span>
                  </span>
                  <span className="t-tech" style={{ color: "var(--plate-ink)" }}>{h.xp.toLocaleString("en-US")} XP</span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : state.status === "loading" ? (
        <div className="leaf leaf--aged mt-6" style={{ padding: "1.8rem" }}>
          <p className="t-caps">The clerk is reading the register…</p>
        </div>
      ) : (
        <div className="leaf leaf--aged mt-6" style={{ padding: "2.2rem" }}>
          <p className="t-entry">The stone above the door is still blank.</p>
          <p className="t-small mt-3">No name has been earned onto the roll yet. Sign the register and it could be yours.</p>
        </div>
      )}

      <div className="mt-8">
        <Link to="/roll" className="ink-btn">The whole roll</Link>
      </div>
    </section>
  );
}

function OathFoot() {
  return (
    <section>
      <RuleHead no={4}>The guild oath</RuleHead>
      <div className="leaf leaf--aged" style={{ padding: "2.6rem 2.4rem" }}>
        <div className="flex flex-wrap items-center gap-10">
          <Seal size={84} label="The guild seal" />
          <div style={{ flex: 1, minWidth: "17rem" }}>
            <p className="t-eyebrow">The sealed field journals</p>
            <h3 className="t-entry mt-2">The whole account of every hunt</h3>
            <p className="t-small column mt-3">
              Every hunter can read the opening of each field journal. The full account — the survey,
              the turn, the chain and the report as it was paid for — is kept for hunters who swear
              the oath.
            </p>
          </div>
          <Link to="/oath" className="ink-btn ink-btn--rubric">Read the oath</Link>
        </div>
      </div>
    </section>
  );
}

export default function MapPage() {
  const { quests } = useQuests();
  return (
    <>
      <Opening />
      <Survey quests={quests} />
      <Classes />
      <RollTop />
      <OathFoot />
    </>
  );
}
