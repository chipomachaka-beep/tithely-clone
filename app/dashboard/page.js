import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate, FUND_LABELS } from "@/lib/format";

export default async function DashboardPage() {
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
    .select("id, amount, fund, given_on, profiles(full_name)")
    .order("given_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="error">Could not load donations: {error.message}</p>;
  }

  // Add up the totals for each fund and overall.
  const fundTotals = { tithe: 0, offering: 0, building: 0 };
  for (const d of donations) {
    fundTotals[d.fund] += Number(d.amount);
  }
  const grandTotal = fundTotals.tithe + fundTotals.offering + fundTotals.building;

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
        {Object.keys(FUND_LABELS).map((fund) => (
          <div key={fund} className="stat-card">
            <span className="stat-label">{FUND_LABELS[fund]}</span>
            <span className="stat-value">{formatMoney(fundTotals[fund])}</span>
          </div>
        ))}
      </div>

      <h2 className="section-heading">All Gifts</h2>
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
