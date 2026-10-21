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
import PrintButton from "./PrintButton";

export const metadata = {
  title: "Giving Receipt",
};

export default async function ReceiptPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // The database rules only return this gift to the person who gave it or to
  // the treasurer. Anyone else gets nothing back and sees "not found".
  const { data: gift } = await supabase
    .from("donations")
    .select(
      "id, user_id, amount, fund, given_on, method, check_number, receipt_number, receipted_at, profiles(full_name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!gift || !gift.receipt_number) {
    notFound();
  }

  const backLink =
    gift.user_id === user.id
      ? { href: "/history", label: "← Back to My Giving" }
      : { href: "/dashboard/gifts", label: "← Back to Gifts" };

  return (
    <section className="receipt-page">
      <div className="receipt-actions">
        <Link href={backLink.href}>{backLink.label}</Link>
        <PrintButton />
      </div>

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

        <h2 className="receipt-title">Official Giving Receipt</h2>

        <div className="receipt-meta">
          <div>
            <span className="receipt-label">Receipt number</span>
            <span className="receipt-value">{gift.receipt_number}</span>
          </div>
          <div>
            <span className="receipt-label">Date issued</span>
            <span className="receipt-value">
              {formatLongDateAt(gift.receipted_at, CHURCH.timeZone)}
            </span>
          </div>
        </div>

        <dl className="receipt-lines">
          <div>
            <dt>Received from</dt>
            <dd>{gift.profiles?.full_name}</dd>
          </div>
          <div>
            <dt>Gift date</dt>
            <dd>{formatLongDate(gift.given_on)}</dd>
          </div>
          <div>
            <dt>Fund</dt>
            <dd>{FUND_LABELS[gift.fund]}</dd>
          </div>
          <div>
            <dt>Payment method</dt>
            <dd>{formatMethod(gift.method, gift.check_number)}</dd>
          </div>
        </dl>

        <div className="receipt-total">
          <span className="receipt-total-label">Amount</span>
          <span className="receipt-total-value">{formatMoney(gift.amount)}</span>
        </div>

        <p className="receipt-thanks">
          Thank you for your faithful generosity.
        </p>
        <p className="receipt-note">
          Demo receipt for a bootcamp project. No payment was processed.
        </p>
      </article>
    </section>
  );
}
