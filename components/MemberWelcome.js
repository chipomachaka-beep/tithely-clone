import Link from "next/link";
import { CHURCH } from "@/lib/church";
import { formatMoney } from "@/lib/format";
import { churchToday } from "@/lib/treasurer";

// The page members land on after logging in: a warm greeting and three
// shortcuts. Only this person's own gifts are counted (the database rules
// don't return anyone else's).
export default async function MemberWelcome({ supabase, user }) {
  const [{ data: profile }, { data: gifts }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("donations")
      .select("amount, given_on, receipt_number")
      .eq("user_id", user.id),
  ]);

  const firstName = (profile?.full_name ?? "").trim().split(/\s+/)[0] || "friend";

  // "This year" is the calendar year at the church. Dates look like "2026-10-05".
  const year = churchToday().slice(0, 4);
  const myGifts = gifts ?? [];
  const totalThisYear = myGifts
    .filter((g) => g.given_on.startsWith(year))
    .reduce((sum, g) => sum + Number(g.amount), 0);
  const receiptCount = myGifts.filter((g) => g.receipt_number).length;

  return (
    <>
      <section className="welcome-hero">
        <h1>
          Hey {firstName}, welcome to your giving page
        </h1>
        <blockquote className="hero-verse">
          &ldquo;God loveth a cheerful giver.&rdquo;
          <cite>2 Corinthians 9:7 (KJV)</cite>
        </blockquote>
        <p className="welcome-thanks">
          Thank you for supporting the ministry of {CHURCH.name}.
        </p>
      </section>

      <section className="welcome-cards" aria-label="Shortcuts">
        <Link href="/give" className="welcome-card welcome-card-give">
          <span className="welcome-card-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
          </span>
          <span className="welcome-card-title">Give now</span>
          <span className="welcome-card-text">
            Tithe, offering, or building fund, in a few taps.
          </span>
          <span className="welcome-card-cta">Give →</span>
        </Link>

        <Link href="/history" className="welcome-card">
          <span className="welcome-card-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
            </svg>
          </span>
          <span className="welcome-card-title">My Giving</span>
          <span className="welcome-card-number">{formatMoney(totalThisYear)}</span>
          <span className="welcome-card-text">given in {year}</span>
          <span className="welcome-card-cta">See my gifts →</span>
        </Link>

        <Link href="/history" className="welcome-card">
          <span className="welcome-card-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
              <path d="M9 7h6M9 11h6M9 15h4" />
            </svg>
          </span>
          <span className="welcome-card-title">My receipts</span>
          <span className="welcome-card-number">{receiptCount}</span>
          <span className="welcome-card-text">
            {receiptCount === 1 ? "receipt" : "receipts"} from the church treasurer
          </span>
          <span className="welcome-card-cta">View receipts →</span>
        </Link>
      </section>
    </>
  );
}
