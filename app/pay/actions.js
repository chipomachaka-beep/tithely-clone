"use server";

// Treasurer action: record a bill paid out of a church fund.
// Demo only: this saves a row in the database and never sends money.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CHURCH } from "@/lib/church";
import { FUND_LABELS, CATEGORY_LABELS } from "@/lib/format";

export async function recordPayment(formData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Check the form values before saving. The database checks these too
  // (and only lets the treasurer save), but here we can show a friendly message.
  const payee = String(formData.get("payee") ?? "").trim();
  const category = formData.get("category");
  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  const fund = formData.get("fund");
  const note = String(formData.get("note") ?? "").trim();

  let problem = null;
  if (payee === "" || payee.length > 100) {
    problem = "Please enter who the payment is to (up to 100 characters).";
  } else if (!CATEGORY_LABELS[category]) {
    problem = "Please choose a category.";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    problem = "Please enter an amount greater than $0.";
  } else if (amount > 1000000) {
    problem = "That amount is too large for this demo.";
  } else if (!FUND_LABELS[fund]) {
    problem = "Please choose which fund paid it.";
  } else if (note.length > 200) {
    problem = "Please keep the note to 200 characters or fewer.";
  }
  if (problem) {
    redirect(`/pay?error=${encodeURIComponent(problem)}`);
  }

  const { error } = await supabase.from("payments").insert({
    payee,
    category,
    amount,
    fund,
    note,
    recorded_by: user.id,
    // Today's date at the church (Mountain Time), as "2026-10-20".
    paid_on: new Date().toLocaleDateString("en-CA", { timeZone: CHURCH.timeZone }),
  });

  if (error) {
    redirect(`/pay?error=${encodeURIComponent(`Could not record payment: ${error.message}`)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?paid=1");
}
