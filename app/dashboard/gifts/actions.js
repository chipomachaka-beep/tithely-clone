"use server";

// Treasurer action: issue a receipt for one gift.
// The database function issue_receipt (supabase/receipts.sql) checks that the
// caller is the treasurer, picks the next number, and records the date.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTreasurer } from "@/lib/treasurer";

export async function sendReceipt(formData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("issue_receipt", {
    gift_id: formData.get("donation_id"),
  });

  if (error) {
    redirect(`/dashboard/gifts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/history");
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/gifts");
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
