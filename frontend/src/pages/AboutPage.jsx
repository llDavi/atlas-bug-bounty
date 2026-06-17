export default function AboutPage() {
  return (
    <main className="px-4 py-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-slate-900 dark:text-blue-slate-100">
        About us
      </h1>

      <div className="mt-4 rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4 flex flex-col gap-3 text-sm text-blue-slate-700 dark:text-blue-slate-300" style={{ borderWidth: "0.5px" }}>
        <p>
          Atlas is an aggregator of public bug bounty programs, built to help security researchers quickly find new targets to work on.
        </p>
        <p>
          We collect programs from platforms like HackerOne, Bugcrowd, Intigriti and YesWeHack, showing rewards, scope, program type and accessibility in a single place.
        </p>
        <p>
          Our goal is to offer a clear, distraction-free view: no heavy graphics, just the information you need to decide where to invest your time.
        </p>
        <p>
          Atlas is still under active development: new features, like Pro access and a community rating system, are on the way.
        </p>
      </div>
    </main>
  );
}
