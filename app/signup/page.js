import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default async function SignupPage({ searchParams }) {
  const { error } = await searchParams;

  return (
    <section className="auth-card">
      <h1>Create your account</h1>
      <p className="lead">Give online and keep track of your giving.</p>

      {error && <p className="error">{error}</p>}

      <form action={signup} className="form">
        <label>
          Full name
          <input name="full_name" type="text" required autoComplete="name" />
        </label>
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
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="button">
          Sign up
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </section>
  );
}
