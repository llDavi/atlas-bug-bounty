/* Which engraving stands for which order of beast. Loose on purpose: the
   archive's vuln_class strings come from the platforms, not from us. */
export function markForClass(vulnClass = "") {
  const v = String(vulnClass).toLowerCase();
  if (v.includes("xss") || v.includes("script")) return "serpent";
  if (v.includes("idor") || v.includes("access")) return "gate";
  if (v.includes("ssrf") || v.includes("request")) return "raven";
  if (v.includes("sql") || v.includes("inject")) return "hydra";
  if (v.includes("redirect")) return "signpost";
  if (v.includes("logic") || v.includes("business")) return "crown";
  if (v.includes("deserial")) return "worm";
  return "key";
}
