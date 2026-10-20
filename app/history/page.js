import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate, FUND_LABELS } from "@/lib/format";

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
    .select("id, amount, fund, given_on")
    .eq("user_id", user.id)
    .order("given_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="error">Could not load your gifts: {error.message}</p>;
  }

  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <section>
      {gave && (
        <p className="notice-success">
          Thank you! Your gift has been recorded.
        </p>
      )}

      <h1>My Giving</h1>
      <p className="lead">Thank you for your faithful generosity.</p>

      <div className="stat-card">
        <span className="stat-label">Total given</span>
        <span className="stat-value">{formatMoney(total)}</span>
      </div>

      {donations.length === 0 ? (
        <p>
          You haven&apos;t given yet. <Link href="/give">Give now</Link>
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fund</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td>{formatDate(d.given_on)}</td>
                  <td>
                    <span className={`fund-tag fund-${d.fund}`}>
                      {FUND_LABELS[d.fund]}
                    </span>
                  </td>
                  <td className="num">{formatMoney(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
