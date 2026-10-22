// Turns change history rows into readable lines, e.g.
// "Amount: $120.00 → $125.00".
import { formatMoney, formatDate, FUND_LABELS, CATEGORY_LABELS, METHOD_LABELS } from "@/lib/format";

const FIELD_LABELS = {
  paid_on: "Date",
  given_on: "Gift date",
  payee: "Payee",
  category: "Category",
  amount: "Amount",
  fund: "Fund",
  note: "Note",
  user_id: "Member",
  method: "Method",
  check_number: "Check number",
};

// Fields worth showing when a whole row was deleted, in this order.
const DELETED_FIELDS = {
  payment: ["paid_on", "payee", "category", "amount", "fund", "note"],
  gift: ["user_id", "given_on", "amount", "fund", "method", "check_number"],
};

// `names` maps member ids to names, for the Member field.
function formatValue(field, value, names) {
  if (value === null || value === undefined || value === "") return "(none)";
  switch (field) {
    case "amount":
      return formatMoney(value);
    case "paid_on":
    case "given_on":
      return formatDate(value);
    case "fund":
      return FUND_LABELS[value] ?? value;
    case "category":
      return CATEGORY_LABELS[value] ?? value;
    case "method":
      return METHOD_LABELS[value] ?? value;
    case "user_id":
      return names[value] ?? "Unknown member";
    default:
      return String(value);
  }
}

// One change history row -> list of readable lines.
export function describeChange(row, names) {
  if (row.action === "delete") {
    const deleted = row.changes.deleted ?? {};
    return DELETED_FIELDS[row.record_type]
      .filter((field) => deleted[field] !== null && deleted[field] !== "")
      .map((field) => `${FIELD_LABELS[field]}: ${formatValue(field, deleted[field], names)}`);
  }
  return Object.entries(row.changes).map(
    ([field, { from, to }]) =>
      `${FIELD_LABELS[field] ?? field}: ${formatValue(field, from, names)} → ${formatValue(field, to, names)}`
  );
}

// "Payment to MDU" / "Gift from Maria Lopez"
export function describeRecord(row) {
  return row.record_type === "payment" ? `Payment to ${row.summary}` : `Gift from ${row.summary}`;
}
