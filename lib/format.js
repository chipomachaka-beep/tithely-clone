// Small helpers for showing money, dates and fund names the same way everywhere.

export function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Dates come from the database as "2026-10-05". Reading them as UTC keeps
// them from shifting a day depending on the viewer's time zone.
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const FUND_LABELS = {
  tithe: "Tithe",
  offering: "Offering",
  building: "Building Fund",
};
