import { useState } from "react";
import { ChevronDownIcon } from "../components/icons";

const FAQ_ITEMS = [
  {
    q: "What is Atlas?",
    a: "Atlas is an aggregator that collects public bug bounty programs from different platforms, showing reward, scope, type and accessibility in a single view.",
  },
  {
    q: "Is Atlas free?",
    a: "Yes, the core features (program list, filters, search) are and will remain free. Atlas Pro adds live alerts, full target lists and API access.",
  },
  {
    q: "How do the geo access flags work?",
    a: "The green flag means the program is accessible from your region, yellow means a VPN is required, and red means the program is blocked in your region.",
  },
  {
    q: "Can I suggest a program to add?",
    a: "Sure, use the \"Get Listed\" page to send us the details and we'll consider it for inclusion.",
  },
  {
    q: "How does Pro access work?",
    a: "A Pro subscription unlocks live notifications on Discord, the full target list for each program, and access to Atlas's API.",
  },
  {
    q: "Is a community rating system planned?",
    a: "Yes, we're working on a system to let the community rate programs and platforms, different from a simple upvote/downvote.",
  },
];

function FAQItem({ item, open, onToggle }) {
  return (
    <div className="rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70" style={{ borderWidth: "0.5px" }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-blue-slate-900 dark:text-blue-slate-100">
          {item.q}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-blue-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="px-4 pb-3 text-sm text-blue-slate-600 dark:text-blue-slate-300">
          {item.a}
        </p>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <main className="px-4 py-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-slate-900 dark:text-blue-slate-100">
        Frequently Asked Questions
      </h1>

      <div className="flex flex-col gap-2 mt-4">
        {FAQ_ITEMS.map((item, i) => (
          <FAQItem
            key={item.q}
            item={item}
            open={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </main>
  );
}
