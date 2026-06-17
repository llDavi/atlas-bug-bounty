import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  RadarIcon,
  BarChartIcon,
  TrendingUpIcon,
  SparklesIcon,
  CheckIcon,
  ChevronRightIcon,
} from "../components/icons";
import WalkthroughCard from "../components/WalkthroughCard";
import useReveal from "../hooks/useReveal";

const PAIN_POINTS = [
  "Hundreds of programs across 6 platforms — no way to compare them without hours of manual research",
  "Payout size tells you nothing about how saturated a program already is with experienced hunters",
  "Geo-blocks and hidden scope restrictions you only discover after you've already started",
];

const FEATURES = [
  {
    icon: BarChartIcon,
    title: "Scored by real criteria",
    text: "Attack surface, tech barriers, competition level, program quality — four signals combined into a single 0–100 score. Not just payout.",
    glow: "glow-evergreen",
  },
  {
    icon: SparklesIcon,
    title: "Six platforms, one view",
    text: "HackerOne, Bugcrowd, YesWeHack, Intigriti, Immunefi and Sherlock — all updated hourly, all in the same place.",
    glow: "glow-purple",
  },
  {
    icon: TrendingUpIcon,
    title: "Start with Easy. Level up.",
    text: "The Easy row shows programs with wide scope, low competition, and clear bounty tables — the exact conditions that produce a first finding.",
    glow: "glow-evergreen",
  },
];

const WALKTHROUGHS = [
  {
    title: "IDOR on an internal billing API",
    platform: "hackerone",
    vulnClass: "IDOR",
    teaser:
      "How a predictable invoice ID and a missing ownership check turned into full account takeover, step by step.",
  },
  {
    title: "SSRF via a PDF export feature",
    platform: "bugcrowd",
    vulnClass: "SSRF",
    teaser:
      "Tracing a report from 'this export takes a URL' to reading cloud metadata, with every probe explained.",
  },
  {
    title: "Reentrancy in a staking contract",
    platform: "sherlock",
    vulnClass: "Reentrancy",
    teaser:
      "Breaking down the call order that let an attacker drain pooled funds before balances were updated.",
  },
];

function StatCounter({ value, label }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round(progress * value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center gap-1 py-4 px-4">
      <span className="text-xl font-bold text-[var(--signal-green)]">
        {count.toLocaleString("en-US")}+
      </span>
      <span className="text-xs text-blue-slate-500 dark:text-blue-slate-400 text-center">{label}</span>
    </div>
  );
}

