import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Block unauthenticated users from protected routes
  // /tenant/search and /tenant/listing/* are public — only bookings/deposit require auth
  if (!user && (
    pathname.startsWith("/owner") ||
    pathname.startsWith("/admin") ||
    pathname === "/tenant/bookings" ||
    pathname.startsWith("/tenant/bookings/") ||
    pathname === "/tenant/deposit" ||
    pathname.startsWith("/tenant/deposit/")
  )) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Block role mismatches from /admin and /owner routes
  if (user && (pathname.startsWith("/admin") || pathname.startsWith("/owner"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (pathname.startsWith("/admin") && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (pathname.startsWith("/owner") && profile?.role !== "owner") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};