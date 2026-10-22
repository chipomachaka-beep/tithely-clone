// A list of change history rows: what changed, the reason, who, and when.
import { CHURCH } from "@/lib/church";
import { describeChange, describeRecord } from "@/lib/changes";

function formatWhen(timestamp) {
  return new Date(timestamp).toLocaleString("en-US", {
    timeZone: CHURCH.timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChangeHistory({ rows, names, showRecord = true }) {
  if (rows.length === 0) {
    return <p className="empty-note">No changes yet.</p>;
  }

  return (
    <ol className="change-list">
      {rows.map((row) => (
        <li key={row.id} className={`change-item change-${row.action}`}>
          <div className="change-head">
            <span className="change-action">{row.action === "delete" ? "Deleted" : "Edited"}</span>
            {showRecord && <strong>{describeRecord(row)}</strong>}
            <span className="change-when">
              {formatWhen(row.changed_at)} · {row.profiles?.full_name ?? "Unknown"}
            </span>
          </div>
          <ul className="change-lines">
            {describeChange(row, names).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="change-reason">
            <span>Reason:</span> {row.reason}
          </p>
        </li>
      ))}
    </ol>
  );
}
