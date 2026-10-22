"use client";

// The treasurer's menu, shown as a row of tabs under the header.
// The current page's tab is highlighted.
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/gifts", label: "Gifts" },
  { href: "/dashboard/record-gift", label: "Record Gift" },
  { href: "/dashboard/pay-bills", label: "Pay Bills" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/changes", label: "Change History" },
];

export default function TreasurerNav() {
  const pathname = usePathname();

  return (
    <nav className="treasurer-nav" aria-label="Treasurer">
      <div className="treasurer-nav-inner">
        {TABS.map((tab) => {
          // The tab stays highlighted on pages under it, like Edit gift under Gifts.
          const isCurrent =
            pathname === tab.href ||
            (tab.href !== "/dashboard" && pathname.startsWith(`${tab.href}/`));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="treasurer-tab"
              aria-current={isCurrent ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
