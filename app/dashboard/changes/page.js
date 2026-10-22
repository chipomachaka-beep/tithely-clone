import { requireTreasurer, loadChanges, loadMemberNames } from "@/lib/treasurer";
import ChangeHistory from "@/components/ChangeHistory";

export const metadata = {
  title: "Change History",
};

// Every edit and delete of a payment or envelope gift: what changed, the
// reason, who, and when. Nothing here can be changed or removed.
export default async function ChangesPage() {
  const { supabase } = await requireTreasurer();
  const [rows, names] = await Promise.all([loadChanges(supabase), loadMemberNames(supabase)]);

  return (
    <section>
      <h1>Change History</h1>
      <p className="lead">
        Every edit and delete of a bill payment or envelope gift, newest first.
      </p>
      <ChangeHistory rows={rows} names={names} />
    </section>
  );
}