function RevealSection({ className = "", style, children }) {
  const [ref, visible] = useReveal();
  return (
    <section
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

export default function HomePage({ programs = [] }) {
  const easyCount = useMemo(
    () => programs.filter((p) => p.difficulty_band === "easy").length,
    [programs]
  );

  return (
    <main className="px-4 py-4 max-w-3xl mx-auto overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center text-center gap-5 py-12">
        <div
          className="absolute -top-10 -left-16 w-64 h-64 rounded-full blur-3xl animate-float pointer-events-none -z-10"
          style={{ backgroundColor: "rgba(63, 185, 80, 0.18)" }}
        />
        <div
          className="absolute top-10 -right-16 w-72 h-72 rounded-full blur-3xl animate-float pointer-events-none -z-10"
          style={{ backgroundColor: "rgba(163, 113, 247, 0.18)", animationDelay: "-4s" }}
        />

        <span className="font-mono text-xs text-[var(--signal-green)]">
          atlas@radar:~$ scan --difficulty easy --platforms all
          <span className="cursor-blink">_</span>
        </span>

        <div className="relative flex items-center justify-center w-16 h-16">
          <span
            className="absolute inset-0 rounded-full border pulse-ring"
            style={{ borderColor: "var(--signal-green)" }}
          />
          <span
            className="absolute inset-0 rounded-full border pulse-ring"
            style={{ borderColor: "var(--signal-green)", animationDelay: "-1.2s" }}
          />
          <RadarIcon className="relative w-10 h-10 text-[var(--signal-green)]" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-5xl font-bold text-blue-slate-900 dark:text-blue-slate-100 max-w-xl leading-tight">
            Your first bug bounty.<br />
            <span className="text-[var(--signal-green)]">Made simple.</span>
          </h1>
          <p className="text-sm sm:text-base text-blue-slate-600 dark:text-blue-slate-300 max-w-lg mx-auto">
            Atlas scores every public bug bounty program by how beginner-friendly it actually is —
            combining scope size, competition level, tech barriers and program quality into one clear ranking.
            No more guessing. Just pick a target and start.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            to="/programs"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded text-sm font-semibold bg-evergreen-600 text-white dark:bg-evergreen-500 dark:text-evergreen-950 hover:bg-evergreen-700 dark:hover:bg-evergreen-400 transition-colors"
          >
            Browse Easy programs
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
          <Link
            to="/programs"
            className="inline-flex items-center px-5 py-2.5 rounded text-sm font-medium border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-600 dark:text-blue-slate-300 hover:border-evergreen-400 dark:hover:border-evergreen-500 transition-colors"
            style={{ borderWidth: "0.5px" }}
          >
            See all programs
          </Link>
        </div>

        {programs.length > 0 && (
          <div
            className="grid grid-cols-3 w-full mt-3 rounded-lg border border-blue-slate-100 dark:border-blue-slate-700 overflow-hidden divide-x divide-blue-slate-100 dark:divide-blue-slate-700"
            style={{ borderWidth: "0.5px" }}
          >
            <StatCounter value={programs.length} label="programs tracked" />
            <StatCounter value={6} label="platforms" />
            <StatCounter value={easyCount} label="easy right now" />
          </div>
        )}
      </section>

      {/* ── Pain points ── */}
      <RevealSection
        className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-5"
        style={{ borderWidth: "0.5px" }}
      >
        <p className="font-mono text-xs text-[var(--signal-purple)] mb-1">// the problem</p>
        <h2 className="text-lg font-semibold text-blue-slate-900 dark:text-blue-slate-100 mb-3">
          Starting out in bug bounty is brutal
        </h2>
        <ul className="flex flex-col gap-3">
          {PAIN_POINTS.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 text-sm text-blue-slate-700 dark:text-blue-slate-300"
            >
              <CheckIcon className="w-4 h-4 mt-0.5 shrink-0 text-evergreen-600 dark:text-evergreen-400" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-medium text-blue-slate-800 dark:text-blue-slate-100">
          Atlas was built to remove all of that friction.
        </p>
      </RevealSection>

      {/* ── Features ── */}
      <RevealSection className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FEATURES.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className={`${feat.glow} rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4 flex flex-col gap-2`}
              style={{ borderWidth: "0.5px" }}
            >
              <Icon className="w-5 h-5 text-evergreen-600 dark:text-evergreen-400" />
              <h3 className="text-sm font-semibold text-blue-slate-900 dark:text-blue-slate-100">
                {feat.title}
              </h3>
              <p className="text-sm text-blue-slate-600 dark:text-blue-slate-300">{feat.text}</p>
            </div>
          );
        })}
      </RevealSection>

      {/* ── Difficulty scale ── */}
      <RevealSection
        className="mt-4 rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-5"
        style={{ borderWidth: "0.5px" }}
      >
        <p className="font-mono text-xs text-[var(--signal-purple)] mb-1">// how it works</p>
        <h2 className="text-base font-semibold text-blue-slate-900 dark:text-blue-slate-100 mb-3">
          Every program gets a score from 0 to 100
        </h2>
        <p className="text-sm text-blue-slate-600 dark:text-blue-slate-300 mb-4">
          Four real criteria. Not just how much a company pays — but how crowded it is, how big the
          scope is, how many barriers stand between you and a valid report.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-slate-800 dark:text-blue-slate-100">
                Easy &nbsp;<span className="font-mono font-normal text-blue-slate-400">≥ 75</span>
              </p>
              <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400">Wide scope, low noise — start here</p>
            </div>
          </div>
          <ChevronRightIcon className="hidden sm:block w-4 h-4 text-blue-slate-300 dark:text-blue-slate-600 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-slate-800 dark:text-blue-slate-100">
                Intermediate &nbsp;<span className="font-mono font-normal text-blue-slate-400">45–74</span>
              </p>
              <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400">Some competition, manageable scope</p>
            </div>
          </div>
          <ChevronRightIcon className="hidden sm:block w-4 h-4 text-blue-slate-300 dark:text-blue-slate-600 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-slate-800 dark:text-blue-slate-100">
                Advanced &nbsp;<span className="font-mono font-normal text-blue-slate-400">&lt; 45</span>
              </p>
              <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400">Highly competitive, narrow targets</p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── Walkthroughs ── */}
      <RevealSection className="mt-4">
        <div className="flex flex-col items-center text-center gap-1 mb-3">
          <span className="font-mono text-xs text-[var(--signal-purple)]">// disclosed report walkthroughs</span>
          <h2 className="text-lg font-semibold text-blue-slate-900 dark:text-blue-slate-100">
            Learn from real bugs, step by step
          </h2>
          <p className="text-sm text-blue-slate-600 dark:text-blue-slate-300 max-w-md">
            Annotated breakdowns of real disclosed reports — written so you understand the exact thought
            process, not just the outcome.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {WALKTHROUGHS.map((w) => (
            <WalkthroughCard key={w.title} {...w} />
          ))}
        </div>

        <div className="flex justify-center mt-3">
          <Link
            to="/pro"
            className="inline-flex items-center px-4 py-2 rounded text-sm font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300 hover:border-evergreen-400 dark:hover:border-evergreen-500 transition-colors"
            style={{ borderWidth: "0.5px" }}
          >
            Coming soon to Pro
          </Link>
        </div>
      </RevealSection>

      {/* ── Final CTA ── */}
      <RevealSection className="mt-8 mb-4 flex flex-col items-center text-center gap-4">
        <h2 className="text-xl font-bold text-blue-slate-900 dark:text-blue-slate-100">
          Ready to find your first bug?
        </h2>
        <p className="text-sm text-blue-slate-600 dark:text-blue-slate-300 max-w-sm">
          Open the Easy row. Pick a program with a wide scope. Start hunting.
          That's it.
        </p>
        <Link
          to="/programs"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded text-sm font-semibold bg-evergreen-600 text-white dark:bg-evergreen-500 dark:text-evergreen-950 hover:bg-evergreen-700 dark:hover:bg-evergreen-400 transition-colors"
        >
          Browse Easy programs
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      </RevealSection>
    </main>
  );
}
