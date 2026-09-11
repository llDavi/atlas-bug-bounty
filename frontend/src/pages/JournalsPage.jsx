import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead, Stamp, Stars, Fleuron, Mark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { markForClass } from "../utils/marks";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ==========================================================================
   THE FIELD JOURNALS
   ==========================================================================
   Accounts of hunts that actually happened, copied into the archive from the
   hunters' own journals. Entries, ruled off — not a wall of cards.
   ========================================================================== */

const GRADE = {
  easy: { word: "Novice", stars: 1, tone: "green" },
  medium: { word: "Journeyman", stars: 3, tone: "" },
  hard: { word: "Expert", stars: 5, tone: "rubric" },
};

export default function JournalsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [grade, setGrade] = useState("all");
  const [order, setOrder] = useState("all");

  useEffect(() => {
    fetch(`${API_URL}/api/walkthroughs`)
      .then((r) => r.json())
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const orders = useMemo(
    () => ["all", ...Array.from(new Set(reports.map((w) => w.vuln_class).filter(Boolean))).sort()],
    [reports]
  );

  const shown = reports.filter((w) => {
    if (grade !== "all" && w.difficulty !== grade) return false;
    if (order !== "all" && w.vuln_class !== order) return false;
    return true;
  });

  return (
    <>
      <PageHead
        folio={5}
        standing="The fifth folio"
        title="Field Journals"
        gloss="Hunts that happened, written down by the hunters who made them: the ground they walked, the moment it turned, the proof they stopped at, and the account that was paid for."
        hand="read one of these before every descent"
      />

      <div className="flex flex-wrap items-end gap-x-8 gap-y-3 mb-2">
        <label>
          <span className="t-caps block mb-1">Grade</span>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="field-select">
            <option value="all">Every grade</option>
            <option value="easy">Novice</option>
            <option value="medium">Journeyman</option>
            <option value="hard">Expert</option>
          </select>
        </label>
        {orders.length > 1 && (
          <label>
            <span className="t-caps block mb-1">Order of beast</span>
            <select value={order} onChange={(e) => setOrder(e.target.value)} className="field-select">
              {orders.map((o) => (
                <option key={o} value={o}>{o === "all" ? "Every order" : o}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <hr className="rule" />

      {loading && (
        <div className="leaf" style={{ padding: "2.5rem", textAlign: "center" }}>
          <p className="t-title text-2xl">The archivist is unbinding the folios…</p>
        </div>
      )}

      {failed && !loading && (
        <div className="leaf" style={{ padding: "2.5rem" }}>
          <p className="t-caps t-rubric">The archive is shut</p>
          <p className="t-title text-2xl mt-1">Nobody answers at the archive door.</p>
        </div>
      )}

      {!loading && !failed && shown.length === 0 && (
        <div className="leaf leaf--lit" style={{ padding: "2rem" }}>
          <p className="t-title text-xl mb-1">No account under that heading.</p>
          <p className="t-soft">Try another grade or another order of beast.</p>
        </div>
      )}

      <div className="flex flex-col">
        {shown.map((w, i) => {
          const g = GRADE[w.difficulty] || GRADE.hard;
          return (
            <article key={w.slug} className="entry">
              <div className="spread spread--margin-left">
                <aside className="order-2 lg:order-1">
                  <div className="flex lg:flex-col items-center lg:items-start gap-3">
                    <span style={{ color: "var(--ink-strong)" }}>
                      <Mark name={markForClass(w.vuln_class)} size={52} />
                    </span>
                    <div>
                      <p className="t-caps">Account {roman(i + 1)}</p>
                      <p className="t-hand" style={{ fontSize: "1rem" }}>{w.vuln_class}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Stars value={g.stars} />
                    <p className="t-caps mt-1">{g.word}</p>
                  </div>
                </aside>

                <div className="order-1 lg:order-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="t-caps">
                      {w.program} · {w.platform}
                      {w.published_at && ` · disclosed ${w.published_at}`}
                    </p>
                    <Stamp tone="faint" pressed>Sealed folio</Stamp>
                  </div>

                  <h2 className="t-title text-3xl mt-2 mb-3">
                    <Link to={`/journals/${w.slug}`}>{w.title}</Link>
                  </h2>

                  <p className="column-wide text-[1.05rem] mb-4">{w.teaser}</p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="t-caps">
                      Paid {w.bounty ? `$${w.bounty.toLocaleString("en-US")}` : "—"}
                    </span>
                    <Link to={`/journals/${w.slug}`} className="ink-btn ink-btn--small">
                      Read the account
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col items-center mt-12">
        <Fleuron width={150} />
        <p className="t-caps mt-3">More journals are copied each month</p>
      </div>
    </>
  );
}
