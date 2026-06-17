import { useNavigate } from "react-router-dom";
import PlatformBadge, { PLATFORM_LOGO_STYLES } from "./PlatformBadge";
import ProgramLogo from "./ProgramLogo";
import TypeBadge from "./TypeBadge";
import GeoFlag from "./GeoFlag";
import DifficultyDots from "./DifficultyDots";
import { ExternalLinkIcon } from "./icons";
import { formatRelativeDate } from "../utils/date";
import { formatPayoutShort } from "../utils/format";

function isRecent(dateStr) {
  if (!dateStr) return false;
  const diffMs = new Date() - new Date(dateStr);
  return diffMs >= 0 && diffMs <= 2 * 24 * 60 * 60 * 1000;
}

export default function ProgramCard({ program }) {
  const navigate = useNavigate();
  const logoStyle =
    PLATFORM_LOGO_STYLES[program.platform] ||
    "bg-blue-slate-100 text-blue-slate-700 dark:bg-blue-slate-800 dark:text-blue-slate-300";

  return (
    <div
      onClick={() => navigate(`/programs/${program.id}`)}
      className="glow-evergreen h-full flex flex-col rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4 hover:border-evergreen-300 dark:hover:border-evergreen-500/60 cursor-pointer"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <ProgramLogo program={program} logoStyle={logoStyle} className="w-10 h-10 text-base" />
          <div className="min-w-0">
            <p className="font-medium text-sm text-blue-slate-900 dark:text-blue-slate-100 truncate">
              {program.name}
            </p>
            <p className="text-xs text-blue-slate-400 dark:text-blue-slate-500 mt-0.5">
              {formatRelativeDate(program.updated_at)}
            </p>
          </div>
        </div>

        {isRecent(program.updated_at) && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300 shrink-0"
            style={{ borderWidth: "0.5px" }}
          >
            New
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <PlatformBadge platform={program.platform} />
        <TypeBadge type={program.type} />
        <GeoFlag geoAccess={program.geo_access} geoNote={program.geo_note} />
      </div>

      <div className="mt-3 pt-3 border-t border-blue-slate-200 dark:border-blue-slate-700" style={{ borderTopWidth: "0.5px" }}>
        <p className="text-lg font-semibold text-evergreen-600 dark:text-evergreen-400">
          {formatPayoutShort(program.payout_min, program.currency)} - {formatPayoutShort(program.payout_max, program.currency)}
        </p>
        <p className="text-xs text-blue-slate-400 dark:text-blue-slate-500">reward range</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <DifficultyDots level={program.difficulty} />
        <div className="flex flex-wrap gap-1">
          {program.stack_tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-xs text-blue-slate-600 dark:text-blue-slate-400 border border-blue-slate-200 dark:border-blue-slate-700"
              style={{ borderWidth: "0.5px" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => navigate(`/programs/${program.id}`)}
          className="flex-1 px-3 py-1.5 rounded text-sm font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300 hover:border-evergreen-400 dark:hover:border-evergreen-500"
          style={{ borderWidth: "0.5px" }}
        >
          Details
        </button>
        <a
          href={program.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Visit program"
          className="inline-flex items-center justify-center w-9 h-9 rounded text-blue-slate-600 dark:text-blue-slate-300 border border-blue-slate-200 dark:border-blue-slate-700 hover:border-evergreen-400 dark:hover:border-evergreen-500 shrink-0"
          style={{ borderWidth: "0.5px" }}
        >
          <ExternalLinkIcon className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
