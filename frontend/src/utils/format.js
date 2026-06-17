export function formatPayoutShort(amount, currency) {
  const symbol = currency === "EUR" ? "€" : "$";
  if (amount >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `${symbol}${amount}`;
}
