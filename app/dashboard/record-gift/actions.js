"use server";

// Treasurer action: record a cash or check gift from the offering envelope
// under a member's name.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FUND_LABELS } from "@/lib/format";
import { requireTreasurer, churchToday } from "@/lib/treasurer";

export async function recordEnvelopeGift(formData) {
  const { supabase } = await requireTreasurer();

  // Check the form values before saving. The database checks these too (and
  // only lets the treasurer record gifts for others), but here we can show a
  // friendly message.
  const memberId = String(formData.get("member_id") ?? "");
  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  const fund = formData.get("fund");
  const method = formData.get("method");
  const checkNumber = String(formData.get("check_number") ?? "").trim();
  const givenOn = String(formData.get("given_on") ?? "");
  const today = churchToday();

  let problem = null;
  if (memberId === "") {
    problem = "Please choose a member.";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    problem = "Please enter an amount greater than $0.";
  } else if (amount > 100000) {
    problem = "That amount is too large for this demo.";
  } else if (!FUND_LABELS[fund]) {
    problem = "Please choose a fund.";
  } else if (method !== "cash" && method !== "check") {
    problem = "Please choose cash or check.";
  } else if (method === "check" && !/^[A-Za-z0-9-]{1,20}$/.test(checkNumber)) {
    problem = "Please enter the check number (letters, numbers, and dashes, up to 20).";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(givenOn) || givenOn < "2000-01-01") {
    problem = "Please enter the gift date.";
  } else if (givenOn > today) {
    problem = "The gift date can't be in the future.";
  }
  if (problem) {
    redirect(`/dashboard/record-gift?error=${encodeURIComponent(problem)}`);
  }

  // Make sure the member exists (the treasurer can see every profile).
  const { data: member } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();
  if (!member) {
    redirect(`/dashboard/record-gift?error=${encodeURIComponent("That member could not be found.")}`);
  }

  const { error } = await supabase.from("donations").insert({
    user_id: memberId,
    amount,
    fund,
    method,
    check_number: method === "check" ? checkNumber : null,
    given_on: givenOn,
  });

  if (error) {
    redirect(`/dashboard/record-gift?error=${encodeURIComponent(`Could not record gift: ${error.message}`)}`);
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/history");
  redirect("/dashboard/gifts?recorded=1");
}
