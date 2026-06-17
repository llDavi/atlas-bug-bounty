import { useMemo, useState } from "react";
import FilterBar, { EMPTY_FILTERS } from "../components/FilterBar";
import ListControls from "../components/ListControls";
import ProgramCard from "../components/ProgramCard";
import { ChevronRightIcon, ChevronDownIcon, InfoIcon } from "../components/icons";

const DIFFICULTY_BANDS = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Intermediate" },
  { key: "hard", label: "Advanced" },
];

const ROW_PREVIEW_COUNT = 5;

const SCORE_CATEGORIES = [
  {
    label: "Attack Surface",
    range: "0–25 pts",
    desc: "Scope size, asset diversity, wildcards",
    hint: "More targets → easier to find bugs",
  },
  {
    label: "Technical Barriers",
    range: "0–25 pts",
    desc: "WAF protection, account requirements, stack visibility",
    hint: "Fewer barriers → higher score",
  },
  {
    label: "Competition",
    range: "0–25 pts",
    desc: "Resolved reports, program age, researcher count",
    hint: "Less crowded → higher score",
  },
  {
    label: "Program Quality",
    range: "0–25 pts",
    desc: "Response time, scope clarity, bounty table",
    hint: "Better program → higher score",
  },
];

function ScoreLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-blue-slate-400 dark:text-blue-slate-500 hover:text-blue-slate-600 dark:hover:text-blue-slate-300 transition-colors"
      >
        <InfoIcon className="w-3.5 h-3.5" />
        How scores work
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border border-blue-slate-200 dark:border-blue-slate-700 bg-white dark:bg-blue-slate-900 shadow-xl p-4 text-left text-xs">
          <p className="font-semibold text-blue-slate-800 dark:text-blue-slate-100 mb-0.5">
            How the difficulty score works
          </p>
          <p className="text-blue-slate-400 dark:text-blue-slate-500 mb-3">
            Score 0–100 = sum of 4 categories × 25 pts each
          </p>

          <div className="flex flex-col gap-3 mb-3">
            {SCORE_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="font-medium text-blue-slate-700 dark:text-blue-slate-200">
                    {cat.label}
                  </span>
                  <span className="text-blue-slate-400 dark:text-blue-slate-500 ml-2 shrink-0 font-mono">
                    {cat.range}
                  </span>
                </div>
                <p className="text-blue-slate-500 dark:text-blue-slate-400">{cat.desc}</p>
                <p className="text-blue-slate-400 dark:text-blue-slate-500 italic">{cat.hint}</p>
              </div>
            ))}
          </div>

          <div
            className="border-t border-blue-slate-100 dark:border-blue-slate-700 pt-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-blue-slate-700 dark:text-blue-slate-300">
                <span className="font-mono font-medium">≥ 75</span>
                {" "}— Easy
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-blue-slate-700 dark:text-blue-slate-300">
                <span className="font-mono font-medium">45–74</span>
                {" "}— Intermediate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-blue-slate-700 dark:text-blue-slate-300">
                <span className="font-mono font-medium">&lt; 45</span>
                {" "}— Advanced
              </span>
            </div>
          </div>

          <p className="mt-3 text-blue-slate-400 dark:text-blue-slate-500 italic border-t border-blue-slate-100 dark:border-blue-slate-700 pt-3" style={{ borderWidth: "0.5px" }}>
            Platforms with partial data receive a neutral 12.5/25 for missing categories.
          </p>
        </div>
      )}
    </div>
  );
}

function sortPrograms(programs, sortBy) {
  const sorted = [...programs];
  switch (sortBy) {
    case "payout":
      return sorted.sort((a, b) => b.payout_max - a.payout_max);
    case "difficulty":
      return sorted.sort((a, b) => b.difficulty - a.difficulty);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "date":
    default:
      return sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
}

export default function ProgramsPage({ programs, loading, error, search }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState({});

  const filteredPrograms = useMemo(() => {
    const filtered = programs.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filters.platform && p.platform !== filters.platform) return false;
      if (filters.geo && p.geo_access !== filters.geo) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.difficulty && p.difficulty < Number(filters.difficulty))
        return false;
      return true;
    });
    return sortPrograms(filtered, sortBy);
  }, [programs, search, filters, sortBy]);

  const groups = useMemo(() => {
    return DIFFICULTY_BANDS.map((band) => ({
      ...band,
      programs: filteredPrograms.filter((p) => p.difficulty_band === band.key),
    })).filter((band) => band.programs.length > 0);
  }, [filteredPrograms]);

  const toggleExpanded = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <FilterBar filters={filters} onChange={setFilters} />

      <ListControls
        sortBy={sortBy}
        onSortChange={setSortBy}
        shown={filteredPrograms.length}
        total={programs.length}
        extra={<ScoreLegend />}
      />

      <main className="px-4 py-3 flex flex-col gap-6">
        {loading && (
          <p className="py-6 text-sm text-blue-slate-500 dark:text-blue-slate-400">
            Loading...
          </p>
        )}

        {error && (
          <p className="py-6 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!loading && !error && filteredPrograms.length === 0 && (
          <p className="py-6 text-sm text-blue-slate-500 dark:text-blue-slate-400">
            No programs found.
          </p>
        )}

        {!loading &&
          !error &&
          groups.map((group) => {
            const isExpanded = !!expanded[group.key];
            const hasMore = group.programs.length > ROW_PREVIEW_COUNT;

            return (
              <section key={group.key}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-sm font-semibold text-blue-slate-900 dark:text-blue-slate-100">
                      {group.label}
                    </h2>
                    <span className="text-xs text-blue-slate-400 dark:text-blue-slate-500">
                      {group.programs.length} program{group.programs.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(group.key)}
                      className="flex items-center gap-1 text-xs font-medium text-blue-slate-500 dark:text-blue-slate-400 hover:text-evergreen-600 dark:hover:text-evergreen-400 shrink-0"
                    >
                      {isExpanded ? (
                        <>
                          Show less
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Show more
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {isExpanded ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                    {group.programs.map((program) => (
                      <ProgramCard key={program.id} program={program} />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto items-stretch py-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                    {group.programs.slice(0, ROW_PREVIEW_COUNT).map((program) => (
                      <div
                        key={program.id}
                        className="w-[260px] sm:w-[280px] shrink-0 snap-start"
                      >
                        <ProgramCard program={program} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
      </main>
    </>
  );
}
