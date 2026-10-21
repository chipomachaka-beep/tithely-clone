import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CHURCH } from "@/lib/church";
import {
  formatMoney,
  formatLongDate,
  formatLongDateAt,
  formatMethod,
  FUND_LABELS,
} from "@/lib/format";
import { isMonthKey, monthName, monthRange } from "@/lib/months";
import PrintButton from "@/components/PrintButton";

export const metadata = {
  title: "Monthly Giving Statement",
};

// A member's statement for one month, like /statement/2026-10.
// Members open their own. The treasurer adds ?member=<id> to open anyone's,
// and can preview a month before sending it.
export default async function StatementPage({ params, searchParams }) {
  const { month } = await params;
  const { member } = await searchParams;
  if (!isMonthKey(month)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: viewer } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isTreasurer = viewer?.role === "treasurer";

  // Members can only ever open their own statement.
  const memberId = member ?? user.id;
  if (memberId !== user.id && !isTreasurer) {
    notFound();
  }

  // The database rules only return these rows to the member or the treasurer.
  const { first, next } = monthRange(month);
  const [{ data: profile }, { data: statement }, { data: gifts }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", memberId).maybeSingle(),
    supabase
      .from("statements")
      .select("sent_at")
      .eq("user_id", memberId)
      .eq("month", month)
      .maybeSingle(),
    supabase
      .from("donations")
      .select("id, amount, fund, given_on, method, check_number")
      .eq("user_id", memberId)
      .gte("given_on", first)
      .lt("given_on", next)
      .order("given_on")
      .order("created_at"),
  ]);

  // Like receipts: members see a statement only after the treasurer sends it.
  if (!profile || !gifts || gifts.length === 0 || (!statement && !isTreasurer)) {
    notFound();
  }

  const total = gifts.reduce((sum, g) => sum + Number(g.amount), 0);
  const backLink =
    memberId === user.id
      ? { href: "/history", label: "← Back to My Giving" }
      : { href: `/dashboard/gifts?member=${memberId}`, label: "← Back to Gifts" };

  return (
    <section className="receipt-page">
      <div className="receipt-actions">
        <Link href={backLink.href}>{backLink.label}</Link>
        <PrintButton />
      </div>

      {!statement && (
        <p className="notice notice-preview">
          Preview only: this statement hasn&apos;t been sent to {profile.full_name} yet.
        </p>
      )}

      <article className="receipt">
        <header className="receipt-header">
          <div className="receipt-cross" aria-hidden="true">
            ✝
          </div>
          <h1 className="receipt-church">{CHURCH.name}</h1>
          <address className="receipt-address">
            {CHURCH.street}
            <br />
            {CHURCH.cityStateZip}
          </address>
        </header>

        <h2 className="receipt-title">Monthly Giving Statement</h2>

        <div className="receipt-meta">
          <div>
            <span className="receipt-label">Statement period</span>
            <span className="receipt-value">{monthName(month)}</span>
          </div>
          <div>
            <span className="receipt-label">Date issued</span>
            <span className="receipt-value">
              {statement ? formatLongDateAt(statement.sent_at, CHURCH.timeZone) : "Not yet sent"}
            </span>
          </div>
        </div>

        <dl className="receipt-lines">
          <div>
            <dt>Prepared for</dt>
            <dd>{profile.full_name}</dd>
          </div>
        </dl>

        <table className="statement-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Fund</th>
              <th>Method</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map((g) => (
              <tr key={g.id}>
                <td>{formatLongDate(g.given_on)}</td>
                <td>{FUND_LABELS[g.fund]}</td>
                <td>{formatMethod(g.method, g.check_number)}</td>
                <td className="num">{formatMoney(g.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-total">
          <span className="receipt-total-label">
            Total for {monthName(month)} ({gifts.length} {gifts.length === 1 ? "gift" : "gifts"})
          </span>
          <span className="receipt-total-value">{formatMoney(total)}</span>
        </div>

        <p className="receipt-thanks">Thank you for your faithful generosity.</p>
        <p className="receipt-note">
          Demo statement for a bootcamp project. No payment was processed.
        </p>
      </article>
    </section>
  );
}
