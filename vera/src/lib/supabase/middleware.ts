import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

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
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Public routes that don't require auth
    const isPublicRoute =
        pathname === "/" ||
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up") ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/onboarding");

    // If user is signed in and on auth pages, redirect to dashboard
    if (user && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If user is signed in and on landing page, redirect to dashboard
    if (user && pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If not signed in and trying to access protected route, redirect to sign-in
    if (!user && !isPublicRoute) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return supabaseResponse;
}
