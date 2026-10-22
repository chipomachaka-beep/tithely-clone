import Link from "next/link";
import { formatMoney, formatDate, FUND_LABELS } from "@/lib/format";
import {
  requireTreasurer,
  loadGifts,
  loadPayments,
  loadMembers,
  selectedMember,
  totalsBy,
  sum,
  churchMonth,
} from "@/lib/treasurer";
import { shiftMonth, monthlyTotals } from "@/lib/months";
import MemberFilter from "@/components/MemberFilter";
import MemberGiftsTable from "@/components/MemberGiftsTable";

export const metadata = {
  title: "Overview",
};

const FUNDS = Object.keys(FUND_LABELS);

export default async function OverviewPage({ searchParams }) {
  const { member: memberId } = await searchParams;
  const { supabase } = await requireTreasurer();
  const [allGifts, payments, members] = await Promise.all([
    loadGifts(supabase),
    loadPayments(supabase),
    loadMembers(supabase),
  ]);

  // "Member" dropdown: one person's gifts, or the whole church.
  const member = selectedMember(members, memberId);
  const gifts = member ? allGifts.filter((g) => g.user_id === member.id) : allGifts;

  // This month at the church, and the two months before it. Dates look like "2026-10-05".
  const month = churchMonth();
  const giftsThisMonth = gifts.filter((g) => g.given_on.startsWith(month.prefix));
  const recent = monthlyTotals(
    [month.prefix, shiftMonth(month.prefix, -1), shiftMonth(month.prefix, -2)],
    gifts,
    member ? [] : payments
  );

  return (
    <section>
      <h1>Overview</h1>
      <p className="lead">
        {member
          ? `${member.full_name}'s giving at a glance.`
          : "Where Invitation Hill SDA Church's funds stand today."}
      </p>

      <MemberFilter members={members} selected={member?.id} />

      {member ? (
        <MemberOverview member={member} gifts={gifts} giftsThisMonth={giftsThisMonth} month={month} />
      ) : (
        <ChurchOverview
          gifts={gifts}
          payments={payments}
          giftsThisMonth={giftsThisMonth}
          month={month}
        />
      )}

      <h2 className="section-heading">Recent Months</h2>
      <div className="table-wrap recent-months">
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="num cell-count">Gifts</th>
              <th className="num">{member ? "Given" : "Money in"}</th>
              {!member && <th className="num">Money out</th>}
              {!member && <th className="num">Net</th>}
            </tr>
          </thead>
          <tbody>
            {recent.map((m) => (
              <tr key={m.key}>
                <td>{m.name}</td>
                <td className="num cell-count">{m.gifts}</td>
                <td className="num">{formatMoney(m.moneyIn)}</td>
                {!member && <td className="num">−{formatMoney(m.moneyOut)}</td>}
                {!member && (
                  <td className={`num${m.moneyIn - m.moneyOut < 0 ? " is-negative" : ""}`}>
                    {formatMoney(m.moneyIn - m.moneyOut)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {member && (
        <>
          <div className="section-header">
            <h2 className="section-heading">Recent Gifts</h2>
            <Link href={`/dashboard/gifts?member=${member.id}`} className="quick-link">
              See all of {member.full_name}&apos;s gifts →
            </Link>
          </div>
          <div className="recent-gifts">
            <MemberGiftsTable gifts={gifts.slice(0, 5)} />
          </div>
        </>
      )}

      <div className="quick-actions">
        <Link href="/dashboard/record-gift" className="button button-accent">
          Record Gift
        </Link>
        <Link href="/dashboard/pay-bills" className="button">
          Pay Bills
        </Link>
        <Link
          href={member ? `/dashboard/reports?member=${member.id}` : "/dashboard/reports"}
          className="quick-link"
        >
          See full reports →
        </Link>
      </div>
    </section>
  );
}

// Whole church: each fund's balance (given minus paid out) and this month's
// money in, money out, and net.
function ChurchOverview({ gifts, payments, giftsThisMonth, month }) {
  const givenByFund = totalsBy(gifts, "fund", FUNDS);
  const paidByFund = totalsBy(payments, "fund", FUNDS);
  const paymentsThisMonth = payments.filter((p) => p.paid_on.startsWith(month.prefix));
  const moneyIn = sum(giftsThisMonth);
  const moneyOut = sum(paymentsThisMonth);
  const net = moneyIn - moneyOut;

  return (
    <>
      <h2 className="section-heading">Fund Balances</h2>
      <div className="fund-totals fund-balances">
        {FUNDS.map((fund) => {
          const balance = givenByFund[fund] - paidByFund[fund];
          return (
            <div key={fund} className={`fund-total fund-total-${fund}`}>
              <span className="stat-label">{FUND_LABELS[fund]}</span>
              <span className={`fund-total-value${balance < 0 ? " is-negative" : ""}`}>
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
    </>
  );
}

// One member: what they've given to each fund, and this month and this year.
// Bill payments belong to the church, so they aren't shown here.
function MemberOverview({ member, gifts, giftsThisMonth, month }) {
  const givenByFund = totalsBy(gifts, "fund", FUNDS);
  const year = month.prefix.slice(0, 4);
  const thisYear = sum(gifts.filter((g) => g.given_on.startsWith(year)));
  const lastGift = gifts[0];

  return (
    <>
      <h2 className="section-heading">Given by {member.full_name}</h2>
      <div className="fund-totals fund-balances">
        {FUNDS.map((fund) => (
          <div key={fund} className={`fund-total fund-total-${fund}`}>
            <span className="stat-label">{FUND_LABELS[fund]}</span>
            <span className="fund-total-value">{formatMoney(givenByFund[fund])}</span>
            <span className="stat-detail">all time</span>
          </div>
        ))}
      </div>

      <h2 className="section-heading">{month.name}</h2>
      <div className="stat-grid">
        <div className="stat-card stat-card-in">
          <span className="stat-label">Given this month</span>
          <span className="stat-value">{formatMoney(sum(giftsThisMonth))}</span>
          <span className="stat-detail">
            {giftsThisMonth.length} {giftsThisMonth.length === 1 ? "gift" : "gifts"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Given in {year}</span>
          <span className="stat-value">{formatMoney(thisYear)}</span>
          <span className="stat-detail">so far this year</span>
        </div>
        <div className="stat-card stat-card-total">
          <span className="stat-label">Last gift</span>
          <span className="stat-value">{lastGift ? formatMoney(lastGift.amount) : "—"}</span>
          <span className="stat-detail">
            {lastGift ? formatDate(lastGift.given_on) : "No gifts yet"}
          </span>
        </div>
      </div>
    </>
  );
}
