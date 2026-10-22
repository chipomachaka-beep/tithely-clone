"use server";

// Text to Give (demo): records a gift under the signed-in member's account with
// the method "text". No real text message is sent or received.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FUND_LABELS, formatMoney } from "@/lib/format";
import { churchToday } from "@/lib/treasurer";

export async function recordTextGift({ fund, amount }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please log in to give by text." };
  }

  if (!FUND_LABELS[fund]) {
    return { error: "Please reply 1, 2, or 3 to choose a fund." };
  }
  const cents = Math.round(Number(amount) * 100);
  if (!Number.isFinite(cents) || cents < 100 || cents > 1000000) {
    return { error: "Please reply with an amount from $1 to $10,000, like 25 or 25.50." };
  }

  // The database rules only allow this in the member's own name.
  const { error } = await supabase.from("donations").insert({
    user_id: user.id,
    amount: cents / 100,
    fund,
    method: "text",
    given_on: churchToday(),
  });
  if (error) {
    // 42501 / 23514: the database doesn't accept "text" gifts yet
    // (supabase/text-to-give.sql hasn't been run).
    const notSwitchedOn = error.code === "42501" || error.code === "23514";
    return {
      error: notSwitchedOn
        ? "Sorry, Text to Give isn't switched on for this church yet. Please give online for now."
        : "Sorry, your gift couldn't be recorded. Please try again, or give online.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true, amount: formatMoney(cents / 100), fund: FUND_LABELS[fund] };
}
