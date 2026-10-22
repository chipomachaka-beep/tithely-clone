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

// Long form for receipts: "October 20, 2026".
export function formatLongDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// For moments in time (like when a receipt was issued), shown as the date
// at the church, so an evening receipt isn't dated tomorrow.
export function formatLongDateAt(timestamp, timeZone) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export const FUND_LABELS = {
  tithe: "Tithe",
  offering: "Offering",
  building: "Building Fund",
};

export const METHOD_LABELS = {
  online: "Online",
  text: "Text",
  cash: "Cash",
  check: "Check",
};

// Cash and check gifts come from the offering envelope and are recorded by the
// treasurer; online and text gifts are given by members themselves.
export function isEnvelopeGift(method) {
  return method === "cash" || method === "check";
}

// "Online", "Cash", or "Check #1042".
export function formatMethod(method, checkNumber) {
  if (method === "check" && checkNumber) {
    return `Check #${checkNumber}`;
  }
  return METHOD_LABELS[method] ?? "Online";
}

export const CATEGORY_LABELS = {
  electricity: "Electricity",
  water: "Water",
  other: "Other",
};
