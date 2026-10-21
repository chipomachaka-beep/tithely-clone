"use server";

// Treasurer action: issue a receipt for one gift.
// The database function issue_receipt (supabase/receipts.sql) checks that the
// caller is the treasurer, picks the next number, and records the date.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
