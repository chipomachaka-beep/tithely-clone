import { FUND_LABELS } from "@/lib/format";
import { requireTreasurer, churchToday } from "@/lib/treasurer";
import { recordEnvelopeGift } from "./actions";
import MethodFields from "./MethodFields";

export const metadata = {
  title: "Record Gift",
};

export default async function RecordGiftPage({ searchParams }) {
  const { error } = await searchParams;
  const { supabase } = await requireTreasurer();

  // Everyone who can give, by name.
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "member")
    .order("full_name");

  // Today at the church, as "2026-10-20": the default gift date and the latest allowed.
  const today = churchToday();

  return (
    <section>
      <h1>Record Gift</h1>
      <p className="lead">
        Enter a cash or check gift from the offering plate under a member&apos;s name.
      </p>

      <div className="form-card">
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

          <button type="submit" className="button button-accent give-submit">
            Record gift
          </button>
          <p className="demo-note">Demo only: no money is processed.</p>
        </form>
      </div>
    </section>
  );
}
