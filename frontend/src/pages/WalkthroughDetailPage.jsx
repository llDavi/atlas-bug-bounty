import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser, useAuth, SignInButton } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LockIcon, ChevronLeftIcon } from "../components/icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DIFF_COLORS = {
  easy:   "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800",
  medium: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
  hard:   "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
};
const DIFF_LABELS = { easy: "Easy", medium: "Intermediate", hard: "Advanced" };

function ProGate({ isSignedIn }) {
  return (
    <div className="relative mt-6">
      {/* blurred preview of fake content */}
      <div className="select-none pointer-events-none blur-sm opacity-60 space-y-4 text-sm text-blue-slate-700 dark:text-blue-slate-300">
        <h2 className="text-base font-semibold">The Recon</h2>
        <p>The first 45 minutes were spent on passive mapping: browsing the app as a free user, watching Burp Suite capture every request. Three things stood out immediately about the way the application handled resource identifiers...</p>
        <pre className="rounded bg-blue-slate-100 dark:bg-blue-slate-800 p-3 text-xs overflow-x-auto">
          {`GET /api/v1/invoices/102842 HTTP/1.1\nHost: api.target.com\nAuthorization: Bearer eyJ0eXAiOiJKV1Q...`}
        </pre>
        <h2 className="text-base font-semibold">The "Wait a Second..." Moment</h2>
        <p>After noticing the sequential IDs, the next step was simple: request a resource that belonged to a different account. The response came back 200 OK — with someone else's data. No error, no redirect, no rate limiting...</p>
        <h2 className="text-base font-semibold">The Exploit</h2>
        <p>To demonstrate impact beyond a single record, a simple script iterated through a range of IDs. The output showed dozens of valid records, all from different customers...</p>
      </div>

      {/* overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-blue-slate-50/80 dark:via-blue-slate-950/80 to-blue-slate-50 dark:to-blue-slate-950">
        <div
          className="flex flex-col items-center gap-4 rounded-xl border border-blue-slate-200 dark:border-blue-slate-700 bg-white dark:bg-blue-slate-900 p-8 shadow-xl text-center max-w-sm"
          style={{ borderWidth: "0.5px" }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-slate-100 dark:bg-blue-slate-800">
            <LockIcon className="w-5 h-5 text-blue-slate-500 dark:text-blue-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-blue-slate-900 dark:text-blue-slate-100">
              Full walkthrough — Pro only
            </p>
            <p className="mt-1 text-sm text-blue-slate-500 dark:text-blue-slate-400">
              The complete recon, exploit chain, report template and takeaways are available to Pro members.
            </p>
          </div>
          {isSignedIn ? (
            <Link
              to="/pro"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded text-sm font-semibold bg-evergreen-600 text-white dark:bg-evergreen-500 dark:text-evergreen-950 hover:bg-evergreen-700 dark:hover:bg-evergreen-400 transition-colors"
            >
              Upgrade to Pro
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded text-sm font-semibold bg-evergreen-600 text-white dark:bg-evergreen-500 dark:text-evergreen-950 hover:bg-evergreen-700 dark:hover:bg-evergreen-400 transition-colors"
              >
                Sign in to unlock
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}

const mdComponents = {
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-blue-slate-900 dark:text-blue-slate-100 mt-8 mb-2 pb-1 border-b border-blue-slate-100 dark:border-blue-slate-800" style={{ borderWidth: "0.5px" }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-blue-slate-800 dark:text-blue-slate-200 mt-4 mb-1">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-blue-slate-700 dark:text-blue-slate-300 leading-relaxed mb-3">{children}</p>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="px-1 py-0.5 rounded text-xs font-mono bg-blue-slate-100 dark:bg-blue-slate-800 text-blue-slate-700 dark:text-blue-slate-300">
        {children}
      </code>
    ) : (
      <code>{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="rounded-lg bg-blue-slate-100 dark:bg-blue-slate-800 p-4 text-xs font-mono overflow-x-auto mb-3 leading-relaxed">
      {children}
    </pre>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-sm text-blue-slate-700 dark:text-blue-slate-300 space-y-1 mb-3 ml-2">
      {children}
    </ul>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-blue-slate-900 dark:text-blue-slate-100">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-evergreen-500 pl-3 my-3 text-sm text-blue-slate-500 dark:text-blue-slate-400 italic">
      {children}
    </blockquote>
  ),
};

export default function WalkthroughDetailPage() {
  const { slug } = useParams();
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const isPro = user?.publicMetadata?.is_pro === true;

  const [meta, setMeta] = useState(null);
  const [body, setBody] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingBody, setLoadingBody] = useState(false);
  const [error, setError] = useState(null);

  // Always load the public list to get metadata + teaser
  useEffect(() => {
    fetch(`${API_URL}/api/walkthroughs`)
      .then((r) => r.json())
      .then((list) => {
        const found = list.find((w) => w.slug === slug);
        if (!found) setError("Walkthrough not found");
        else setMeta(found);
      })
      .catch(() => setError("Failed to load walkthrough"))
      .finally(() => setLoadingMeta(false));
  }, [slug]);

  // If user is Pro, load the full body
  useEffect(() => {
    if (!isLoaded || !isPro || !slug) return;
    setLoadingBody(true);
    getToken().then((token) => {
      if (!token) {
        setError("Session token unavailable — try refreshing the page");
        setLoadingBody(false);
        return;
      }
      fetch(`${API_URL}/api/walkthroughs/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => {
          if (!r.ok) return r.json().then((e) => { throw new Error(e.detail || r.status); });
          return r.json();
        })
        .then((data) => setBody(data.body))
        .catch((e) => setError(`Failed to load content: ${e.message}`))
        .finally(() => setLoadingBody(false));
    });
  }, [isLoaded, isPro, slug]);

  if (loadingMeta) {
    return (
      <main className="px-4 py-6 max-w-3xl mx-auto">
        <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400">Loading...</p>
      </main>
    );
  }

  if (error || !meta) {
    return (
      <main className="px-4 py-6 max-w-3xl mx-auto">
        <p className="text-sm text-red-500">{error || "Not found"}</p>
      </main>
    );
  }

  const diffClass = DIFF_COLORS[meta.difficulty] || DIFF_COLORS.hard;

  return (
    <main className="px-4 py-6 max-w-3xl mx-auto">
      <Link
        to="/walkthroughs"
        className="inline-flex items-center gap-1 text-xs text-blue-slate-400 dark:text-blue-slate-500 hover:text-blue-slate-700 dark:hover:text-blue-slate-300 mb-5 transition-colors"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5" />
        Walkthroughs
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${diffClass}`} style={{ borderWidth: "0.5px" }}>
            {DIFF_LABELS[meta.difficulty] || meta.difficulty}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-blue-slate-100 dark:bg-blue-slate-800 text-blue-slate-600 dark:text-blue-slate-300">
            {meta.vuln_class}
          </span>
          <span className="text-xs text-blue-slate-400 dark:text-blue-slate-500">{meta.platform}</span>
        </div>

        <h1 className="text-xl font-bold text-blue-slate-900 dark:text-blue-slate-100 mb-2">
          {meta.title}
        </h1>
        <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400 max-w-xl">
          {meta.teaser}
        </p>

        <div
          className="flex items-center gap-6 mt-4 pt-4 border-t border-blue-slate-100 dark:border-blue-slate-800"
          style={{ borderWidth: "0.5px" }}
        >
          <div>
            <p className="text-xs text-blue-slate-400 dark:text-blue-slate-500">Bounty paid</p>
            <p className="text-sm font-semibold text-evergreen-600 dark:text-evergreen-400">
              ${meta.bounty?.toLocaleString("en-US")}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-slate-400 dark:text-blue-slate-500">Program</p>
            <p className="text-sm text-blue-slate-700 dark:text-blue-slate-300">{meta.program}</p>
          </div>
          <div>
            <p className="text-xs text-blue-slate-400 dark:text-blue-slate-500">Published</p>
            <p className="text-sm text-blue-slate-700 dark:text-blue-slate-300">{meta.published_at}</p>
          </div>
          {meta.source_url && (
            <div className="ml-auto">
              <a
                href={meta.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-slate-400 dark:text-blue-slate-500 hover:text-evergreen-600 dark:hover:text-evergreen-400 transition-colors underline underline-offset-2"
              >
                Original report ↗
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isPro && loadingBody && (
        <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400">Loading full content...</p>
      )}

      {isPro && body && !loadingBody && (
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {body}
          </ReactMarkdown>
        </article>
      )}

      {!isPro && <ProGate isSignedIn={isSignedIn} />}
    </main>
  );
}
