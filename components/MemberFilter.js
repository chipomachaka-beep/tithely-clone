"use client";

// "Member" dropdown on the treasurer's Overview, Gifts, and Reports pages.
// Choosing a name shows only that person's numbers; "All members" shows
// everyone's. The choice is kept in the address, like /dashboard/reports?member=...
import { usePathname, useRouter } from "next/navigation";

export default function MemberFilter({ members, selected }) {
  const router = useRouter();
  const pathname = usePathname();

  function showMember(event) {
    const id = event.target.value;
    router.push(id ? `${pathname}?member=${id}` : pathname);
  }

  return (
    <label className="member-filter">
      Member
      <select value={selected ?? ""} onChange={showMember}>
        <option value="">All members</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}
          </option>
        ))}
      </select>
    </label>
  );
}
