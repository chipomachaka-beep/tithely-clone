import {
  formatMoney,
  formatDate,
  FUND_LABELS,
  METHOD_LABELS,
} from "@/lib/format";
import {
  requireTreasurer,
  loadGifts,
  loadPayments,
  totalsBy,
  sum,
  churchMonth,
  loadMembers,
  selectedMember,
} from "@/lib/treasurer";
import MemberFilter from "@/components/MemberFilter";
import MemberGiftsTable from "@/components/MemberGiftsTable";
import { monthsBetween, monthlyTotals } from "@/lib/months";
import TrendCharts from "@/components/TrendCharts";

export const metadata = {
  title: "Reports",
};

const FUNDS = Object.keys(FUND_LABELS);
const METHODS = Object.keys(METHOD_LABELS);

export default async function ReportsPage({ searchParams }) {
  const { member: memberId } = await searchParams;
  const { supabase } = await requireTreasurer();
  const [allGifts, allPayments, members] = await Promise.all([
    loadGifts(supabase),
    loadPayments(supabase),
    loadMembers(supabase),
  ]);

  // "Member" dropdown: one person's gifts, or the whole church. Bill payments
  // belong to the church, not to a member, so they're left out for one member.
  const member = selectedMember(members, memberId);
  const gifts = member ? allGifts.filter((g) => g.user_id === member.id) : allGifts;
  const payments = member ? [] : allPayments;

  const givenByFund = totalsBy(gifts, "fund", FUNDS);
  const paidByFund = totalsBy(payments, "fund", FUNDS);
  const totalIn = sum(gifts);
  const totalOut = sum(payments);

  const byMethod = totalsBy(gifts, "method", METHODS);
  const methodCounts = Object.fromEntries(
    METHODS.map((m) => [m, gifts.filter((g) => g.method === m).length])
  );

  // A giver is anyone with at least one gift; count each person once.
  const giverCount = new Set(gifts.map((g) => g.user_id)).size;

  // Bars are sized relative to the biggest fund, which fills the full width.
  const largestFund = Math.max(...Object.values(givenByFund));

  // Month by month, from the first month with a gift or payment up to this
  // month (the last 12 at most), including months with nothing in them.
  const thisMonth = churchMonth().prefix;
  const firstMonth = [...gifts.map((g) => g.given_on), ...payments.map((p) => p.paid_on)]
    .map((date) => date.slice(0, 7))
    .reduce((earliest, key) => (key < earliest ? key : earliest), thisMonth);
  const months = monthlyTotals(monthsBetween(firstMonth, thisMonth), gifts, payments);

  return (
    <section>
      <h1>Reports</h1>
      <p className="lead">
        All-time totals for {member ? member.full_name : "Invitation Hill SDA Church"}.
      </p>

      <MemberFilter members={members} selected={member?.id} />

      {member ? (
        <div className="stat-grid">
          <div className="stat-card stat-card-total">
            <span className="stat-label">Total given</span>
            <span className="stat-value">{formatMoney(totalIn)}</span>
            <span className="stat-detail">
              {gifts.length} {gifts.length === 1 ? "gift" : "gifts"}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Average gift</span>
            <span className="stat-value">
              {formatMoney(gifts.length > 0 ? totalIn / gifts.length : 0)}
            </span>
            <span className="stat-detail">per gift</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Last gift</span>
            <span className="stat-value">
              {gifts.length > 0 ? formatMoney(gifts[0].amount) : "—"}
            </span>
            <span className="stat-detail">
              {gifts.length > 0 ? formatDate(gifts[0].given_on) : "No gifts yet"}
            </span>
          </div>
        </div>
      ) : (
        <div className="stat-grid">
          <div className="stat-card stat-card-total">
            <span className="stat-label">All gifts</span>
            <span className="stat-value">{formatMoney(totalIn)}</span>
            <span className="stat-detail">
              {gifts.length} {gifts.length === 1 ? "gift" : "gifts"}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Number of givers</span>
            <span className="stat-value">{giverCount}</span>
            <span className="stat-detail">
              {giverCount === 1 ? "person has" : "people have"} given
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Paid out</span>
            <span className="stat-value">{formatMoney(totalOut)}</span>
            <span className="stat-detail">
              {payments.length} {payments.length === 1 ? "payment" : "payments"}
            </span>
          </div>
        </div>
      )}

      <h2 className="section-heading">Trends</h2>
      <TrendCharts months={months} memberName={member?.full_name} />

      <h2 className="section-heading section-heading-spaced">Totals by Fund</h2>
      <ul className="bar-chart">
        {FUNDS.map((fund) => {
          const total = givenByFund[fund];
          const width = largestFund > 0 ? (total / largestFund) * 100 : 0;
          const share = totalIn > 0 ? Math.round((total / totalIn) * 100) : 0;
          return (
            <li
              key={fund}
              className="bar-row"
              title={`${FUND_LABELS[fund]}: ${formatMoney(total)} (${share}% of ${member ? `${member.full_name}'s` : "all"} giving)`}
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

      <h2 className="section-heading">By Payment Method</h2>
      <div className="fund-totals method-totals">
        {METHODS.map((method) => (
          <div key={method} className="fund-total method-total">
            <span className="stat-label">{METHOD_LABELS[method]}</span>
            <span className="fund-total-value">{formatMoney(byMethod[method])}</span>
            <span className="stat-detail">
              {methodCounts[method]} {methodCounts[method] === 1 ? "gift" : "gifts"}
            </span>
          </div>
        ))}
      </div>

      {member ? (
        <>
          <h2 className="section-heading">{member.full_name}&apos;s Gifts</h2>
          <MemberGiftsTable gifts={gifts} />
        </>
      ) : (
        <>
          <h2 className="section-heading">Money In vs. Money Out</h2>
          <div className="table-wrap">
            <table className="table in-out-table">
              <thead>
                <tr>
                  <th>Fund</th>
                  <th className="num">Money in</th>
                  <th className="num">Money out</th>
                  <th className="num">Net</th>
                </tr>
              </thead>
              <tbody>
                {FUNDS.map((fund) => {
                  const net = givenByFund[fund] - paidByFund[fund];
                  return (
                    <tr key={fund}>
                      <td>
                        <span className={`fund-tag fund-${fund}`}>{FUND_LABELS[fund]}</span>
                      </td>
                      <td className="num">{formatMoney(givenByFund[fund])}</td>
                      <td className="num">−{formatMoney(paidByFund[fund])}</td>
                      <td className={`num${net < 0 ? " is-negative" : ""}`}>
                        {formatMoney(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th>All funds</th>
                  <td className="num">{formatMoney(totalIn)}</td>
                  <td className="num">−{formatMoney(totalOut)}</td>
                  <td className={`num${totalIn - totalOut < 0 ? " is-negative" : ""}`}>
                    {formatMoney(totalIn - totalOut)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
