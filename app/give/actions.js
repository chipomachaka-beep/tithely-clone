"use server";

// Saves a gift. This is the "fake payment": we record the donation
// in the database and never charge a card.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FUND_LABELS } from "@/lib/format";

export async function give(previousState, formData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Check the form values before saving. The database checks these too,
  // but here we can show a friendly message.
  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Please choose an amount greater than $0." };
  }
  if (amount > 100000) {
    return { error: "For gifts over $100,000, please contact the church office." };
  }

  const fund = formData.get("fund");
  if (!FUND_LABELS[fund]) {
    return { error: "Please choose a fund." };
  }

  const { error } = await supabase.from("donations").insert({
    user_id: user.id,
    amount,
    fund,
    given_on: pickGiftDate(formData.get("given_on")),
  });

  if (error) {
    return { error: `Your gift could not be saved: ${error.message}` };
  }

  revalidatePath("/history");
  revalidatePath("/dashboard");
  redirect("/history?gave=1");
}

// The form sends the giver's local date (so an evening gift isn't stamped
// "tomorrow" by the server's UTC clock). Only accept it if it's within a day
// of the server's date; otherwise use the server's date.
function pickGiftDate(localDate) {
  const today = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate ?? "")) {
    return today;
  }
  const oneDay = 24 * 60 * 60 * 1000;
  const difference = Math.abs(new Date(localDate) - new Date(today));
  return difference <= oneDay ? localDate : today;
}
