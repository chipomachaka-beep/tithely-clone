import Link from "next/link";
import { formatMoney, FUND_LABELS } from "@/lib/format";
import {
  requireTreasurer,
  loadGifts,
  loadPayments,
  totalsBy,
  sum,
  churchMonth,
} from "@/lib/treasurer";

export const metadata = {
  title: "Overview",
};

const FUNDS = Object.keys(FUND_LABELS);

export default async function OverviewPage() {
  const { supabase } = await requireTreasurer();
  const [gifts, payments] = await Promise.all([
    loadGifts(supabase),
    loadPayments(supabase),
  ]);

  // Balance for each fund: money given minus money paid out.
  const givenByFund = totalsBy(gifts, "fund", FUNDS);
  const paidByFund = totalsBy(payments, "fund", FUNDS);

  // This month at the church. Dates look like "2026-10-05".
  const month = churchMonth();
  const giftsThisMonth = gifts.filter((g) => g.given_on.startsWith(month.prefix));
  const paymentsThisMonth = payments.filter((p) => p.paid_on.startsWith(month.prefix));
  const moneyIn = sum(giftsThisMonth);
  const moneyOut = sum(paymentsThisMonth);
  const net = moneyIn - moneyOut;

  return (
    <section>
      <h1>Overview</h1>
      <p className="lead">Where Invitation Hill SDA Church&apos;s funds stand today.</p>

      <h2 className="section-heading">Fund Balances</h2>
      <div className="fund-totals fund-balances">
        {FUNDS.map((fund) => {
          const balance = givenByFund[fund] - paidByFund[fund];
          return (
            <div key={fund} className={`fund-total fund-total-${fund}`}>
              <span className="stat-label">{FUND_LABELS[fund]}</span>
              <span
                className={`fund-total-value${balance < 0 ? " is-negative" : ""}`}
              >
                {formatMoney(balance)}
              </span>
              <span className="stat-detail">
                {formatMoney(givenByFund[fund])} given −{" "}
                {formatMoney(paidByFund[fund])} paid
              </span>
            </div>
          );
        })}
      </div>

      <h2 className="section-heading">{month.name}</h2>
      <div className="stat-grid">
        <div className="stat-card stat-card-in">
          <span className="stat-label">Money in</span>
          <span className="stat-value">{formatMoney(moneyIn)}</span>
          <span className="stat-detail">
            {giftsThisMonth.length} {giftsThisMonth.length === 1 ? "gift" : "gifts"}
          </span>
        </div>
        <div className="stat-card stat-card-out">
          <span className="stat-label">Money out</span>
          <span className="stat-value">{formatMoney(moneyOut)}</span>
          <span className="stat-detail">
            {paymentsThisMonth.length}{" "}
            {paymentsThisMonth.length === 1 ? "payment" : "payments"}
          </span>
        </div>
        <div className="stat-card stat-card-total">
          <span className="stat-label">Net this month</span>
          <span className="stat-value">{formatMoney(net)}</span>
          <span className="stat-detail">Money in − money out</span>
        </div>
      </div>

      <div className="quick-actions">
        <Link href="/dashboard/record-gift" className="button button-gold">
          Record Gift
        </Link>
        <Link href="/dashboard/pay-bills" className="button">
          Pay Bills
        </Link>
        <Link href="/dashboard/reports" className="quick-link">
          See full reports →
        </Link>
      </div>
    </section>
  );
}
