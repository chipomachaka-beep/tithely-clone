import Link from "next/link";

export default function Home() {
  return (
    <section className="hero">
      <h1>Give with a grateful heart</h1>
      <p className="lead">
        Support the ministry of Invitation Hill SDA Church through your tithes
        and offerings.
      </p>
      <div className="hero-actions">
        <Link href="/give" className="button button-gold button-large">
          Give now
        </Link>
        <Link href="/history" className="button button-large">
          My Giving
        </Link>
      </div>
    </section>
  );
}
