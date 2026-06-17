import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { CheckIcon } from "../components/icons";

export default function ProSuccessPage() {
  const { user } = useUser();
  const [isPro, setIsPro] = useState(user?.publicMetadata?.is_pro === true);

  // The Stripe webhook flips is_pro a moment after redirect — poll a few times
  // by reloading the Clerk user until it shows up, instead of forcing a manual refresh.
  useEffect(() => {
    if (isPro || !user) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      await user.reload();
      if (user.publicMetadata?.is_pro === true) {
        setIsPro(true);
        clearInterval(interval);
      }
      if (attempts >= 8) clearInterval(interval);
    }, 1500);
    return () => clearInterval(interval);
  }, [isPro, user]);

  return (
    <main className="px-4 py-16 max-w-lg mx-auto text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-evergreen-50 dark:bg-evergreen-950 text-evergreen-600 dark:text-evergreen-400 mb-4">
        <CheckIcon className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-blue-slate-900 dark:text-blue-slate-100">
        {isPro ? "You're Pro now" : "Payment received"}
      </h1>
      <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400 mt-2">
        {isPro
          ? "Full walkthroughs, live notifications and Pro API access are unlocked."
          : "Activating your Pro access — this usually takes a few seconds."}
      </p>
      <Link
        to="/walkthroughs"
        className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 rounded text-sm font-semibold bg-evergreen-600 text-white dark:bg-evergreen-500 dark:text-evergreen-950 hover:bg-evergreen-700 dark:hover:bg-evergreen-400 transition-colors"
      >
        Browse walkthroughs
      </Link>
    </main>
  );
}
