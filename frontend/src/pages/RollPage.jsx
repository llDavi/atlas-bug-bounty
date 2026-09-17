import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { PageHead, RuleHead, Stamp, Fleuron, Seal } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { api } from "../api";
import { rankOf } from "../data/journal";
import { KINGDOMS, alignmentById, kingdomById } from "../data/realm";

/* ==========================================================================
   THE ROLL OF HUNTERS — real standing, from the register
   ==========================================================================
   One roll for the whole guild, and one for each kingdom. The first three
   are cut into the stone above the door; everyone else is copied into the
   ruled register beneath. Open to visitors: only register names are shown.
   ========================================================================== */

function StonePlate({ rows }) {
  return (
    <div className="plate" style={{ padding: "2rem 1.8rem" }}>
      <span className="t-caps label-gap" style={{ color: "var(--plate-ink)", opacity: 0.7 }}>Cut into the stone above the door</span>
      <ol className="flex flex-col gap-5 mt-4">
        {rows.map((h) => {
          const alignment = alignmentById(h.alignment);
          return (
            <li key={h.place} className="flex items-center gap-5">
              <span className="t-roman" style={{ color: "var(--plate-ink)", minWidth: "2.4rem", fontSize: "1rem" }}>{roman(h.place)}</span>
              <Seal size={34} color={alignment?.seal} label={alignment?.en} />
              <span className="flex-1">
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
  );
}

export default function RollPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [kingdom, setKingdom] = useState(null);
  const [fetched, setFetched] = useState(null); // { kingdom, rows } | { kingdom, error }

  useEffect(() => {
    if (!isLoaded) return;
    let dropped = false;
    api(`/api/roll${kingdom ? `?kingdom=${kingdom}` : ""}`, { getToken: isSignedIn ? getToken : undefined })
      .then((rows) => {
        if (!dropped) setFetched({ kingdom, rows });
      })
      .catch((err) => {
        if (!dropped) setFetched({ kingdom, error: err.message });
      });
    return () => {
      dropped = true;
    };
  }, [kingdom, isLoaded, isSignedIn, getToken]);

  const current = fetched && fetched.kingdom === kingdom ? fetched : null;
  const rows = current?.rows;
  const you = rows?.find((h) => h.is_you);
  const k = kingdom ? kingdomById(kingdom) : null;

  return (
    <>
      <PageHead
        folio={7}
        standing="The seventh folio"
        title="The Roll of Hunters"
        gloss="Standing is cut for quests discharged, never for pages read. One roll for the whole guild, and one for each kingdom."
      />

      <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-2" aria-label="Which roll">
        {[null, ...KINGDOMS.map((x) => x.id)].map((id) => (
          <button
            key={id || "all"}
            type="button"
            onClick={() => setKingdom(id)}
            className="t-caps"
            style={{
              color: id === kingdom ? "var(--rubric)" : "var(--ink-soft)",
              borderBottom: `1px solid ${id === kingdom ? "var(--rubric)" : "transparent"}`,
              paddingBottom: "3px",
            }}
          >
            {id ? kingdomById(id).name : "The whole guild"}
          </button>
        ))}
      </nav>

      {!current && (
        <div className="leaf mt-10" style={{ padding: "3rem", textAlign: "center" }}>
          <p className="t-entry">The clerk is copying the roll…</p>
        </div>
      )}

      {current?.error && (
        <div className="leaf mt-10" style={{ padding: "2.4rem" }}>
          <p className="t-eyebrow">The roll is shut</p>
          <p className="t-entry mt-3">The register did not answer.</p>
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="leaf leaf--aged mt-10" style={{ padding: "2.6rem 2.4rem" }}>
          <p className="t-entry">No name is cut {k ? `in ${k.name}` : "into the stone"} yet.</p>
          <p className="t-small mt-3">The first hunter to discharge a quest heads the roll.</p>
          <Link to="/" className="ink-btn ink-btn--filled mt-8">Begin</Link>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <RuleHead no={1}>{k ? `The first of ${k.name}` : "The first of the guild"}</RuleHead>
          <div className="spread">
            <StonePlate rows={rows.slice(0, 3)} />
            <aside>
              {you ? (
                <div className="slip slip--marked flex flex-col gap-5">
                  <div>
                    <span className="t-eyebrow label-gap">Your line in the roll</span>
                    <p className="t-entry">{you.name}</p>
                    <p className="t-hand mt-1">{rankOf(you.xp).rank.title}</p>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <span className="t-caps label-gap">Place</span>
                      <span className="t-chapter" style={{ fontSize: "1.9rem" }}>{roman(you.place)}</span>
                    </div>
                    <div className="text-right">
                      <span className="t-caps label-gap">Experience</span>
                      <span className="t-figure">{you.xp.toLocaleString("en-US")} XP</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="slip">
                  <span className="t-caps label-gap">Your line in the roll</span>
                  <p className="t-small">
                    {isSignedIn ? "Discharge a quest in this kingdom to be copied into it." : "Sign the register and your name is copied into the roll."}
                  </p>
                </div>
              )}
            </aside>
          </div>

          <RuleHead no={2}>The register, in full</RuleHead>
          <div className="overflow-x-auto">
            <table className="ledger">
              <thead>
                <tr>
                  <th style={{ width: "3.6rem" }}>Place</th>
                  <th>Hunter</th>
                  <th>Rank</th>
                  <th style={{ width: "8rem" }}>{k ? "XP here" : "Experience"}</th>
                  <th style={{ width: "6rem" }}>Quests</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => {
                  const alignment = alignmentById(h.alignment);
                  const { level, rank } = rankOf(h.xp);
                  return (
                    <tr key={h.place} className={h.is_you ? "is-you" : ""}>
                      <td className="ledger-num">{roman(h.place)}</td>
                      <td>
                        <span className="flex items-center gap-3">
                          <Seal size={26} color={alignment?.seal} label={alignment?.en} />
                          <span>
                            <span className="t-minor">{h.name}</span>
                            {h.is_you && <Stamp tone="rubric" className="ml-2">You</Stamp>}
                            <span className="block t-caps mt-0.5">{alignment?.archetype}</span>
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="t-caps">{rank.title}</span>
                        <span className="block t-small">Level {roman(level)}</span>
                      </td>
                      <td className="t-tech">{h.xp.toLocaleString("en-US")}</td>
                      <td className="ledger-num">{h.quests ? roman(h.quests) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex flex-col items-center mt-16">
        <Fleuron width={150} />
        <p className="t-caps mt-4">The stone has room for more names</p>
      </div>
    </>
  );
}
