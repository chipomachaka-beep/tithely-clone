import { Inter, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { CHURCH } from "@/lib/church";
import "./globals.css";

const inter = Inter({ variable: "--font-body", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-heading", subsets: ["latin"] });

export const metadata = {
  title: "Tithely Clone",
  description: "A demo church giving app (no real payments).",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${serif.variable}`}>
        <SiteHeader />
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="footer-inner">
            <div>
              <p className="footer-name">
                <span className="brand-mark">✝</span> {CHURCH.name}
              </p>
              <address className="footer-address">
                {CHURCH.street}
                <br />
                {CHURCH.cityStateZip}
              </address>
            </div>
            <nav className="footer-links" aria-label="Footer">
              <Link href="/churches">Find your church</Link>
              <Link href="/give">Give</Link>
              <Link href="/history">My Giving</Link>
            </nav>
          </div>
          <p className="footer-note">
            Demo app for a bootcamp. No real payments are processed.
          </p>
        </footer>
      </body>
    </html>
  );
}
