import Link from "next/link";
import { formatMoney, formatDate, formatMethod, FUND_LABELS } from "@/lib/format";
import { requireTreasurer, loadGifts } from "@/lib/treasurer";
import { sendReceipt } from "./actions";

export const metadata = {
  title: "Gifts",
};

export default async function GiftsPage({ searchParams }) {
  const { error, recorded } = await searchParams;
  const { supabase } = await requireTreasurer();
  const gifts = await loadGifts(supabase);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Gifts</h1>
          <p className="lead">
            Every gift to the church. Send a receipt from here.
          </p>
        </div>
        <Link href="/dashboard/record-gift" className="button button-gold">
          Record Gift
        </Link>
      </div>

      {recorded && (
        <p className="notice" role="status">
          Envelope gift recorded under the member&apos;s name.
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {gifts.length === 0 ? (
        <p className="empty-note">No gifts yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="table table-stack">
            <thead>
              <tr>
                <th>Date</th>
                <th>Giver</th>
                <th>Fund</th>
                <th>Method</th>
                <th className="num">Amount</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((d) => (
                <tr key={d.id}>
                  <td className="cell-date">{formatDate(d.given_on)}</td>
                  <td className="cell-giver">{d.profiles?.full_name}</td>
                  <td className="cell-fund">
                    <span className={`fund-tag fund-${d.fund}`}>
                      {FUND_LABELS[d.fund]}
                    </span>
                  </td>
                  <td className="cell-method">
                    {formatMethod(d.method, d.check_number)}
                  </td>
                  <td className="num cell-amount">{formatMoney(d.amount)}</td>
                  <td className="cell-receipt">
                    {d.receipt_number ? (
                      <Link href={`/receipt/${d.id}`} className="receipt-sent">
                        Receipt sent · {d.receipt_number}
                      </Link>
                    ) : (
                      <form action={sendReceipt}>
                        <input type="hidden" name="donation_id" value={d.id} />
                        <button type="submit" className="button button-small">
                          Send receipt
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
