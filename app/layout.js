import { Inter, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
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
        <header className="site-header">
          <Link href="/" className="brand">
            <span className="brand-mark">✝</span> Grace Church Giving
          </Link>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          Demo app for a bootcamp. No real payments are processed.
        </footer>
      </body>
    </html>
  );
}
