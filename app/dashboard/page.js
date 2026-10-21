import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatMoney,
  formatDate,
  FUND_LABELS,
  CATEGORY_LABELS,
} from "@/lib/format";
import { sendReceipt } from "./actions";

export default async function DashboardPage({ searchParams }) {
  const { error: receiptError, paid } = await searchParams;
  const supabase = await createClient();

  // Only treasurers may see this page. Everyone else goes to their own history.
  // (The database rules also stop non-treasurers from reading other people's gifts.)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "treasurer") {
    redirect("/history");
  }

  // Get every donation, newest first, along with the giver's name from profiles.
  const { data: donations, error } = await supabase
    .from("donations")
    .select(
      "id, user_id, amount, fund, given_on, receipt_number, profiles(full_name)"
    )
    .order("given_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="error">Could not load donations: {error.message}</p>;
  }

  // Every bill paid out of church funds, newest first, with who recorded it.
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("id, paid_on, payee, category, amount, fund, note, profiles(full_name)")
    .order("paid_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (paymentsError) {
    return <p className="error">Could not load payments: {paymentsError.message}</p>;
  }

  // Add up the totals for each fund, overall, and for this month.
  // Gift dates look like "2026-10-05", so this month's dates start with "2026-10".
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthName = new Date().toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });

  const fundTotals = { tithe: 0, offering: 0, building: 0 };
  let monthTotal = 0;
  for (const d of donations) {
    fundTotals[d.fund] += Number(d.amount);
    if (d.given_on.startsWith(thisMonth)) {
      monthTotal += Number(d.amount);
    }
  }
  const grandTotal = fundTotals.tithe + fundTotals.offering + fundTotals.building;

  // Balance for each fund: money given minus money paid out.
  const paidOut = { tithe: 0, offering: 0, building: 0 };
  for (const p of payments) {
    paidOut[p.fund] += Number(p.amount);
  }

  // A giver is anyone with at least one gift; count each person once.
  const giverCount = new Set(donations.map((d) => d.user_id)).size;

  // Bars are sized relative to the biggest fund, which fills the full width.
  const largestFund = Math.max(...Object.values(fundTotals));

  return (
    <section>
      <h1>Treasurer Dashboard</h1>
      <p className="lead">Every donation given to Invitation Hill SDA Church.</p>

      <div className="stat-grid">
        <div className="stat-card stat-card-total">
          <span className="stat-label">All funds</span>
          <span className="stat-value">{formatMoney(grandTotal)}</span>
          <span className="stat-detail">
            {donations.length} {donations.length === 1 ? "gift" : "gifts"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This month</span>
          <span className="stat-value">{formatMoney(monthTotal)}</span>
          <span className="stat-detail">{monthName}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Number of givers</span>
          <span className="stat-value">{giverCount}</span>
          <span className="stat-detail">
            {giverCount === 1 ? "person has" : "people have"} given
          </span>
        </div>
      </div>

      {paid && (
        <p className="notice" role="status">
          Payment recorded. Demo only: no money was sent.
        </p>
      )}

      <div className="section-header">
        <h2 className="section-heading">Fund Balances</h2>
        <Link href="/pay" className="button button-gold button-small">
          Pay a bill
        </Link>
      </div>
      <div className="fund-totals fund-balances">
        {Object.keys(FUND_LABELS).map((fund) => {
          const balance = fundTotals[fund] - paidOut[fund];
          return (
            <div key={fund} className={`fund-total fund-total-${fund}`}>
              <span className="stat-label">{FUND_LABELS[fund]}</span>
              <span
                className={`fund-total-value${balance < 0 ? " is-negative" : ""}`}
              >
                {formatMoney(balance)}
              </span>
              <span className="stat-detail">
                {formatMoney(fundTotals[fund])} given −{" "}
                {formatMoney(paidOut[fund])} paid
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="section-heading">Totals by Fund</h2>
      <ul className="bar-chart">
        {Object.keys(FUND_LABELS).map((fund) => {
          const total = fundTotals[fund];
          const width = largestFund > 0 ? (total / largestFund) * 100 : 0;
          const share = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
          return (
            <li
              key={fund}
              className="bar-row"
              title={`${FUND_LABELS[fund]}: ${formatMoney(total)} (${share}% of all giving)`}
            >
              <span className="bar-label">{FUND_LABELS[fund]}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${width}%` }} />
              </span>
              <span className="bar-value">
                {formatMoney(total)}
                <span className="bar-share">{share}%</span>
              </span>
            </li>
          );
        })}
      </ul>

      <h2 className="section-heading">All Gifts</h2>
      {receiptError && <p className="error">{receiptError}</p>}
      {donations.length === 0 ? (
        <p>No donations yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table table-stack">
            <thead>
              <tr>
                <th>Date</th>
                <th>Giver</th>
                <th>Fund</th>
                <th className="num">Amount</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td className="cell-date">{formatDate(d.given_on)}</td>
                  <td className="cell-giver">{d.profiles?.full_name}</td>
                  <td className="cell-fund">
                    <span className={`fund-tag fund-${d.fund}`}>
                      {FUND_LABELS[d.fund]}
                    </span>
                  </td>
                  <td className="num cell-amount">{formatMoney(d.amount)}</td>
                  <td className="cell-receipt">
                    {d.receipt_number ? (
                      <Link href={`/receipt/${d.id}`} className="receipt-sent">
                        Receipt sent · {d.receipt_number}
                      </Link>
                    ) : (
                      <form action={sendReceipt}>
                        <input type="hidden" name="donation_id" value={d.id} />
                        <button type="submit" className="button button-small">
                          Send receipt
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-header section-header-spaced">
        <h2 className="section-heading">Payments Out</h2>
        <Link href="/pay" className="button button-small">
          Pay a bill
        </Link>
      </div>
      {payments.length === 0 ? (
        <p className="empty-note">No payments recorded yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table table-stack table-stack-payments">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee</th>
                <th>Category</th>
                <th>From fund</th>
                <th className="num">Amount</th>
                <th>Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="cell-date">{formatDate(p.paid_on)}</td>
                  <td className="cell-payee">
                    <span className="payee-name">{p.payee}</span>
                    {p.note && <span className="payment-note">{p.note}</span>}
                  </td>
                  <td className="cell-category">{CATEGORY_LABELS[p.category]}</td>
                  <td className="cell-fund">
                    <span className={`fund-tag fund-${p.fund}`}>
                      {FUND_LABELS[p.fund]}
                    </span>
                  </td>
                  <td className="num cell-amount">−{formatMoney(p.amount)}</td>
                  <td className="cell-recorder">{p.profiles?.full_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
