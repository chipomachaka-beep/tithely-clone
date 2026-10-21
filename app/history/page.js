import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate, formatMethod, FUND_LABELS } from "@/lib/format";
import { groupByMonth, giftCount } from "@/lib/months";

export default async function HistoryPage({ searchParams }) {
  const { gave } = await searchParams;
  const supabase = await createClient();

  // Only signed-in people have a giving history.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Just this person's gifts, newest first.
  const { data: donations, error } = await supabase
    .from("donations")
    .select("id, amount, fund, given_on, method, check_number, receipt_number")
    .eq("user_id", user.id)
    .order("given_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="error">Could not load your gifts: {error.message}</p>;
  }

  // Months the treasurer has sent this person a statement for, like "2026-10".
  const { data: statements } = await supabase
    .from("statements")
    .select("month")
    .eq("user_id", user.id);
  const sentMonths = new Set((statements ?? []).map((s) => s.month));

  const months = groupByMonth(donations);

  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  // My total for each fund.
  const fundTotals = { tithe: 0, offering: 0, building: 0 };
  for (const d of donations) {
    fundTotals[d.fund] += Number(d.amount);
  }

  return (
    <section>
      {gave && (
        <div className="thank-you" role="status">
          <span className="thank-you-check">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <h2>Thank you, your gift has been recorded</h2>
        </div>
      )}

      <h1>My Giving</h1>
      <p className="lead">Thank you for your faithful generosity.</p>

      <div className="stat-card">
        <span className="stat-label">Total given</span>
        <span className="stat-value">{formatMoney(total)}</span>
      </div>

      <div className="fund-totals">
        {Object.keys(FUND_LABELS).map((fund) => (
          <div key={fund} className={`fund-total fund-total-${fund}`}>
            <span className="stat-label">{FUND_LABELS[fund]}</span>
            <span className="fund-total-value">
              {formatMoney(fundTotals[fund])}
            </span>
          </div>
        ))}
      </div>

      {donations.length === 0 ? (
        <p>
          You haven&apos;t given yet. <Link href="/give">Give now</Link>
        </p>
      ) : (
        // One section per month, newest first. Only the newest starts open.
        months.map((month, index) => (
          <details key={month.key} className="month-group" open={index === 0}>
            <summary className="month-summary">
              <span className="month-title">
                <strong>{month.name}</strong>: {giftCount(month.gifts.length)},{" "}
                {formatMoney(month.total)}
              </span>
              {sentMonths.has(month.key) ? (
                <span className="month-statement">
                  <span className="statement-ready">Statement available</span>
                  <Link href={`/statement/${month.key}`}>View statement</Link>
                </span>
              ) : (
                <span className="statement-pending">Statement pending</span>
              )}
            </summary>
            <div className="table-wrap">
              <table className="table table-stack table-stack-mine">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Fund</th>
                    <th>Method</th>
                    <th className="num">Amount</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {month.gifts.map((d) => (
                    <tr key={d.id}>
                      <td className="cell-date">{formatDate(d.given_on)}</td>
                      <td className="cell-fund">
                        <span className={`fund-tag fund-${d.fund}`}>
                          {FUND_LABELS[d.fund]}
                        </span>
                      </td>
                      <td className="cell-method">
                        {formatMethod(d.method, d.check_number)}
                      </td>
                      <td className="num cell-amount">{formatMoney(d.amount)}</td>
                      <td className="cell-receipt">
                        {d.receipt_number ? (
                          <Link href={`/receipt/${d.id}`}>View receipt</Link>
                        ) : (
                          <span className="receipt-pending">Receipt pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))
      )}
    </section>
  );
}
