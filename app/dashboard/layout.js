import RefreshWhenShown from "@/components/RefreshWhenShown";

// Shared by every treasurer page (Overview, Gifts, Record Gift, Pay Bills,
// Reports). Money totals must never come from an old copy, so these pages are
// always built fresh from the database on every visit.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function TreasurerLayout({ children }) {
  return (
    <div className="treasurer-page">
      <RefreshWhenShown />
      {children}
    </div>
  );
}
