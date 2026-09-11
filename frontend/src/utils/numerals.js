/* Roman numerals, as a scribe would set them: I, IV, IX, XII, XL… */

const VALUES = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

export function roman(n) {
  let out = "";
  let rest = Math.max(0, Math.floor(Number(n) || 0));
  for (const [v, s] of VALUES) while (rest >= v) { out += s; rest -= v; }
  return out || "—";
}
