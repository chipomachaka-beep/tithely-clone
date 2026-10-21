import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CHURCH } from "@/lib/church";
import { FUND_LABELS } from "@/lib/format";
import { recordEnvelopeGift } from "./actions";
import MethodFields from "./MethodFields";

export const metadata = {
  title: "Record Envelope Gift",
};

export default async function EnvelopePage({ searchParams }) {
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

  // Everyone who can give, by name.
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "member")
    .order("full_name");

  // Today at the church, as "2026-10-20": the default gift date and the latest allowed.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: CHURCH.timeZone });

  return (
    <section className="auth-card pay-card">
      <Link href="/dashboard" className="back-link">
        ← Back to Dashboard
      </Link>
      <h1>Record envelope gift</h1>
      <p className="lead">
        Enter a cash or check gift from the offering plate under a member&apos;s name.
      </p>

      {error && <p className="error">{error}</p>}

      <form action={recordEnvelopeGift} className="form">
        <label>
          Member
          <select name="member_id" required defaultValue="">
            <option value="" disabled>
              Choose a member
            </option>
            {(members ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
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
          Fund
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

        <MethodFields />

        <label>
          Gift date
          <input name="given_on" type="date" required defaultValue={today} max={today} />
        </label>

        <button type="submit" className="button button-gold give-submit">
          Record gift
        </button>
        <p className="demo-note">Demo only: no money is processed.</p>
      </form>
    </section>
  );
}
