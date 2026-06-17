import { useState } from "react";

const PLATFORMS = [
  { value: "", label: "All platforms" },
  { value: "hackerone", label: "HackerOne" },
  { value: "yeswehack", label: "YesWeHack" },
  { value: "intigriti", label: "Intigriti" },
  { value: "bugcrowd", label: "Bugcrowd" },
  { value: "immunefi", label: "Immunefi" },
  { value: "sherlock", label: "Sherlock" },
];

const GEO_OPTIONS = [
  { value: "", label: "All access types" },
  { value: "ok", label: "Italy OK" },
  { value: "vpn", label: "VPN required" },
  { value: "blocked", label: "Blocked" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "web", label: "Web" },
  { value: "api", label: "API" },
  { value: "mobile", label: "Mobile" },
  { value: "smart_contract", label: "Smart Contract" },
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "All difficulties" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5" },
];

export const EMPTY_FILTERS = {
  platform: "",
  geo: "",
  type: "",
  difficulty: "",
};

const selectClass =
  "px-2 py-1.5 rounded text-sm bg-transparent border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 focus:outline-none focus:border-evergreen-400 dark:focus:border-evergreen-500";

function countActive(filters) {
  return Object.values(filters).filter((v) => v !== "").length;
}

export default function FilterBar({ filters, onChange }) {
  const [open, setOpen] = useState(false);
  const activeCount = countActive(filters);

  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div
      className="relative border-b border-blue-slate-200 dark:border-blue-slate-800"
      style={{ borderBottomWidth: "0.5px" }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-blue-slate-700 dark:text-blue-slate-300 border border-blue-slate-200 dark:border-blue-slate-700 hover:border-blue-slate-300 dark:hover:border-blue-slate-600"
          style={{ borderWidth: "0.5px" }}
        >
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs bg-evergreen-600 text-white dark:bg-evergreen-500 dark:text-evergreen-950">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs text-blue-slate-400 dark:text-blue-slate-500 hover:text-blue-slate-600 dark:hover:text-blue-slate-300"
          >
            Reset
          </button>
        )}
      </div>

      {open && (
        <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
          <select
            value={filters.platform}
            onChange={(e) => update("platform", e.target.value)}
            className={selectClass}
            style={{ borderWidth: "0.5px" }}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <select
            value={filters.geo}
            onChange={(e) => update("geo", e.target.value)}
            className={selectClass}
            style={{ borderWidth: "0.5px" }}
          >
            {GEO_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => update("type", e.target.value)}
            className={selectClass}
            style={{ borderWidth: "0.5px" }}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => update("difficulty", e.target.value)}
            className={selectClass}
            style={{ borderWidth: "0.5px" }}
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
