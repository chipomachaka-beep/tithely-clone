import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

// Top bar. Shows different links depending on whether someone is signed in.
export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark">✝</span> Invitation Hill SDA Church Giving
      </Link>

      <nav className="nav">
        {user ? (
          <>
            <Link href="/history">My Giving</Link>
            <span className="nav-name">{profile?.full_name}</span>
            <form action={logout}>
              <button type="submit" className="nav-button">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="button button-gold button-small">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
