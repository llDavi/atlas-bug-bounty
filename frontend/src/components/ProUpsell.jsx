import { useState } from "react";
import { useUser, useAuth, SignInButton } from "@clerk/clerk-react";
import { MessageIcon, KeyIcon, HeartIcon, CheckIcon, LockIcon, SparklesIcon } from "./icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const FEATURES = [
  { title: "Live program notifications.", text: "Get notified the moment a new program goes public." },
  { title: "Live target notifications.", text: "Track scope additions and updates in real time." },
  { title: "Full targets + search.", text: "Search the complete target lists with eligibility details." },
  { title: "Pro API access.", text: "Generate an API key and fetch programs, targets and scope changes." },
];

export default function ProUpsell({ title, description }) {
  const [plan, setPlan] = useState("yearly");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Could not start checkout");
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="relative rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 bg-blue-slate-50/50 dark:bg-blue-slate-800/70 p-4 sm:p-6"
      style={{ borderWidth: "0.5px" }}
    >
      <div
        className="hidden sm:flex absolute -left-4 top-6 items-center justify-center w-9 h-9 rounded-full border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300"
        style={{ borderWidth: "0.5px" }}
      >
        <LockIcon className="w-4 h-4" />
      </div>
      <SparklesIcon className="hidden sm:block absolute right-6 top-6 w-5 h-5 text-evergreen-300 dark:text-evergreen-700" />

      <h2 className="text-lg font-semibold text-blue-slate-900 dark:text-blue-slate-100 pr-8">{title}</h2>
      <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400 mt-1 max-w-2xl">{description}</p>

      <div className="flex flex-col gap-2 mt-4">
        <div
          className="flex items-start gap-3 rounded-lg border border-amethyst-smoke-200 bg-amethyst-smoke-50 dark:border-amethyst-smoke-800 dark:bg-amethyst-smoke-950 p-3"
          style={{ borderWidth: "0.5px" }}
        >
          <span
            className="flex items-center justify-center w-8 h-8 rounded shrink-0 bg-amethyst-smoke-100 text-amethyst-smoke-700 dark:bg-amethyst-smoke-900 dark:text-amethyst-smoke-300"
          >
            <MessageIcon className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-blue-slate-900 dark:text-blue-slate-100">Delivered via Discord</p>
            <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-0.5">
              For now, notifications are sent through a dedicated channel on the Atlas Discord server.
            </p>
          </div>
        </div>

        <div
          className="flex items-start gap-3 rounded-lg border border-evergreen-200 bg-evergreen-50 dark:border-evergreen-800 dark:bg-evergreen-950 p-3"
          style={{ borderWidth: "0.5px" }}
        >
          <span
            className="flex items-center justify-center w-8 h-8 rounded shrink-0 bg-evergreen-100 text-evergreen-700 dark:bg-evergreen-900 dark:text-evergreen-300"
          >
            <KeyIcon className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-blue-slate-900 dark:text-blue-slate-100">Pro API access</p>
            <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-0.5">
              Generate an API key and fetch programs, targets and scope changes with full Pro access.
            </p>
          </div>
        </div>

        <div
          className="flex items-start gap-3 rounded-lg border border-amethyst-smoke-200 bg-amethyst-smoke-50 dark:border-amethyst-smoke-800 dark:bg-amethyst-smoke-950 p-3"
          style={{ borderWidth: "0.5px" }}
        >
          <span
            className="flex items-center justify-center w-8 h-8 rounded shrink-0 bg-amethyst-smoke-100 text-amethyst-smoke-700 dark:bg-amethyst-smoke-900 dark:text-amethyst-smoke-300"
          >
            <HeartIcon className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-blue-slate-900 dark:text-blue-slate-100">Core features stay free</p>
            <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-0.5">
              Pro supports development and hosting in exchange for extra perks.
            </p>
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5 mt-4">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex items-start gap-2 text-sm">
            <CheckIcon className="w-4 h-4 text-evergreen-600 dark:text-evergreen-400 shrink-0 mt-0.5" />
            <span className="text-blue-slate-700 dark:text-blue-slate-300">
              <span className="font-medium text-blue-slate-900 dark:text-blue-slate-100">{f.title}</span> {f.text}
            </span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <button
          type="button"
          onClick={() => setPlan("monthly")}
          className={`text-left rounded-lg border p-4 transition-colors ${
            plan === "monthly"
              ? "border-evergreen-400 dark:border-evergreen-500"
              : "border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-900/40"
          }`}
          style={{ borderWidth: "0.5px" }}
        >
          <p className="text-sm font-medium text-blue-slate-900 dark:text-blue-slate-100">Monthly</p>
          <p className="mt-1">
            <span className="text-2xl font-semibold text-blue-slate-900 dark:text-blue-slate-100">€8.99</span>
            <span className="text-sm text-blue-slate-400 dark:text-blue-slate-500"> /month</span>
          </p>
          <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-1">Flexible, cancel anytime.</p>
        </button>

        <button
          type="button"
          onClick={() => setPlan("yearly")}
          className={`relative text-left rounded-lg border p-4 transition-colors ${
            plan === "yearly"
              ? "border-evergreen-400 dark:border-evergreen-500"
              : "border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-900/40"
          }`}
          style={{ borderWidth: "0.5px" }}
        >
          <span
            className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300"
            style={{ borderWidth: "0.5px" }}
          >
            Best value
          </span>
          <p className="text-sm font-medium text-blue-slate-900 dark:text-blue-slate-100">Yearly</p>
          <p className="mt-1">
            <span className="text-2xl font-semibold text-blue-slate-900 dark:text-blue-slate-100">€89</span>
            <span className="text-sm text-blue-slate-400 dark:text-blue-slate-500"> /year</span>
          </p>
          <p className="text-xs text-blue-slate-500 dark:text-blue-slate-400 mt-1">Two months free compared to monthly.</p>
          {plan === "yearly" && (
            <p className="text-xs font-medium text-evergreen-600 dark:text-evergreen-400 mt-1">Selected plan</p>
          )}
        </button>
      </div>

      <label className="flex items-center gap-2 mt-4 text-sm text-blue-slate-600 dark:text-blue-slate-300">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-4 h-4 rounded border-blue-slate-300 dark:border-blue-slate-600 accent-evergreen-600"
        />
        I agree to the{" "}
        <a href="#" className="underline hover:text-evergreen-600 dark:hover:text-evergreen-400">Terms of Service</a>
        {" "}and{" "}
        <a href="#" className="underline hover:text-evergreen-600 dark:hover:text-evergreen-400">Payment Policy</a>{"."}
      </label>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {isSignedIn ? (
        <button
          type="button"
          disabled={!agreed || loading}
          onClick={handleCheckout}
          className="w-full mt-3 px-4 py-2 rounded text-sm font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300 hover:border-evergreen-400 dark:hover:border-evergreen-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ borderWidth: "0.5px" }}
        >
          {loading ? "Redirecting to checkout..." : `Continue with the ${plan === "yearly" ? "yearly plan" : "monthly plan"}`}
        </button>
      ) : (
        <SignInButton mode="modal">
          <button
            type="button"
            disabled={!agreed}
            className="w-full mt-3 px-4 py-2 rounded text-sm font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300 hover:border-evergreen-400 dark:hover:border-evergreen-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ borderWidth: "0.5px" }}
          >
            Sign in to continue
          </button>
        </SignInButton>
      )}
    </div>
  );
}
