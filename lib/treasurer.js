// Shared pieces for the treasurer's pages (Overview, Gifts, Record Gift,
// Pay Bills, Reports).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CHURCH } from "@/lib/church";

// Every treasurer page and action starts here. Logged-out visitors go to
// login; members go to My Giving. (The database rules also stop members from
// reading other people's gifts or any payments.)
export async function requireTreasurer() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "treasurer") {
    redirect("/history");
  }

  return { supabase, user };
}

// Every gift, newest first, with the giver's name.
export async function loadGifts(supabase) {
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id, user_id, amount, fund, given_on, method, check_number, receipt_number, profiles(full_name)"
    )
    .order("given_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Could not load gifts: ${error.message}`);
  }
  return data;
}

// Every bill paid out of church funds, newest first, with who recorded it.
export async function loadPayments(supabase) {
  const { data, error } = await supabase
    .from("payments")
    .select("id, paid_on, payee, category, amount, fund, note, profiles(full_name)")
    .order("paid_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Could not load payments: ${error.message}`);
  }
  return data;
}

// Adds up amounts for each value of one column, e.g. totalsBy(gifts, "fund").
// Starts every key in `keys` at 0 so missing ones still show $0.00.
export function totalsBy(rows, column, keys) {
  const totals = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const row of rows) {
    totals[row[column]] += Number(row.amount);
  }
  return totals;
}

export function sum(rows) {
  return rows.reduce((total, row) => total + Number(row.amount), 0);
}

// Today's date at the church, as "2026-10-20".
export function churchToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: CHURCH.timeZone });
}

// The current month at the church: its "2026-10" prefix (dates in the
// database start with it) and its name, "October 2026".
export function churchMonth() {
  const now = new Date();
  return {
    prefix: churchToday().slice(0, 7),
    name: now.toLocaleDateString("en-US", {
      timeZone: CHURCH.timeZone,
      month: "long",
      year: "numeric",
    }),
  };
}
