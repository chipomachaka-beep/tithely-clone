import Link from "next/link";
import { formatMoney, formatDate, formatMethod, FUND_LABELS } from "@/lib/format";
import { requireTreasurer, loadGifts } from "@/lib/treasurer";
import { groupByMonth, giftCount } from "@/lib/months";
import DeleteButton from "@/components/DeleteButton";
import MemberFilter from "./MemberFilter";
import { sendReceipt, deleteGift, sendStatement } from "./actions";

export const metadata = {
  title: "Gifts",
};

export default async function GiftsPage({ searchParams }) {
  const { error, recorded, deleted, statement, member } = await searchParams;
  const { supabase } = await requireTreasurer();

  const [allGifts, { data: members }, { data: statements }] = await Promise.all([
    loadGifts(supabase),
    supabase.from("profiles").select("id, full_name").eq("role", "member").order("full_name"),
    supabase.from("statements").select("user_id, month"),
  ]);

  // "Member" dropdown: show one person's gifts, or everyone's.
  const gifts = member ? allGifts.filter((g) => g.user_id === member) : allGifts;
  const months = groupByMonth(gifts);

  // Which member + month pairs already have a statement, like "<id>|2026-10".
  const sent = new Set((statements ?? []).map((s) => `${s.user_id}|${s.month}`));

  // Each giver in a month, with their total that month, sorted by name.
  function giversIn(month) {
    const byGiver = new Map();
    for (const g of month.gifts) {
      const entry = byGiver.get(g.user_id) ?? {
        id: g.user_id,
        name: g.profiles?.full_name ?? "Unknown",
        total: 0,
        count: 0,
      };
      entry.total += Number(g.amount);
      entry.count += 1;
      byGiver.set(g.user_id, entry);
    }
    return [...byGiver.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Gifts</h1>
          <p className="lead">
            Every gift to the church, by month. Send receipts and monthly statements from here.
          </p>
        </div>
        <Link href="/dashboard/record-gift" className="button button-gold">
          Record Gift
        </Link>
      </div>

      <MemberFilter members={members ?? []} selected={member} />

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
      {statement && (
        <p className="notice" role="status">
          Monthly statement sent. The member now sees &ldquo;Statement available&rdquo; on My Giving.
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {months.length === 0 ? (
        <p className="empty-note">No gifts yet.</p>
      ) : (
        // One section per month, newest first. Only the newest starts open.
        months.map((month, index) => (
          <details key={month.key} className="month-group" open={index === 0}>
            <summary className="month-summary">
              <span className="month-title">
                <strong>{month.name}</strong>: {giftCount(month.gifts.length)},{" "}
                {formatMoney(month.total)}
              </span>
            </summary>

            <ul className="statement-list" aria-label={`${month.name} statements`}>
              {giversIn(month).map((giver) => (
                <li key={giver.id} className="statement-row">
                  <span className="statement-giver">
                    <strong>{giver.name}</strong>
                    <span className="statement-giver-detail">
                      {giftCount(giver.count)}, {formatMoney(giver.total)}
                    </span>
                  </span>
                  {sent.has(`${giver.id}|${month.key}`) ? (
                    <Link
                      href={`/statement/${month.key}?member=${giver.id}`}
                      className="receipt-sent"
                    >
                      Statement sent · View
                    </Link>
                  ) : (
                    <span className="row-actions">
                      <Link
                        href={`/statement/${month.key}?member=${giver.id}`}
                        className="preview-link"
                      >
                        Preview
                      </Link>
                      <form action={sendStatement}>
                        <input type="hidden" name="member_id" value={giver.id} />
                        <input type="hidden" name="month" value={month.key} />
                        <input type="hidden" name="filter" value={member ?? ""} />
                        <button type="submit" className="button button-small">
                          Send monthly statement
                        </button>
                      </form>
                    </span>
                  )}
                </li>
              ))}
            </ul>

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
                  {month.gifts.map((d) => (
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
                              <input type="hidden" name="filter" value={member ?? ""} />
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
          </details>
        ))
      )}
    </section>
  );
}
