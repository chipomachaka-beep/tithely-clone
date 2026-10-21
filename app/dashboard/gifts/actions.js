"use server";

// Treasurer action: issue a receipt for one gift.
// The database function issue_receipt (supabase/receipts.sql) checks that the
// caller is the treasurer, picks the next number, and records the date.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTreasurer } from "@/lib/treasurer";
import { isMonthKey, monthRange } from "@/lib/months";

// Back to the Gifts page, keeping the "Member" dropdown choice if there was one.
function giftsPage(formData, extra = "") {
  const filter = String(formData.get("filter") ?? "");
  const params = new URLSearchParams();
  if (/^[0-9a-f-]{36}$/.test(filter)) params.set("member", filter);
  for (const [key, value] of new URLSearchParams(extra)) params.set(key, value);
  const query = params.toString();
  return query ? `/dashboard/gifts?${query}` : "/dashboard/gifts";
}

export async function sendReceipt(formData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("issue_receipt", {
    gift_id: formData.get("donation_id"),
  });

  if (error) {
    redirect(giftsPage(formData, `error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/", "layout");
  redirect(giftsPage(formData));
}

// Treasurer action: delete an envelope gift (cash or check) that has no
// receipt yet. The database rules (supabase/delete-rules.sql) refuse anything
// else, so asking it to delete a receipted or online gift deletes nothing.
export async function deleteGift(formData) {
  const { supabase } = await requireTreasurer();

  const { data, error } = await supabase
    .from("donations")
    .delete()
    .eq("id", formData.get("id"))
    .select("id");

  if (error || data.length === 0) {
    const reason = error
      ? error.message
      : "Only cash or check gifts without a receipt can be deleted.";
    redirect(`/dashboard/gifts?error=${encodeURIComponent(reason)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard/gifts?deleted=1");
}

// Treasurer action: send a member their statement for one month. Like Send
// receipt, this records that it was sent; the member then sees "Statement
// available" on My Giving. The database rules (supabase/statements.sql) only
// let the treasurer do this.
export async function sendStatement(formData) {
  const { supabase, user } = await requireTreasurer();

  const memberId = String(formData.get("member_id") ?? "");
  const month = String(formData.get("month") ?? "");
  if (!isMonthKey(month)) {
    redirect(giftsPage(formData, "error=That month isn't valid."));
  }

  // Only send a statement for a month the member actually gave in.
  const { first, next } = monthRange(month);
  const { count } = await supabase
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", memberId)
    .gte("given_on", first)
    .lt("given_on", next);
  if (!count) {
    redirect(giftsPage(formData, "error=That member has no gifts in that month."));
  }

  const { error } = await supabase
    .from("statements")
    .insert({ user_id: memberId, month, sent_by: user.id });

  // "23505" means it was already sent (one statement per member per month): fine.
  if (error && error.code !== "23505") {
    redirect(giftsPage(formData, `error=${encodeURIComponent(error.message)}`));
  }

  revalidatePath("/", "layout");
  redirect(giftsPage(formData, "statement=1"));
}
