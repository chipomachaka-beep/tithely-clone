import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GiveForm from "./GiveForm";

export default async function GivePage() {
  const supabase = await createClient();

  // You need to be signed in so the gift is recorded in your name.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <section className="give-card">
      <h1>Give</h1>
      <p className="lead">
        &ldquo;Each of you should give what you have decided in your heart to
        give.&rdquo; <span className="verse-ref">2 Corinthians 9:7</span>
      </p>
      <GiveForm />
    </section>
  );
}
