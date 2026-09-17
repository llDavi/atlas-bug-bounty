import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RuleHead } from "./Codex";

/* Markdown set as a page of the codex: ruled section heads, transcripts
   typed and pasted in, block quotes in the margin hand. */
const marks = {
  h1: ({ children }) => <h2 className="t-chapter mt-10 mb-4">{children}</h2>,
  h2: ({ children }) => <RuleHead quiet>{children}</RuleHead>,
  h3: ({ children }) => <h3 className="t-entry mt-8 mb-3">{children}</h3>,
  p: ({ children }) => <p className="t-body column-wide mb-5">{children}</p>,
  ul: ({ children }) => <ul className="column-wide mb-5 flex flex-col gap-2">{children}</ul>,
  ol: ({ children }) => <ol className="column-wide mb-5 flex flex-col gap-2">{children}</ol>,
  li: ({ children }) => (
    <li className="flex gap-3 items-baseline t-body">
      <span style={{ color: "var(--gold-leaf)" }}>✦</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong style={{ fontWeight: 600, color: "var(--ink-strong)" }}>{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="ink-link">{children}</a>
  ),
  code: ({ className, children }) =>
    className ? (
      <code>{children}</code>
    ) : (
      <code className="t-tech" style={{ background: "var(--paper-aged)", padding: "0.1em 0.35em", border: "1px solid var(--rule-soft)" }}>
        {children}
      </code>
    ),
  pre: ({ children }) => <pre className="typed column-wide mb-6">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="margin-note column-wide my-8" style={{ borderLeft: "2px solid var(--rubric)", paddingLeft: "1rem", transform: "none" }}>
      {children}
    </blockquote>
  ),
};

export default function Manuscript({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={marks}>
      {children}
    </ReactMarkdown>
  );
}
