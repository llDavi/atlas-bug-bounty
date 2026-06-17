const SORT_OPTIONS = [
  { value: "date", label: "Date (newest)" },
  { value: "payout", label: "Payout (highest)" },
  { value: "difficulty", label: "Difficulty (highest)" },
  { value: "name", label: "Name (A-Z)" },
];

const selectClass =
  "px-2 py-1.5 rounded text-sm bg-transparent border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 focus:outline-none focus:border-evergreen-400 dark:focus:border-evergreen-500";

export default function ListControls({ sortBy, onSortChange, shown, total, extra }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
      <span className="text-xs text-blue-slate-500 dark:text-blue-slate-400">
        Showing {shown} of {total} programs
      </span>

      <div className="flex items-center gap-3">
        {extra}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className={selectClass}
          style={{ borderWidth: "0.5px" }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
