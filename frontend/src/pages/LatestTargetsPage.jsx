import ProUpsell from "../components/ProUpsell";

export default function LatestTargetsPage() {
  return (
    <main className="px-4 py-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-slate-900 dark:text-blue-slate-100">
        Latest Targets
      </h1>
      <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400 mt-1 max-w-2xl">
        Track new targets and scope expansions recently added across all supported platforms.
      </p>

      <div className="mt-4">
        <ProUpsell
          title="Real-time alerts for new programs and target changes"
          description="Stay up to date with notifications on new programs, live target updates, full target visibility and Pro API access."
        />
      </div>
    </main>
  );
}
