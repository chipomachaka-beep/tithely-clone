import Link from "next/link";
import { notFound } from "next/navigation";
import { findChurch, SITE_URL } from "@/lib/churches";
import PrintButton from "@/components/PrintButton";

export async function generateMetadata({ params }) {
  const church = findChurch((await params).slug);
  return { title: church ? `Scan to give: ${church.name}` : "Church not found" };
}

// A one-page "Scan to give" poster for the church foyer or bulletin board.
// Printing shows only the poster (see the print styles in globals.css).
export default async function PosterPage({ params }) {
  const { slug } = await params;
  const church = findChurch(slug);
  if (!church) {
    notFound();
  }
  const pageUrl = `${SITE_URL}/church/${church.slug}`;

  return (
    <section className="poster-page">
      <div className="receipt-actions">
        <Link href={`/church/${church.slug}`}>← Back to the giving page</Link>
        <PrintButton />
      </div>

      <article className="poster">
        <p className="poster-cross" aria-hidden="true">
          ✝
        </p>
        <h1 className="poster-church">{church.name}</h1>
        <p className="poster-title">Scan to give</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={church.qrImage}
          alt={`QR code that opens ${pageUrl}`}
          className="poster-qr"
          width="360"
          height="360"
        />
        <p className="poster-url">{pageUrl.replace("https://", "")}</p>
        <p className="poster-text">
          Or text <strong>{church.textKeyword}</strong> to <strong>{church.textNumber}</strong>
        </p>
        <p className="poster-verse">
          &ldquo;God loveth a cheerful giver.&rdquo; <span>2 Corinthians 9:7 (KJV)</span>
        </p>
        <p className="poster-note">Tithe · Offering · Building Fund</p>
      </article>
    </section>
  );
}
