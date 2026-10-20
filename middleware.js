// Runs before every page request. It refreshes the Supabase login cookie
// so people stay signed in as they move around the site.
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Asking for the user is what triggers the refresh.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skip Next.js's own files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
