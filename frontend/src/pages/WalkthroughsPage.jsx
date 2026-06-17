import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LockIcon } from "../components/icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DIFF_COLORS = {
  easy:   "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
  hard:   "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
};

const DIFF_LABELS = { easy: "Easy", medium: "Intermediate", hard: "Advanced" };

const PLATFORM_COLORS = {
  hackerone: "bg-[#da5241]/10 text-[#da5241]",
  bugcrowd:  "bg-orange-500/10 text-orange-500",
  intigriti: "bg-blue-500/10 text-blue-500",
  yeswehack: "bg-violet-500/10 text-violet-500",
  sherlock:  "bg-slate-500/10 text-slate-400",
  immunefi:  "bg-teal-500/10 text-teal-500",
};

function WalkthroughCard({ w }) {
  const diffClass = DIFF_COLORS[w.difficulty] || DIFF_COLORS.hard;
  const platClass = PLATFORM_COLORS[w.platform] || "bg-blue-slate-500/10 text-blue-slate-400";

  return (
    <Link
      to={`/walkthroughs/${w.slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-blue-slate-200 dark:border-blue-slate-700 bg-white dark:bg-blue-slate-900 p-4 hover:border-evergreen-400 dark:hover:border-evergreen-500 transition-colors"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${diffClass}`} style={{ borderWidth: "0.5px" }}>
            {DIFF_LABELS[w.difficulty] || w.difficulty}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${platClass}`}>
            {w.platform}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-slate-100 dark:bg-blue-slate-800 text-blue-slate-600 dark:text-blue-slate-300">
            {w.vuln_class}
          </span>
        </div>
        <LockIcon className="w-3.5 h-3.5 text-blue-slate-400 dark:text-blue-slate-500 shrink-0" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-blue-slate-900 dark:text-blue-slate-100 group-hover:text-evergreen-600 dark:group-hover:text-evergreen-400 transition-colors">
          {w.title}
        </h3>
        <p className="mt-1 text-xs text-blue-slate-500 dark:text-blue-slate-400 line-clamp-2">
          {w.teaser}
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-blue-slate-100 dark:border-blue-slate-800" style={{ borderWidth: "0.5px" }}>
        <span className="text-xs text-blue-slate-400 dark:text-blue-slate-500">
          {w.program}
        </span>
        <span className="text-xs font-semibold text-evergreen-600 dark:text-evergreen-400">
          ${w.bounty?.toLocaleString("en-US")}
        </span>
      </div>
    </Link>
  );
}

export default function WalkthroughsPage() {
  const [walkthroughs, setWalkthroughs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diffFilter, setDiffFilter] = useState("all");
  const [vulnFilter, setVulnFilter] = useState("all");

  useEffect(() => {
    fetch(`${API_URL}/api/walkthroughs`)
      .then((r) => r.json())
      .then(setWalkthroughs)
      .finally(() => setLoading(false));
  }, []);

  const vulnClasses = useMemo(
    () => ["all", ...new Set(walkthroughs.map((w) => w.vuln_class))],
    [walkthroughs]
  );

  const filtered = useMemo(
    () =>
      walkthroughs.filter((w) => {
        if (diffFilter !== "all" && w.difficulty !== diffFilter) return false;
        if (vulnFilter !== "all" && w.vuln_class !== vulnFilter) return false;
        return true;
      }),
    [walkthroughs, diffFilter, vulnFilter]
  );

  const selectClass =
    "px-2 py-1.5 rounded text-xs bg-transparent border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 focus:outline-none focus:border-evergreen-400 dark:focus:border-evergreen-500";

  return (
    <main className="px-4 py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="font-mono text-xs text-[var(--signal-purple)] mb-1">// pro feature</p>
        <h1 className="text-2xl font-bold text-blue-slate-900 dark:text-blue-slate-100">
          Walkthrough Library
        </h1>
        <p className="mt-1 text-sm text-blue-slate-500 dark:text-blue-slate-400 max-w-xl">
          Real disclosed bug bounty reports broken down step by step — from program selection and recon to the full exploit chain and report. Pro members get the full story.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select
          value={diffFilter}
          onChange={(e) => setDiffFilter(e.target.value)}
          className={selectClass}
          style={{ borderWidth: "0.5px" }}
        >
          <option value="all">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Intermediate</option>
          <option value="hard">Advanced</option>
        </select>

        <select
          value={vulnFilter}
          onChange={(e) => setVulnFilter(e.target.value)}
          className={selectClass}
          style={{ borderWidth: "0.5px" }}
        >
          {vulnClasses.map((v) => (
            <option key={v} value={v}>
              {v === "all" ? "All vulnerability types" : v}
            </option>
          ))}
        </select>

        <span className="text-xs text-blue-slate-400 dark:text-blue-slate-500 ml-auto">
          {filtered.length} walkthrough{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading && (
        <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400">Loading...</p>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <WalkthroughCard key={w.slug} w={w} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400">No walkthroughs match your filters.</p>
      )}
    </main>
  );
}
