import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import TreasurerNav from "./TreasurerNav";
import UserMenu from "./UserMenu";

// Top bar. Shows different links depending on who is signed in:
// - visitors: Log in, Sign up
// - members: Home, My Giving, Give, their name, Log out
// - the treasurer: their name (opens My Giving and Log out), Give,
//   and a second row of tabs for the treasurer's pages
export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }
  const isTreasurer = profile?.role === "treasurer";

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-mark">✝</span> Invitation Hill SDA Church Giving
        </Link>

        <nav className="nav">
          {!user && (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup" className="button button-gold button-small">
                Sign up
              </Link>
            </>
          )}

          {user && !isTreasurer && (
            <>
              <Link href="/">Home</Link>
              <Link href="/history">My Giving</Link>
              <Link href="/give" className="button button-green button-small">
                Give
              </Link>
              <span className="nav-name">{profile?.full_name}</span>
              <form action={logout}>
                <button type="submit" className="nav-logout">
                  Log out
                </button>
              </form>
            </>
          )}

          {isTreasurer && (
            <>
              <UserMenu name={profile.full_name} logoutAction={logout} />
              <Link href="/give" className="button button-gold button-small">
                Give
              </Link>
            </>
          )}
        </nav>
      </header>

      {isTreasurer && <TreasurerNav />}
    </>
  );
}
