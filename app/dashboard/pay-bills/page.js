import {
  formatMoney,
  formatDate,
  FUND_LABELS,
  CATEGORY_LABELS,
} from "@/lib/format";
import { requireTreasurer, loadPayments } from "@/lib/treasurer";
import Link from "next/link";
import { recordPayment } from "./actions";

export const metadata = {
  title: "Pay Bills",
};

// Suggestions shown as you type the payee; any other name works too.
const COMMON_PAYEES = ["MDU", "City of Dickinson"];

export default async function PayBillsPage({ searchParams }) {
  const { error, paid, edited, deleted } = await searchParams;
  const { supabase } = await requireTreasurer();
  const payments = await loadPayments(supabase);

  return (
    <section>
      <h1>Pay Bills</h1>
      <p className="lead">Record bills paid from a church fund, and see every payment made.</p>

      {paid && (
        <p className="notice" role="status">
          Payment recorded. Demo only: no money was sent.
        </p>
      )}
      {edited && (
        <p className="notice" role="status">
          Payment updated. The change is saved in the Change History.
        </p>
      )}
      {deleted && (
        <p className="notice" role="status">
          Payment deleted. The change is saved in the Change History.
        </p>
      )}

      <div className="form-card">
        <h2 className="section-heading">Pay a bill</h2>
        {error && <p className="error">{error}</p>}

        <form action={recordPayment} className="form">
          <label>
            Payee
            <input
              name="payee"
              type="text"
              required
              maxLength={100}
              list="common-payees"
              placeholder="e.g. MDU"
            />
            <datalist id="common-payees">
              {COMMON_PAYEES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>

          <div className="form-row">
            <label>
              Category
              <select name="category" required defaultValue="">
                <option value="" disabled>
                  Choose a category
                </option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Amount
              <span className="money-input">
                <span className="dollar-sign">$</span>
                <input
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </span>
            </label>
          </div>

          <label>
            Paid from fund
            <select name="fund" required defaultValue="">
              <option value="" disabled>
                Choose a fund
              </option>
              {Object.entries(FUND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Note <span className="optional">(optional)</span>
            <input
              name="note"
              type="text"
              maxLength={200}
              placeholder="e.g. October electric bill"
            />
          </label>

          <button type="submit" className="button button-gold give-submit">
            Record payment
          </button>
          <p className="demo-note">Demo only: no money is sent.</p>
        </form>
      </div>

      <h2 className="section-heading section-heading-spaced">Payments Made</h2>
      {payments.length === 0 ? (
        <p className="empty-note">No payments recorded yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table table-stack table-stack-payments">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee</th>
                <th>From fund</th>
                <th className="num">Amount</th>
                <th>Recorded by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="cell-date">{formatDate(p.paid_on)}</td>
                  <td className="cell-payee">
                    <span className="payee-name">{p.payee}</span>
                    <span className="payment-note">
                      {CATEGORY_LABELS[p.category]}
                      {p.note && ` · ${p.note}`}
                    </span>
                  </td>
                  <td className="cell-fund">
                    <span className={`fund-tag fund-${p.fund}`}>
                      {FUND_LABELS[p.fund]}
                    </span>
                  </td>
                  <td className="num cell-amount">−{formatMoney(p.amount)}</td>
                  <td className="cell-recorder">{p.profiles?.full_name}</td>
                  <td className="cell-actions">
                    <Link
                      href={`/dashboard/pay-bills/${p.id}`}
                      className="edit-link"
                      aria-label={`Edit the ${formatMoney(p.amount)} payment to ${p.payee}`}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
