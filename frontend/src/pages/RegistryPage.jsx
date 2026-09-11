import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead, RuleHead, Stamp, Stars, Fleuron, Mark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { formatPayoutShort } from "../utils/format";

/* ==========================================================================
   THE REGISTRY OF OPEN CONTRACTS
   ==========================================================================
   Live bounty programmes, kept the way a guild keeps its contract book: one
   ruled register, ordered by how approachable the ground actually is — not
   by how loudly the reward is advertised.
   ========================================================================== */

const GRADE = {
  easy: { word: "Novice", stars: 1, tone: "green" },
  medium: { word: "Journeyman", stars: 3, tone: "" },
  hard: { word: "Expert", stars: 5, tone: "rubric" },
};

const PASSAGE = {
  ok: { word: "Open", tone: "green" },
  vpn: { word: "By veiled road", tone: "gold" },
  blocked: { word: "Barred in your region", tone: "rubric" },
  unknown: { word: "Not recorded", tone: "faint" },
};

function markFor(type = "") {
  if (type === "smart_contract") return "chain";
  if (type === "mobile") return "mirror";
  if (type === "api") return "signpost";
  return "gate";
}

export default function RegistryPage({ programs, loading, error, search, onSearchChange }) {
  const [platform, setPlatform] = useState("all");
  const [grade, setGrade] = useState("all");

  const platforms = useMemo(
    () => ["all", ...Array.from(new Set(programs.map((p) => p.platform).filter(Boolean))).sort()],
    [programs]
  );

  const shown = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    return programs.filter((p) => {
      if (platform !== "all" && p.platform !== platform) return false;
      if (grade !== "all" && p.difficulty_band !== grade) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.platform?.toLowerCase().includes(q) ||
        p.stack_tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [programs, search, platform, grade]);

  return (
    <>
      <PageHead
        folio={6}
        standing="The sixth folio"
        title="Registry of Open Contracts"
        gloss="Every contract posted in the wider world, copied into the guild's book as it is posted. The grade beside each is the guild's own reckoning of how approachable the ground is."
        hand="the loudest reward is rarely the kindest ground"
      />

      <div className="leaf leaf--lit mb-8" style={{ padding: "1.2rem 1.3rem" }}>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <label className="flex-1" style={{ minWidth: "15rem" }}>
            <span className="t-caps block mb-1">Search the register</span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="a name, a platform, a stack…"
              className="field-input"
            />
          </label>
          <label>
            <span className="t-caps block mb-1">Posted by</span>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="field-select">
              {platforms.map((p) => (
                <option key={p} value={p}>{p === "all" ? "Every platform" : p}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="t-caps block mb-1">Grade</span>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="field-select">
              <option value="all">Every grade</option>
              <option value="easy">Novice</option>
              <option value="medium">Journeyman</option>
              <option value="hard">Expert</option>
            </select>
          </label>
        </div>
      </div>

      {loading && (
        <div className="leaf" style={{ padding: "2.5rem", textAlign: "center" }}>
          <p className="t-title text-2xl">The clerk is still copying the register…</p>
          <p className="t-hand mt-2">it is a long book</p>
        </div>
      )}

      {error && !loading && (
        <div className="leaf" style={{ padding: "2.5rem" }}>
          <p className="t-caps t-rubric">The register is shut</p>
          <p className="t-title text-2xl mt-1 mb-2">The keeper of the book is not answering.</p>
          <pre className="typed">{error}</pre>
        </div>
      )}

      {!loading && !error && (
        <>
          <RuleHead>
            {shown.length ? `${shown.length} contracts posted` : "No contracts of that description"}
          </RuleHead>

          {shown.length === 0 ? (
            <div className="leaf leaf--lit" style={{ padding: "2rem" }}>
              <p className="t-title text-xl mb-1">Nothing under that heading today.</p>
              <p className="t-soft">Try a wider grade, or another platform.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ledger">
                <caption>Copied from the platforms as posted · the guild vouches for none of them</caption>
                <thead>
                  <tr>
                    <th style={{ width: "3rem" }}>№</th>
                    <th>Contract</th>
                    <th style={{ width: "10rem" }}>Grade</th>
                    <th>Ground</th>
                    <th style={{ width: "9rem" }}>Reward at most</th>
                    <th style={{ width: "9rem" }}>Passage</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p, i) => {
                    const g = GRADE[p.difficulty_band] || GRADE.hard;
                    const pass = PASSAGE[p.geo_access] || PASSAGE.unknown;
                    return (
                      <tr key={p.id}>
                        <td className="ledger-num">{roman(i + 1)}</td>
                        <td>
                          <Link to={`/registry/${p.id}`} className="flex items-start gap-3">
                            <span style={{ color: "var(--ink-soft)" }}>
                              <Mark name={markFor(p.type)} size={24} />
                            </span>
                            <span>
                              <span className="t-title text-[1.2rem]">{p.name}</span>
                              <span className="block t-caps">
                                {p.platform}
                                {p.type && ` · ${String(p.type).replace("_", " ")}`}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <Stars value={g.stars} />
                          <span className="block t-caps">{g.word}</span>
                        </td>
                        <td className="t-tech t-soft">
                          {p.stack_tags?.length ? p.stack_tags.slice(0, 5).join(" · ") : "not recorded"}
                        </td>
                        <td className="t-tech">
                          {p.payout_max ? formatPayoutShort(p.payout_max, p.currency) : "unlisted"}
                        </td>
                        <td>
                          <Stamp tone={pass.tone}>{pass.word}</Stamp>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="flex flex-col items-center mt-12">
        <Fleuron width={150} />
        <p className="t-caps mt-3">The register is recopied every day</p>
      </div>
    </>
  );
}
