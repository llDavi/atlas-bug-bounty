import { Link } from "react-router-dom";
import { PLATFORM_LABELS } from "../components/PlatformBadge";
import { ClockIcon, TrendingUpIcon, ArrowUpIcon, ArrowDownIcon, BarChartIcon } from "../components/icons";

const PLATFORM_POPULARITY = [
  { rank: 1, platform: "hackerone", sentiment: "rising", approval: 90, votes: 10, up: 9, down: 1 },
  { rank: 2, platform: "intigriti", sentiment: "rising", approval: 100, votes: 7, up: 7, down: 0 },
  { rank: 3, platform: "bugcrowd", sentiment: "rising", approval: 75, votes: 8, up: 6, down: 2 },
  { rank: 4, platform: "yeswehack", sentiment: "neutral", approval: 67, votes: 6, up: 4, down: 2 },
];

const STATS_CARDS = [
  {
    icon: BarChartIcon,
    label: "Active Programs",
    value: "248",
    note: "Across all monitored platforms.",
  },
  {
    icon: TrendingUpIcon,
    label: "New Programs (90d)",
    value: "32",
    note: "New launches in the last quarter.",
  },
  {
    icon: BarChartIcon,
    label: "VDP Share",
    value: "24%",
    note: "Programs with no cash rewards.",
  },
];

const NEW_PROGRAM_SHARE = [
  { platform: "hackerone", share: 44, color: "bg-dusty-grape-500" },
  { platform: "bugcrowd", share: 28, color: "bg-evergreen-500" },
  { platform: "intigriti", share: 18, color: "bg-dark-slate-grey-500" },
  { platform: "yeswehack", share: 10, color: "bg-amethyst-smoke-500" },
];

