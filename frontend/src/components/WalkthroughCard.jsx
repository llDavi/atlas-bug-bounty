import PlatformBadge from "./PlatformBadge";
import { LockIcon } from "./icons";

export default function WalkthroughCard({ title, platform, vulnClass, teaser }) {
  return (
    <div
      className="glow-purple relative flex flex-col rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4 overflow-hidden"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
          style={{
            borderWidth: "0.5px",
            borderColor: "rgba(163, 113, 247, 0.35)",
            backgroundColor: "rgba(163, 113, 247, 0.12)",
            color: "var(--signal-purple)",
          }}
        >
          {vulnClass}
        </span>
        <PlatformBadge platform={platform} />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-blue-slate-900 dark:text-blue-slate-100">
        {title}
      </h3>

      <div className="relative mt-2">
        <p className="text-sm text-blue-slate-600 dark:text-blue-slate-300 blur-[3px] select-none">
          {teaser}
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300"
            style={{ borderWidth: "0.5px" }}
          >
            <LockIcon className="w-3.5 h-3.5" />
            Pro
          </span>
        </div>
      </div>
    </div>
  );
}
