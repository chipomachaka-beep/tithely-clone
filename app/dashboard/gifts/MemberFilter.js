"use client";

// "Member" dropdown on the Gifts page. Choosing a name shows only that
// person's gifts; "All members" shows everyone's.
import { useRouter } from "next/navigation";

export default function MemberFilter({ members, selected }) {
  const router = useRouter();

  function showMember(event) {
    const id = event.target.value;
    router.push(id ? `/dashboard/gifts?member=${id}` : "/dashboard/gifts");
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
