import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findChurch, SITE_URL } from "@/lib/churches";
import TextToGive from "./TextToGive";

export async function generateMetadata({ params }) {
  const church = findChurch((await params).slug);
  return { title: church ? `Give to ${church.name}` : "Church not found" };
}

// A church's giving page: give online, scan the QR code, or Text to Give.
export default async function ChurchPage({ params }) {
  const { slug } = await params;
  const church = findChurch(slug);
  if (!church) {
    notFound();
  }

  // Signed in? Text to Give records gifts under this person's account.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let firstName = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    firstName = (profile?.full_name ?? "").trim().split(/\s+/)[0] || "friend";
  }

  const pageUrl = `${SITE_URL}/church/${church.slug}`;

  return (
    <section className="church-page">
      <Link href="/churches" className="back-link">
        ← Find another church
      </Link>

      <header className="church-hero">
        <span className="church-hero-mark" aria-hidden="true">
          ✝
        </span>
        <h1>{church.name}</h1>
        <p className="church-hero-address">
          {church.street} · {church.city}
        </p>
        <blockquote className="hero-verse">
          &ldquo;God loveth a cheerful giver.&rdquo;
          <cite>2 Corinthians 9:7 (KJV)</cite>
        </blockquote>
        <Link href="/give" className="button button-accent button-large">
          Give online
        </Link>
      </header>

      <div className="church-ways">
        <section className="church-card qr-card" aria-labelledby="qr-heading">
          <h2 id="qr-heading">Scan to give</h2>
          <p>Point your phone&apos;s camera at the code to open this giving page.</p>
          {/* A static image made once from this page's address (see public/qr). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={church.qrImage}
            alt={`QR code that opens ${pageUrl}`}
            className="qr-image"
            width="280"
            height="280"
          />
          <p className="qr-url">{pageUrl.replace("https://", "")}</p>
          <Link href={`/church/${church.slug}/poster`} className="button button-small">
            Printable &ldquo;Scan to give&rdquo; poster
          </Link>
        </section>

        <section className="church-card" aria-labelledby="ttg-heading">
          <h2 id="ttg-heading">Text to Give</h2>
          <p>
            Text <strong>{church.textKeyword}</strong> to <strong>{church.textNumber}</strong>,
            choose a fund, and reply with an amount.
          </p>
          <TextToGive church={church} firstName={firstName} />
        </section>
      </div>
    </section>
  );
}
