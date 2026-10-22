"use server";

// Treasurer action: issue a receipt for one gift.
// The database function issue_receipt (supabase/receipts.sql) checks that the
// caller is the treasurer, picks the next number, and records the date.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTreasurer, churchToday } from "@/lib/treasurer";
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

// Treasurer actions: save changes to, or delete, an envelope gift (cash or
// check) with no receipt, in a month whose statement hasn't been sent. Both
// need a reason. The database functions edit_envelope_gift and
// delete_envelope_gift (supabase/edit-history.sql) check all of that and write
// the change history.
export async function deleteGiftChange(formData) {
  const { supabase } = await requireTreasurer();

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    redirect(`/dashboard/gifts/${id}?error=${encodeURIComponent("Please give a short reason (at least 3 characters).")}`);
  }

  const { error } = await supabase.rpc("delete_envelope_gift", { gift_id: id, reason });
  if (error) {
    redirect(`/dashboard/gifts/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(giftsPage(formData, "deleted=1"));
}

export async function saveGiftChange(formData) {
  const { supabase } = await requireTreasurer();

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const editPage = (message) =>
    `/dashboard/gifts/${id}?error=${encodeURIComponent(message)}`;

  if (reason.length < 3) {
    redirect(editPage("Please give a short reason (at least 3 characters)."));
  }

  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  const method = formData.get("method");
  const checkNumber = String(formData.get("check_number") ?? "").trim();
  const givenOn = String(formData.get("given_on") ?? "");
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(editPage("Please enter an amount greater than $0."));
  }
  if (method === "check" && !/^[A-Za-z0-9-]{1,20}$/.test(checkNumber)) {
    redirect(editPage("Please enter the check number (letters, numbers, and dashes, up to 20)."));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(givenOn) || givenOn > churchToday()) {
    redirect(editPage("Please enter a gift date that isn't in the future."));
  }

  const { error } = await supabase.rpc("edit_envelope_gift", {
    gift_id: id,
    new_user_id: formData.get("member_id"),
    new_given_on: givenOn,
    new_amount: amount,
    new_fund: formData.get("fund"),
    new_method: method,
    new_check_number: method === "check" ? checkNumber : null,
    reason,
  });
  if (error) {
    redirect(editPage(error.message));
  }

  revalidatePath("/", "layout");
  redirect(giftsPage(formData, "edited=1"));
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
