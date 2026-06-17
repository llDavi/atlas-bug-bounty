import ProUpsell from "../components/ProUpsell";

export default function ProPage() {
  return (
    <main className="px-4 py-4 max-w-4xl mx-auto">
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300"
        style={{ borderWidth: "0.5px" }}
      >
        Atlas Pro
      </span>

      <h1 className="text-2xl font-bold text-blue-slate-900 dark:text-blue-slate-100 mt-2">
        Unlock Atlas Pro
      </h1>
      <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400 mt-1 max-w-2xl">
        Live alerts, full target lists, advanced search and API access. All while keeping Atlas's core features free.
      </p>

      <div className="mt-4">
        <ProUpsell
          title="What's included in Pro"
          description="Everything you need to never miss a new program or scope change."
        />
      </div>
    </main>
  );
}
