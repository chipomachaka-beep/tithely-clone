import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MemberWelcome from "@/components/MemberWelcome";

// Simple line icons drawn with SVG. They use the text color (set to light green in CSS).
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v8h14v-8M12 8v12" />
      <path d="M12 8C10 4 6.5 4.5 7 7c.3 1 2 1 5 1zM12 8c2-4 5.5-3.5 5-1-.3 1-2 1-5 1z" />
    </svg>
  );
}

function ChurchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2v4M10 4h4" />
      <path d="M6 21v-9l6-5 6 5v9z" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    </svg>
  );
}

const FUNDS = [
  {
    name: "Tithe",
    icon: <HeartIcon />,
    text: "Returns a faithful tenth to support our pastors and the worldwide mission of the church.",
  },
  {
    name: "Offering",
    icon: <GiftIcon />,
    text: "Funds local ministries like Sabbath School, community outreach, and care for families in need.",
  },
  {
    name: "Building Fund",
    icon: <ChurchIcon />,
    text: "Helps build and maintain a welcoming home for worship at Invitation Hill.",
  },
];

const STEPS = [
  {
    title: "Create an account",
    text: "Sign up with your name and email in less than a minute.",
  },
  {
    title: "Choose an amount and fund",
    text: "Tap an amount, pick Tithe, Offering, or Building Fund, and give.",
  },
  {
    title: "See your giving history",
    text: "Every gift is saved to My Giving, with your running total.",
  },
];

export default async function Home() {
  // Logged in? Show your own welcome page instead of the public one.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return <MemberWelcome supabase={supabase} user={user} />;
  }

  return (
    <>
      <section className="hero">
        <h1>Give with a grateful heart</h1>
        <blockquote className="hero-verse">
          &ldquo;God loveth a cheerful giver.&rdquo;
          <cite>2 Corinthians 9:7 (KJV)</cite>
        </blockquote>
        <p className="lead">
          Support the ministry of Invitation Hill SDA Church through your tithes
          and offerings.
        </p>
        <div className="hero-actions">
          <Link href="/give" className="button button-accent button-large">
            Give now
          </Link>
          <Link href="/history" className="button button-large">
            My Giving
          </Link>
        </div>
        <p className="hero-find">
          Giving to another church? <Link href="/churches">Find your church</Link>
        </p>
      </section>

      <section className="home-section">
        <h2 className="home-heading">Where your gift goes</h2>
        <div className="fund-cards">
          {FUNDS.map((fund) => (
            <div key={fund.name} className="fund-card">
              <span className="fund-card-icon">{fund.icon}</span>
              <h3>{fund.name}</h3>
              <p>{fund.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2 className="home-heading">How giving works</h2>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="step">
              <span className="step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
