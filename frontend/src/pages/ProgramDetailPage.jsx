import { Link, useParams } from "react-router-dom";
import PlatformBadge, { PLATFORM_LOGO_STYLES } from "../components/PlatformBadge";
import ProgramLogo from "../components/ProgramLogo";
import TypeBadge from "../components/TypeBadge";
import GeoFlag from "../components/GeoFlag";
import DifficultyDots from "../components/DifficultyDots";
import { ChevronLeftIcon, ExternalLinkIcon, LockIcon } from "../components/icons";
import { formatRelativeDate } from "../utils/date";

function formatPayout(amount, currency) {
  const symbol = currency === "EUR" ? "€" : "$";
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

const PLACEHOLDER_TARGETS = [
  { domain: "app.example.com", type: "web" },
  { domain: "api.example.com", type: "api" },
  { domain: "*.internal.example.com", type: "mobile" },
];

function InfoItem({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-blue-slate-400 dark:text-blue-slate-500 uppercase tracking-wide">
        {label}
      </span>
      {children}
    </div>
  );
}

export default function ProgramDetailPage({ programs, loading }) {
  const { id } = useParams();
  const program = programs.find((p) => p.id === Number(id));

  if (loading) {
    return (
      <main className="px-4 py-6 max-w-4xl mx-auto">
        <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400">Loading...</p>
      </main>
    );
  }

  if (!program) {
    return (
      <main className="px-4 py-6 max-w-4xl mx-auto">
        <Link
          to="/programs"
          className="inline-flex items-center gap-1 text-sm text-blue-slate-600 dark:text-blue-slate-300 hover:text-evergreen-600 dark:hover:text-evergreen-400"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to programs
        </Link>
        <p className="mt-4 text-sm text-blue-slate-500 dark:text-blue-slate-400">
          Program not found.
        </p>
      </main>
    );
  }

  const logoStyle =
    PLATFORM_LOGO_STYLES[program.platform] ||
    "bg-blue-slate-100 text-blue-slate-700 dark:bg-blue-slate-800 dark:text-blue-slate-300";

  return (
    <main className="px-4 py-4 max-w-4xl mx-auto">
      <Link
        to="/programs"
        className="inline-flex items-center gap-1 text-sm text-blue-slate-600 dark:text-blue-slate-300 hover:text-evergreen-600 dark:hover:text-evergreen-400"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to programs
      </Link>

      <div
        className="mt-3 rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4"
        style={{ borderWidth: "0.5px" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <ProgramLogo program={program} logoStyle={logoStyle} className="w-12 h-12 text-lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-blue-slate-900 dark:text-blue-slate-100 truncate">
                  {program.name}
                </h1>
                <TypeBadge type={program.type} />
              </div>
              <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-0.5">
                Bug Bounty Program
              </p>
            </div>
          </div>

          <a
            href={program.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300 hover:border-evergreen-400 dark:hover:border-evergreen-500 shrink-0"
            style={{ borderWidth: "0.5px" }}
          >
            Visit Program
            <ExternalLinkIcon className="w-4 h-4" />
          </a>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4 pt-4 border-t border-blue-slate-200 dark:border-blue-slate-800"
          style={{ borderTopWidth: "0.5px" }}
        >
          <InfoItem label="Reward range">
            <span className="text-sm font-medium text-blue-slate-900 dark:text-blue-slate-100">
              {formatPayout(program.payout_min, program.currency)} - {formatPayout(program.payout_max, program.currency)}
            </span>
          </InfoItem>
          <InfoItem label="Platform">
            <PlatformBadge platform={program.platform} />
          </InfoItem>
          <InfoItem label="Updated">
            <span className="text-sm text-blue-slate-700 dark:text-blue-slate-300">
              {formatRelativeDate(program.updated_at)}
            </span>
          </InfoItem>
          <InfoItem label="Access">
            <GeoFlag geoAccess={program.geo_access} geoNote={program.geo_note} />
          </InfoItem>
          <InfoItem label="Difficulty">
            <DifficultyDots level={program.difficulty} />
          </InfoItem>
        </div>

        <div
          className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-blue-slate-200 dark:border-blue-slate-800"
          style={{ borderTopWidth: "0.5px" }}
        >
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

      <div
        className="mt-4 rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4"
        style={{ borderWidth: "0.5px" }}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-blue-slate-900 dark:text-blue-slate-100">
            Program Targets
          </h2>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300"
            style={{ borderWidth: "0.5px" }}
          >
            Pro
          </span>
        </div>

        <div
          className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 bg-blue-slate-50/50 dark:bg-blue-slate-900/40 p-4"
          style={{ borderWidth: "0.5px" }}
        >
          <div className="flex items-center gap-2 mb-1 text-blue-slate-700 dark:text-blue-slate-300">
            <LockIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Pro required</span>
          </div>
          <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mb-3">
            Unlock the full list of targets, scope notes and other details with Atlas Pro.
          </p>

          <div className="flex flex-col gap-2 opacity-50 pointer-events-none mb-3">
            {PLACEHOLDER_TARGETS.map((target) => (
              <div
                key={target.domain}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded border border-blue-slate-200 dark:border-blue-slate-700 bg-white dark:bg-blue-slate-950"
                style={{ borderWidth: "0.5px" }}
              >
                <span className="text-sm text-blue-slate-700 dark:text-blue-slate-300 font-mono truncate">
                  {target.domain}
                </span>
                <TypeBadge type={target.type} />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded text-sm font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300 hover:border-evergreen-400 dark:hover:border-evergreen-500"
              style={{ borderWidth: "0.5px" }}
            >
              Upgrade to Pro
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded text-sm border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 hover:border-evergreen-400 dark:hover:border-evergreen-500"
              style={{ borderWidth: "0.5px" }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
