import Link from "next/link";
import { login } from "@/app/auth/actions";

export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;

  return (
    <section className="auth-card">
      <h1>Welcome back</h1>
      <p className="lead">Log in to give and see your giving history.</p>

      {error && <p className="error">{error}</p>}

      <form action={login} className="form">
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="button">
          Log in
        </button>
      </form>

      <p className="auth-switch">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </section>
  );
}
