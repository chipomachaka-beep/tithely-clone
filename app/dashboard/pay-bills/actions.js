"use server";

// Treasurer action: record a bill paid out of a church fund.
// Demo only: this saves a row in the database and never sends money.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FUND_LABELS, CATEGORY_LABELS } from "@/lib/format";
import { requireTreasurer, churchToday } from "@/lib/treasurer";

export async function recordPayment(formData) {
  const { supabase, user } = await requireTreasurer();

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
    redirect(`/dashboard/pay-bills?error=${encodeURIComponent(problem)}`);
  }

  const { error } = await supabase.from("payments").insert({
    payee,
    category,
    amount,
    fund,
    note,
    recorded_by: user.id,
    // Today's date at the church (Mountain Time), as "2026-10-20".
    paid_on: churchToday(),
  });

  if (error) {
    redirect(`/dashboard/pay-bills?error=${encodeURIComponent(`Could not record payment: ${error.message}`)}`);
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/pay-bills?paid=1");
}

// Treasurer actions: save changes to, or delete, a bill payment. Both need a
// reason. The database functions edit_payment and delete_payment
// (supabase/edit-history.sql) check the treasurer and write the change history.
export async function deletePaymentChange(formData) {
  const { supabase } = await requireTreasurer();

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    redirect(`/dashboard/pay-bills/${id}?error=${encodeURIComponent("Please give a short reason (at least 3 characters).")}`);
  }

  const { error } = await supabase.rpc("delete_payment", { payment_id: id, reason });
  if (error) {
    redirect(`/dashboard/pay-bills/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/pay-bills?deleted=1");
}

export async function savePaymentChange(formData) {
  const { supabase } = await requireTreasurer();

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const editPage = (message) =>
    `/dashboard/pay-bills/${id}?error=${encodeURIComponent(message)}`;

  if (reason.length < 3) {
    redirect(editPage("Please give a short reason (at least 3 characters)."));
  }

  const payee = String(formData.get("payee") ?? "").trim();
  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  const paidOn = String(formData.get("paid_on") ?? "");
  if (payee === "" || payee.length > 100) {
    redirect(editPage("Please enter who the payment is to (up to 100 characters)."));
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(editPage("Please enter an amount greater than $0."));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn) || paidOn > churchToday()) {
    redirect(editPage("Please enter a date that isn't in the future."));
  }

  const { error } = await supabase.rpc("edit_payment", {
    payment_id: id,
    new_paid_on: paidOn,
    new_payee: payee,
    new_category: formData.get("category"),
    new_amount: amount,
    new_fund: formData.get("fund"),
    new_note: String(formData.get("note") ?? "").trim(),
    reason,
  });
  if (error) {
    redirect(editPage(error.message));
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/pay-bills?edited=1");
}
