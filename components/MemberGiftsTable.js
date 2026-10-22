// One member's gifts, newest first, for the treasurer's Overview and Reports
// when a member is chosen in the "Member" dropdown.
import Link from "next/link";
import { formatMoney, formatDate, formatMethod, FUND_LABELS } from "@/lib/format";

export default function MemberGiftsTable({ gifts }) {
  if (gifts.length === 0) {
    return <p className="empty-note">No gifts yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="table table-stack table-stack-mine">
        <thead>
          <tr>
            <th>Date</th>
            <th>Fund</th>
            <th>Method</th>
            <th className="num">Amount</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {gifts.map((g) => (
            <tr key={g.id}>
              <td className="cell-date">{formatDate(g.given_on)}</td>
              <td className="cell-fund">
                <span className={`fund-tag fund-${g.fund}`}>{FUND_LABELS[g.fund]}</span>
              </td>
              <td className="cell-method">{formatMethod(g.method, g.check_number)}</td>
              <td className="num cell-amount">{formatMoney(g.amount)}</td>
              <td className="cell-receipt">
                {g.receipt_number ? (
                  <Link href={`/receipt/${g.id}`} className="receipt-sent">
                    {g.receipt_number}
                  </Link>
                ) : (
                  <span className="receipt-pending">No receipt yet</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
