import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney, FUND_LABELS, CATEGORY_LABELS } from "@/lib/format";
import {
  requireTreasurer,
  loadChanges,
  loadMemberNames,
  churchToday,
} from "@/lib/treasurer";
import EditForm from "@/components/EditForm";
import ChangeHistory from "@/components/ChangeHistory";
import { savePaymentChange, deletePaymentChange } from "../actions";

export const metadata = {
  title: "Edit Payment",
};

export default async function EditPaymentPage({ params, searchParams }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireTreasurer();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, paid_on, payee, category, amount, fund, note")
    .eq("id", id)
    .maybeSingle();
  if (!payment) {
    notFound();
  }

  const [history, names] = await Promise.all([
    loadChanges(supabase, id),
    loadMemberNames(supabase),
  ]);

  return (
    <section>
      <Link href="/dashboard/pay-bills" className="back-link">
        ← Back to Pay Bills
      </Link>
      <h1>Edit payment</h1>
      <p className="lead">
        {payment.payee}, {formatMoney(payment.amount)}. Change any field, give a reason, then Save.
      </p>

      <div className="form-card">
        {error && <p className="error">{error}</p>}

        <EditForm
          saveAction={savePaymentChange}
          deleteAction={deletePaymentChange}
          what={`the ${formatMoney(payment.amount)} payment to ${payment.payee}`}
        >
          <input type="hidden" name="id" value={payment.id} />

          <div className="form-row">
            <label>
              Payee
              <input name="payee" type="text" required maxLength={100} defaultValue={payment.payee} />
            </label>
            <label>
              Date paid
              <input name="paid_on" type="date" required max={churchToday()} defaultValue={payment.paid_on} />
            </label>
          </div>

          <div className="form-row">
            <label>
              Category
              <select name="category" required defaultValue={payment.category}>
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
                  defaultValue={Number(payment.amount).toFixed(2)}
                />
              </span>
            </label>
          </div>

          <label>
            Paid from fund
            <select name="fund" required defaultValue={payment.fund}>
              {Object.entries(FUND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Note <span className="optional">(optional)</span>
            <input name="note" type="text" maxLength={200} defaultValue={payment.note} />
          </label>
        </EditForm>
      </div>

      <h2 className="section-heading section-heading-spaced">Change history for this payment</h2>
      <ChangeHistory rows={history} names={names} showRecord={false} />
    </section>
  );
}
