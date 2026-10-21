import Link from "next/link";
import { formatMoney, formatDate, formatMethod, FUND_LABELS } from "@/lib/format";
import { requireTreasurer, loadGifts } from "@/lib/treasurer";
import DeleteButton from "@/components/DeleteButton";
import { sendReceipt, deleteGift } from "./actions";

export const metadata = {
  title: "Gifts",
};

export default async function GiftsPage({ searchParams }) {
  const { error, recorded, deleted } = await searchParams;
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
      {deleted && (
        <p className="notice" role="status">
          Gift deleted.
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
                      <div className="row-actions">
                        <form action={sendReceipt}>
                          <input type="hidden" name="donation_id" value={d.id} />
                          <button type="submit" className="button button-small">
                            Send receipt
                          </button>
                        </form>
                        {/* Only envelope gifts (cash or check) can be deleted, and only
                            before a receipt is sent. */}
                        {d.method !== "online" && (
                          <DeleteButton
                            action={deleteGift}
                            id={d.id}
                            what={`${d.profiles?.full_name}'s ${formatMoney(d.amount)} gift`}
                          />
                        )}
                      </div>
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
