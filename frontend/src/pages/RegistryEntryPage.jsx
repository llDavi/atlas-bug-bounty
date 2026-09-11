import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { RuleHead, Stamp, Stars, Fleuron, Mark, Seal, Leader, LockMark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { formatRelativeDate } from "../utils/date";

/* ==========================================================================
   ONE CONTRACT — copied onto a single sheet, sealed at the foot
   ========================================================================== */

const GRADE = {
  easy: { word: "Novice", stars: 1, tone: "green" },
  medium: { word: "Journeyman", stars: 3, tone: "" },
  hard: { word: "Expert", stars: 5, tone: "rubric" },
};

const PASSAGE = {
  ok: { word: "Open to you", tone: "green" },
  vpn: { word: "By veiled road only", tone: "gold" },
  blocked: { word: "Barred in your region", tone: "rubric" },
  unknown: { word: "Not recorded", tone: "faint" },
};

function markFor(type = "") {
  if (type === "smart_contract") return "chain";
  if (type === "mobile") return "mirror";
  if (type === "api") return "signpost";
  return "gate";
}

export default function RegistryEntryPage({ programs, loading }) {
  const { id } = useParams();
  const { user } = useUser();
  const sworn = user?.publicMetadata?.is_pro === true;
  const p = programs.find((x) => String(x.id) === String(id));

  if (loading) {
    return (
      <div className="leaf" style={{ padding: "2.5rem", textAlign: "center" }}>
        <p className="t-title text-2xl">The clerk is fetching the sheet…</p>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="leaf leaf--lit" style={{ padding: "2.5rem" }}>
        <p className="t-caps t-rubric">The clerk checks the register twice</p>
        <h1 className="t-title text-3xl mt-2 mb-4">No contract of that number is posted.</h1>
        <Link to="/registry" className="ink-btn">Back to the register</Link>
      </div>
    );
  }

  const g = GRADE[p.difficulty_band] || GRADE.hard;
  const pass = PASSAGE[p.geo_access] || PASSAGE.unknown;

  return (
    <>
      <Link to="/registry" className="t-caps" style={{ color: "var(--rubric)" }}>
        ← Registry of open contracts
      </Link>

      <div className="leaf leaf--ruled quire mt-4">
        <div className="leaf-field">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <span style={{ color: "var(--ink-strong)" }}>
                <Mark name={markFor(p.type)} size={46} />
              </span>
              <div>
                <p className="t-caps">
                  Posted by {p.platform}
                  {p.type && ` · ${String(p.type).replace("_", " ")}`}
                </p>
                <h1 className="t-title text-4xl mt-1">{p.name}</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="t-caps mb-1">Guild grade</p>
              <Stars value={g.stars} />
              <p className="t-caps mt-1">{g.word}</p>
            </div>
          </div>

          <hr className="rule" />

          <div className="spread">
            <div>
              <p className="t-caps mb-2">Particulars</p>
              <div className="flex flex-col gap-1 mb-6">
                <Leader
                  label="Reward at most"
                  value={p.payout_max ? `$${p.payout_max.toLocaleString("en-US")}` : "unlisted"}
                />
                <Leader
                  label="Guild reckoning"
                  value={p.rubric_score != null ? `${Math.round(p.rubric_score)} of 100` : "not scored"}
                />
                <Leader label="Passage" value={pass.word} />
                <Leader
                  label="Register touched"
                  value={p.updated_at ? formatRelativeDate(p.updated_at) : "not recorded"}
                />
              </div>

              <p className="t-caps mb-2">Ground &amp; stack</p>
              {p.stack_tags?.length ? (
                <div className="flex flex-wrap gap-2 mb-6">
                  {p.stack_tags.map((t) => (
                    <Stamp key={t}>{t}</Stamp>
                  ))}
                </div>
              ) : (
                <p className="t-soft mb-6">Not recorded by the platform.</p>
              )}

              <p className="t-caps mb-2">Ground declared in scope</p>
              {p.targets?.length ? (
                <ol className="flex flex-col">
                  {p.targets.map((t, i) => (
                    <li
                      key={t.identifier}
                      className="flex items-baseline gap-3 py-1.5"
                      style={{ borderBottom: "1px solid var(--rule-soft)" }}
                    >
                      <span className="ledger-num" style={{ minWidth: "2.4rem" }}>{roman(i + 1)}</span>
                      <span className="t-tech flex-1" style={{ overflowWrap: "anywhere" }}>{t.identifier}</span>
                      <Stamp tone="faint">{t.type}</Stamp>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="t-soft">
                  This platform keeps its scope behind a researcher&rsquo;s login. Read it there before
                  you touch anything.
                </p>
              )}
            </div>

            <aside>
              <div className="slip">
                <p className="t-caps mb-2">Before you accept</p>
                <p className="text-[0.95rem]">
                  Read the programme&rsquo;s own terms at the source. The guild copies what is posted and
                  vouches for nothing: scope, safe harbour and payment are between you and the keeper.
                </p>
              </div>

              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ink-btn ink-btn--filled w-full mt-4"
              >
                Accept at the source ↗
              </a>

              <div className="flex justify-center mt-6">
                <Seal size={72} label="Copied faithfully" />
              </div>
              <p className="t-caps text-center mt-2">Copied faithfully</p>
            </aside>
          </div>
        </div>
      </div>

      <RuleHead>Intelligence gathered by the guild</RuleHead>

      {sworn ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
          <Leader label="Hunters on this ground" value={p.stats?.participants ?? "—"} />
          <Leader label="Reports resolved" value={p.stats?.resolved_reports ?? "—"} />
          <Leader
            label="Keeper answers within"
            value={p.stats?.response_hours ? `${p.stats.response_hours} hours` : "—"}
          />
          <Leader label="Wall before the walls (WAF)" value={p.stats?.waf ?? "—"} />
        </div>
      ) : (
        <div className="leaf leaf--aged" style={{ padding: "1.8rem" }}>
          <div className="flex flex-wrap items-center gap-5">
            <span style={{ color: "var(--ink-soft)" }}><LockMark size={26} /></span>
            <p className="flex-1 column" style={{ minWidth: "16rem" }}>
              How many hunters already walk this ground, how many reports the keeper has resolved,
              how long they take to answer, and whether there is a wall before the walls — the
              guild records all four for its sworn members.
            </p>
            <Link to="/oath" className="ink-btn ink-btn--rubric">Swear the oath</Link>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center mt-12">
        <Fleuron width={150} />
        <Link to="/registry" className="ink-btn mt-4">Back to the register</Link>
      </div>
    </>
  );
}
