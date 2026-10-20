import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate, FUND_LABELS } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get every donation, newest first, along with the giver's name from profiles.
  const { data: donations, error } = await supabase
    .from("donations")
    .select("id, amount, fund, given_on, profiles(full_name)")
    .order("given_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="error">Could not load donations: {error.message}</p>;
  }

  return (
    <section>
      <h1>All Gifts</h1>
      <p className="lead">Every donation given to Invitation Hill SDA Church.</p>

      {donations.length === 0 ? (
        <p>No donations yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Giver</th>
                <th>Fund</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td>{formatDate(d.given_on)}</td>
                  <td>{d.profiles?.full_name}</td>
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
