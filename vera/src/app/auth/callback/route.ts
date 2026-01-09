import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if user has completed onboarding
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("onboarding_completed")
                    .eq("user_id", user.id)
                    .single();

                // If no profile or onboarding not completed, go to onboarding
                if (!profile || !profile.onboarding_completed) {
                    return NextResponse.redirect(`${origin}/onboarding`);
                }
            }

            // Otherwise go to dashboard
            return NextResponse.redirect(`${origin}/dashboard`);
        }
    }

    // Return to sign-in on error
    return NextResponse.redirect(`${origin}/sign-in?error=auth_error`);
}
