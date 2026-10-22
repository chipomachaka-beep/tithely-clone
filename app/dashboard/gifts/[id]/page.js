import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney, formatMethod, FUND_LABELS } from "@/lib/format";
import { monthName } from "@/lib/months";
import {
  requireTreasurer,
  loadChanges,
  loadMemberNames,
  churchToday,
} from "@/lib/treasurer";
import EditForm from "@/components/EditForm";
import ChangeHistory from "@/components/ChangeHistory";
import MethodFields from "../../record-gift/MethodFields";
import { saveGiftChange, deleteGiftChange } from "../actions";

export const metadata = {
  title: "Edit Gift",
};

export default async function EditGiftPage({ params, searchParams }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireTreasurer();

  const { data: gift } = await supabase
    .from("donations")
    .select("id, user_id, amount, fund, given_on, method, check_number, receipt_number, profiles(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!gift) {
    notFound();
  }

  const giftMonth = gift.given_on.slice(0, 7);
  const [history, names, { data: members }, { data: statement }] = await Promise.all([
    loadChanges(supabase, id),
    loadMemberNames(supabase),
    supabase.from("profiles").select("id, full_name").eq("role", "member").order("full_name"),
    supabase
      .from("statements")
      .select("id")
      .eq("user_id", gift.user_id)
      .eq("month", giftMonth)
      .maybeSingle(),
  ]);

  // Only envelope gifts (cash or check) without a receipt, in a month whose
  // statement hasn't been sent, can be changed. The database enforces this too.
  const lockedReason = gift.receipt_number
    ? `This gift already has a receipt (${gift.receipt_number}), so it can't be edited or deleted.`
    : gift.method === "online"
      ? "Online gifts are given by members themselves, so they can't be edited or deleted."
      : statement
        ? `The ${monthName(giftMonth)} statement has already been sent to ${gift.profiles?.full_name}, so this gift can't be edited or deleted. Changing it would make their statement wrong.`
        : null;
  const what = `${gift.profiles?.full_name}'s ${formatMoney(gift.amount)} gift`;

  return (
    <section>
      <Link href="/dashboard/gifts" className="back-link">
        ← Back to Gifts
      </Link>
      <h1>Edit gift</h1>
      <p className="lead">
        {gift.profiles?.full_name}, {formatMoney(gift.amount)},{" "}
        {formatMethod(gift.method, gift.check_number)}.
        {!lockedReason && " Change any field, give a reason, then Save."}
      </p>

      <div className="form-card">
        {lockedReason ? (
          <p className="notice notice-preview">{lockedReason}</p>
        ) : (
          <>
            {error && <p className="error">{error}</p>}

            <EditForm saveAction={saveGiftChange} deleteAction={deleteGiftChange} what={what}>
              <input type="hidden" name="id" value={gift.id} />

              <label>
                Member
                <select name="member_id" required defaultValue={gift.user_id}>
                  {(members ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-row">
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
                      defaultValue={Number(gift.amount).toFixed(2)}
                    />
                  </span>
                </label>
                <label>
                  Gift date
                  <input
                    name="given_on"
                    type="date"
                    required
                    max={churchToday()}
                    defaultValue={gift.given_on}
                  />
                </label>
              </div>

              <label>
                Fund
                <select name="fund" required defaultValue={gift.fund}>
                  {Object.entries(FUND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <MethodFields
                defaultMethod={gift.method}
                defaultCheckNumber={gift.check_number ?? ""}
              />
            </EditForm>
          </>
        )}
      </div>

      <h2 className="section-heading section-heading-spaced">Change history for this gift</h2>
      <ChangeHistory rows={history} names={names} showRecord={false} />
    </section>
  );
}
