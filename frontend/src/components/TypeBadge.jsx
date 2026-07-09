const TYPE_LABELS = {
  web: "Web",
  api: "API",
  mobile: "Mobile",
  smart_contract: "Smart Contract",
  other: "Other",
};

export default function TypeBadge({ type }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border text-blue-slate-600 bg-blue-slate-50 border-blue-slate-200 dark:text-blue-slate-400 dark:bg-blue-slate-900 dark:border-blue-slate-700"
      style={{ borderWidth: "0.5px" }}
    >
      {TYPE_LABELS[type] || type}
    </span>
  );
}
