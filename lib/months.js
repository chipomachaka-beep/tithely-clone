// Helpers for grouping gifts by month. Gift dates look like "2026-10-05",
// so a gift's month is its first 7 characters: "2026-10".

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonthKey(value) {
  return typeof value === "string" && MONTH_PATTERN.test(value);
}

// "2026-10" -> "October 2026"
export function monthName(monthKey) {
  return new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

// "2026-10" -> { first: "2026-10-01", next: "2026-11-01" }, for date filters.
export function monthRange(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  return { first: `${monthKey}-01`, next: `${next}-01` };
}

// Groups gifts (already sorted newest first) into months, newest month first:
// [{ key: "2026-10", name: "October 2026", gifts: [...], total: 115 }, ...]
export function groupByMonth(gifts) {
  const groups = [];
  for (const gift of gifts) {
    const key = gift.given_on.slice(0, 7);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, name: monthName(key), gifts: [], total: 0 };
      groups.push(group);
    }
    group.gifts.push(gift);
    group.total += Number(gift.amount);
  }
  return groups.sort((a, b) => b.key.localeCompare(a.key));
}

// "3 gifts" / "1 gift"
export function giftCount(n) {
  return `${n} ${n === 1 ? "gift" : "gifts"}`;
}
