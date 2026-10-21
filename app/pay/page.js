import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FUND_LABELS, CATEGORY_LABELS } from "@/lib/format";
import { recordPayment } from "./actions";

export const metadata = {
  title: "Pay a Bill",
};

// Suggestions shown as you type the payee; any other name works too.
const COMMON_PAYEES = ["MDU", "City of Dickinson"];

export default async function PayPage({ searchParams }) {
  const { error } = await searchParams;
  const supabase = await createClient();

  // Treasurer only. Members are sent to their own giving history.
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

  return (
    <section className="auth-card pay-card">
      <Link href="/dashboard" className="back-link">
        ← Back to Dashboard
      </Link>
      <h1>Pay a bill</h1>
      <p className="lead">Record a payment made from a church fund.</p>

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
    </section>
  );
}