const PLATFORM_DETAILS = [
  {
    platform: "hackerone",
    active: 458,
    new30d: 4,
    vdpShare: 52,
    avgBounty: "€8,000",
    velocityNote: "1 in the last 7d · 14 in the last 90d",
    velocity: [4, 2, 6, 3, 8, 5, 4, 2, 6, 7, 3, 5],
  },
  {
    platform: "intigriti",
    active: 126,
    new30d: 1,
    vdpShare: 40,
    avgBounty: "€4,500",
    velocityNote: "0 in the last 7d · 3 in the last 90d",
    velocity: [1, 0, 2, 0, 1, 0, 0, 1, 0, 1, 0, 0],
  },
  {
    platform: "bugcrowd",
    active: 312,
    new30d: 3,
    vdpShare: 35,
    avgBounty: "€5,200",
    velocityNote: "1 in the last 7d · 9 in the last 90d",
    velocity: [2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1],
  },
  {
    platform: "yeswehack",
    active: 94,
    new30d: 1,
    vdpShare: 28,
    avgBounty: "€3,100",
    velocityNote: "0 in the last 7d · 2 in the last 90d",
    velocity: [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
];

const SENTIMENT_STYLES = {
  rising: {
    label: "Rising",
    className:
      "border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300",
  },
  neutral: {
    label: "Stable",
    className:
      "border-amethyst-smoke-200 bg-amethyst-smoke-50 text-amethyst-smoke-700 dark:border-amethyst-smoke-800 dark:bg-amethyst-smoke-950 dark:text-amethyst-smoke-300",
  },
};

function PlatformRow({ stat }) {
  const sentiment = SENTIMENT_STYLES[stat.sentiment];

  return (
    <div
      className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 px-4 py-3"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="flex items-start gap-3">
        <span className="text-sm font-semibold text-blue-slate-400 dark:text-blue-slate-500 w-6 shrink-0">
          #{stat.rank}
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-blue-slate-900 dark:text-blue-slate-100">
              {PLATFORM_LABELS[stat.platform] || stat.platform}
            </span>
            {sentiment && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${sentiment.className}`}
                style={{ borderWidth: "0.5px" }}
              >
                <TrendingUpIcon className="w-3 h-3" />
                {sentiment.label}
              </span>
            )}
          </div>
          <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400">
            {stat.approval}% approval · {stat.votes} votes ·{" "}
            <span className="inline-flex items-center gap-1">
              <ArrowUpIcon className="w-3 h-3 text-evergreen-600 dark:text-evergreen-400" />
              {stat.up}
            </span>{" "}
            /{" "}
            <span className="inline-flex items-center gap-1">
              <ArrowDownIcon className="w-3 h-3 text-blue-slate-400" />
              {stat.down}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div
      className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-blue-slate-500 dark:text-blue-slate-400">
        <Icon className="w-5 h-5 text-evergreen-600 dark:text-evergreen-400" />
        {label}
      </div>
      <div className="text-3xl font-semibold text-blue-slate-900 dark:text-blue-slate-100 mt-2">
        {value}
      </div>
      <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-1">{note}</p>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 bg-blue-slate-50/50 dark:bg-blue-slate-900/40 p-3"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="text-xs text-blue-slate-500 dark:text-blue-slate-400">{label}</div>
      <div className="text-lg font-semibold text-blue-slate-900 dark:text-blue-slate-100">{value}</div>
    </div>
  );
}

function PlatformDetailCard({ detail }) {
  const max = Math.max(...detail.velocity);

  return (
    <div
      className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4"
      style={{ borderWidth: "0.5px" }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-blue-slate-900 dark:text-blue-slate-100">
            {PLATFORM_LABELS[detail.platform] || detail.platform}
          </h3>
          <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-0.5">
            Updated on Jun 11, 2026
          </p>
        </div>
        <Link
          to="/programs"
          className="px-3 py-1.5 rounded text-sm border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 hover:border-evergreen-400 dark:hover:border-evergreen-500 shrink-0"
          style={{ borderWidth: "0.5px" }}
        >
          Browse programs
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        <StatBox label="Active programs" value={detail.active} />
        <StatBox label="New in 30d" value={detail.new30d} />
        <StatBox label="VDP share" value={`${detail.vdpShare}%`} />
        <StatBox label="Avg. reward" value={detail.avgBounty} />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 text-xs text-blue-slate-500 dark:text-blue-slate-400">
          <span>New program velocity</span>
          <span className="font-medium text-blue-slate-700 dark:text-blue-slate-300">
            {detail.velocityNote}
          </span>
        </div>
        <div className="flex items-end gap-1 h-12 mt-2">
          {detail.velocity.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-evergreen-200 dark:bg-evergreen-800"
              style={{ height: `${Math.max((v / max) * 100, 6)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlatformsPage() {
  return (
    <main className="px-4 py-4 max-w-4xl mx-auto flex flex-col gap-4">
      <div
        className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4"
        style={{ borderWidth: "0.5px" }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300"
                style={{ borderWidth: "0.5px" }}
              >
                Free
              </span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-blue-slate-200 text-blue-slate-600 dark:border-blue-slate-700 dark:text-blue-slate-300"
                style={{ borderWidth: "0.5px" }}
              >
                Updated daily
              </span>
            </div>
            <h1 className="text-2xl font-bold text-blue-slate-900 dark:text-blue-slate-100 mt-2">
              Platform Intelligence
            </h1>
            <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400 mt-1 max-w-xl">
              Compare platform popularity, activity and reward profiles. Vote for your favorites to help surface the best experiences for researchers.
            </p>
          </div>

          <div className="flex flex-col gap-1 text-xs text-blue-slate-500 dark:text-blue-slate-400 shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5" />
              Snapshot: Jun 11, 2026
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TrendingUpIcon className="w-3.5 h-3.5" />
              Last 90 days trend
            </span>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4"
        style={{ borderWidth: "0.5px" }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div>
            <h2 className="text-sm font-semibold text-blue-slate-900 dark:text-blue-slate-100">
              Platform Popularity
            </h2>
            <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-0.5">
              Ranked by upvotes. Sign in to vote.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-slate-500 dark:text-blue-slate-400">
            <span>From most to least liked.</span>
            <button
              type="button"
              className="px-3 py-1.5 rounded text-sm border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 hover:border-evergreen-400 dark:hover:border-evergreen-500 shrink-0"
              style={{ borderWidth: "0.5px" }}
            >
              Sign in to vote
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PLATFORM_POPULARITY.map((stat) => (
            <PlatformRow key={stat.platform} stat={stat} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {STATS_CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div
        className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4"
        style={{ borderWidth: "0.5px" }}
      >
        <h2 className="text-sm font-semibold text-blue-slate-900 dark:text-blue-slate-100">
          New Program Distribution (90d)
        </h2>
        <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-0.5">
          Share of new programs per platform over the last quarter.
        </p>

        <div
          className="flex h-3 rounded overflow-hidden mt-3 border border-blue-slate-200 dark:border-blue-slate-700"
          style={{ borderWidth: "0.5px" }}
        >
          {NEW_PROGRAM_SHARE.map((item) => (
            <div key={item.platform} className={item.color} style={{ width: `${item.share}%` }} />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {NEW_PROGRAM_SHARE.map((item) => (
            <div key={item.platform} className="flex items-center gap-2 text-xs text-blue-slate-600 dark:text-blue-slate-300">
              <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${item.color}`} />
              <span className="truncate">{PLATFORM_LABELS[item.platform] || item.platform}</span>
              <span className="ml-auto text-blue-slate-400 dark:text-blue-slate-500">{item.share}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {PLATFORM_DETAILS.map((detail) => (
          <PlatformDetailCard key={detail.platform} detail={detail} />
        ))}
      </div>
    </main>
  );
}
